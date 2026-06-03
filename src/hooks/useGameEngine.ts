import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivePiece, GameAction, GamePhase, GameState, TetrominoType } from '../types';
import {
  clearRows,
  collides,
  computeGhost,
  createEmptyGrid,
  findFullRows,
  gravityForLevel,
  hardDropScore,
  isTetris,
  levelForLines,
  mergePiece,
  rotatePiece,
  scoreForLines,
  shuffleBag,
  softDropScore,
  spawnPiece,
} from '../lib/gameLogic';
import { haptic } from '../lib/haptics';

const LOCK_DELAY = 450;
const LINE_CLEAR_DURATION = 320;

function refillQueue(queue: TetrominoType[]): TetrominoType[] {
  let next = [...queue];
  while (next.length < 7) {
    next = next.concat(shuffleBag());
  }
  return next;
}

function initialState(): GameState {
  const queue = refillQueue([]);
  return {
    grid: createEmptyGrid(),
    active: null,
    ghost: null,
    nextQueue: queue,
    phase: 'start',
    stats: { score: 0, level: 1, lines: 0, durationSeconds: 0 },
    activeHue: 326,
    lineClear: null,
    lockPulse: 0,
    shake: 0,
  };
}

export interface GameEngineApi {
  state: GameState;
  dispatch: (action: GameAction) => void;
  isNewBest: boolean;
}

export function useGameEngine(currentBest: number): GameEngineApi {
  const [state, setState] = useState<GameState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const rafRef = useRef<number | null>(null);
  const lastTick = useRef<number>(0);
  const dropAccumulator = useRef<number>(0);
  const lockTimer = useRef<number>(0);
  const isLocking = useRef<boolean>(false);
  const lineClearUntil = useRef<number>(0);
  const startTime = useRef<number>(0);
  const softDropping = useRef<boolean>(false);
  const bestRef = useRef(currentBest);
  bestRef.current = currentBest;
  const [isNewBest, setIsNewBest] = useState(false);

  const setSafe = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => updater(prev));
  }, []);

  const lockAndAdvance = useCallback(
    (now: number) => {
      setSafe((prev) => {
        if (!prev.active) return prev;
        const merged = mergePiece(prev.grid, prev.active);
        const fullRows = findFullRows(merged);

        if (fullRows.length > 0) {
          if (isTetris(fullRows.length)) haptic('tetris');
          else haptic('lineClear');
          lineClearUntil.current = now + LINE_CLEAR_DURATION;
          return {
            ...prev,
            grid: merged,
            active: null,
            ghost: null,
            lineClear: { rows: fullRows, startedAt: now },
            shake: Math.min(1, fullRows.length / 3),
            lockPulse: 1,
          };
        }

        haptic('lock');
        // spawn next immediately
        const queue = refillQueue(prev.nextQueue);
        const nextType = queue[0];
        const piece = spawnPiece(nextType);
        if (collides(merged, piece)) {
          haptic('gameOver');
          const finalDuration = Math.round((now - startTime.current) / 1000);
          if (prev.stats.score > bestRef.current) setIsNewBest(true);
          return {
            ...prev,
            grid: merged,
            active: null,
            ghost: null,
            phase: 'gameover',
            stats: { ...prev.stats, durationSeconds: finalDuration },
          };
        }
        return {
          ...prev,
          grid: merged,
          active: piece,
          ghost: computeGhost(merged, piece),
          nextQueue: queue.slice(1),
          activeHue: piece.hue,
          lockPulse: 1,
        };
      });
      isLocking.current = false;
      lockTimer.current = 0;
    },
    [setSafe]
  );

  const finishLineClear = useCallback(
    (now: number) => {
      setSafe((prev) => {
        if (!prev.lineClear) return prev;
        const cleared = clearRows(prev.grid, prev.lineClear.rows);
        const linesCount = prev.lineClear.rows.length;
        const newLines = prev.stats.lines + linesCount;
        const newLevel = levelForLines(newLines);
        const gained = scoreForLines(linesCount, prev.stats.level);
        const queue = refillQueue(prev.nextQueue);
        const nextType = queue[0];
        const piece = spawnPiece(nextType);
        if (collides(cleared, piece)) {
          haptic('gameOver');
          const finalDuration = Math.round((now - startTime.current) / 1000);
          const finalScore = prev.stats.score + gained;
          if (finalScore > bestRef.current) setIsNewBest(true);
          return {
            ...prev,
            grid: cleared,
            active: null,
            ghost: null,
            lineClear: null,
            phase: 'gameover',
            stats: {
              score: finalScore,
              level: newLevel,
              lines: newLines,
              durationSeconds: finalDuration,
            },
          };
        }
        return {
          ...prev,
          grid: cleared,
          active: piece,
          ghost: computeGhost(cleared, piece),
          nextQueue: queue.slice(1),
          lineClear: null,
          activeHue: piece.hue,
          stats: {
            score: prev.stats.score + gained,
            level: newLevel,
            lines: newLines,
            durationSeconds: prev.stats.durationSeconds,
          },
        };
      });
    },
    [setSafe]
  );

  // main loop
  useEffect(() => {
    const loop = (now: number) => {
      const prev = stateRef.current;
      if (prev.phase === 'playing') {
        const dt = now - lastTick.current;
        lastTick.current = now;

        // decay visual effects
        if (prev.lockPulse > 0 || prev.shake > 0) {
          setSafe((s) => ({
            ...s,
            lockPulse: Math.max(0, s.lockPulse - dt / 220),
            shake: Math.max(0, s.shake - dt / 240),
          }));
        }

        // resolve line clear
        if (prev.lineClear) {
          if (now >= lineClearUntil.current) finishLineClear(now);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (prev.active) {
          const gravity = gravityForLevel(prev.stats.level);
          const effective = softDropping.current ? Math.min(gravity, 45) : gravity;
          dropAccumulator.current += dt;

          if (dropAccumulator.current >= effective) {
            dropAccumulator.current = 0;
            const canFall = !collides(prev.grid, prev.active, 0, 1);
            if (canFall) {
              isLocking.current = false;
              lockTimer.current = 0;
              setSafe((s) =>
                s.active
                  ? {
                      ...s,
                      active: { ...s.active, y: s.active.y + 1 },
                      stats: softDropping.current
                        ? { ...s.stats, score: s.stats.score + softDropScore(1) }
                        : s.stats,
                    }
                  : s
              );
            } else {
              if (!isLocking.current) {
                isLocking.current = true;
                lockTimer.current = now;
              }
            }
          }

          // lock delay
          if (isLocking.current && now - lockTimer.current >= LOCK_DELAY) {
            if (collides(stateRef.current.grid, stateRef.current.active!, 0, 1)) {
              lockAndAdvance(now);
            } else {
              isLocking.current = false;
              lockTimer.current = 0;
            }
          }
        }
      } else {
        lastTick.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setSafe, lockAndAdvance, finishLineClear]);

  // duration ticker
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = window.setInterval(() => {
      setSafe((s) => {
        if (s.phase !== 'playing') return s;
        return {
          ...s,
          stats: {
            ...s.stats,
            durationSeconds: Math.round((performance.now() - startTime.current) / 1000),
          },
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.phase, setSafe]);

  const startGame = useCallback(() => {
    setIsNewBest(false);
    const queue = refillQueue([]);
    const firstType = queue[0];
    const piece = spawnPiece(firstType);
    const grid = createEmptyGrid();
    startTime.current = performance.now();
    lastTick.current = performance.now();
    dropAccumulator.current = 0;
    isLocking.current = false;
    softDropping.current = false;
    setState({
      grid,
      active: piece,
      ghost: computeGhost(grid, piece),
      nextQueue: queue.slice(1),
      phase: 'playing',
      stats: { score: 0, level: 1, lines: 0, durationSeconds: 0 },
      activeHue: piece.hue,
      lineClear: null,
      lockPulse: 0,
      shake: 0,
    });
  }, []);

  const tryMove = useCallback(
    (dx: number) => {
      setSafe((s) => {
        if (s.phase !== 'playing' || !s.active || s.lineClear) return s;
        if (!collides(s.grid, s.active, dx, 0)) {
          const moved: ActivePiece = { ...s.active, x: s.active.x + dx };
          haptic('move');
          if (isLocking.current && !collides(s.grid, moved, 0, 1)) {
            isLocking.current = false;
            lockTimer.current = 0;
          }
          return { ...s, active: moved, ghost: computeGhost(s.grid, moved) };
        }
        return s;
      });
    },
    [setSafe]
  );

  const tryRotate = useCallback(() => {
    setSafe((s) => {
      if (s.phase !== 'playing' || !s.active || s.lineClear) return s;
      const rotated = rotatePiece(s.grid, s.active, 1);
      if (rotated) {
        haptic('rotate');
        if (isLocking.current && !collides(s.grid, rotated, 0, 1)) {
          isLocking.current = false;
          lockTimer.current = 0;
        }
        return { ...s, active: rotated, ghost: computeGhost(s.grid, rotated), lockPulse: 0.4 };
      }
      return s;
    });
  }, [setSafe]);

  const hardDrop = useCallback(() => {
    setSafe((s) => {
      if (s.phase !== 'playing' || !s.active || s.lineClear) return s;
      let dropDist = 0;
      while (!collides(s.grid, s.active, 0, dropDist + 1)) dropDist++;
      if (dropDist === 0) return s;
      const dropped: ActivePiece = { ...s.active, y: s.active.y + dropDist };
      haptic('hardDrop');
      isLocking.current = false;
      // schedule immediate lock on next frame
      requestAnimationFrame((t) => lockAndAdvance(t));
      return {
        ...s,
        active: dropped,
        ghost: dropped,
        stats: { ...s.stats, score: s.stats.score + hardDropScore(dropDist) },
        lockPulse: 1,
      };
    });
  }, [setSafe, lockAndAdvance]);

  const dispatch = useCallback(
    (action: GameAction) => {
      switch (action) {
        case 'start':
        case 'restart':
          startGame();
          break;
        case 'moveLeft':
          tryMove(-1);
          break;
        case 'moveRight':
          tryMove(1);
          break;
        case 'rotate':
          tryRotate();
          break;
        case 'softDrop':
          softDropping.current = true;
          window.setTimeout(() => {
            softDropping.current = false;
          }, 220);
          break;
        case 'hardDrop':
          hardDrop();
          break;
        case 'pause':
          setSafe((s) => (s.phase === 'playing' ? { ...s, phase: 'paused' as GamePhase } : s));
          break;
        case 'resume':
          setSafe((s) => {
            if (s.phase === 'paused') {
              lastTick.current = performance.now();
              return { ...s, phase: 'playing' as GamePhase };
            }
            return s;
          });
          break;
      }
    },
    [startGame, tryMove, tryRotate, hardDrop, setSafe]
  );

  // auto-pause on blur
  useEffect(() => {
    const onBlur = () => {
      if (stateRef.current.phase === 'playing') dispatch('pause');
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onBlur();
    });
    return () => window.removeEventListener('blur', onBlur);
  }, [dispatch]);

  // keyboard support (desktop testing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const phase = stateRef.current.phase;
      if (phase !== 'playing') {
        if ((e.key === ' ' || e.key === 'Enter') && (phase === 'start' || phase === 'gameover')) {
          dispatch('start');
        }
        if (e.key === 'p' && phase === 'paused') dispatch('resume');
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          dispatch('moveLeft');
          break;
        case 'ArrowRight':
          e.preventDefault();
          dispatch('moveRight');
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch('rotate');
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch('softDrop');
          break;
        case ' ':
          e.preventDefault();
          dispatch('hardDrop');
          break;
        case 'p':
          dispatch('pause');
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return { state, dispatch, isNewBest };
}

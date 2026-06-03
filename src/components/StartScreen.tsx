import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trophy, Zap, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameCanvas } from './GameCanvas';
import { createEmptyGrid, computeGhost, mergePiece, spawnPiece, collides, shuffleBag } from '../lib/gameLogic';
import type { GameState, TetrominoType } from '../types';

interface StartScreenProps {
  best: number;
  onPlay: () => void;
  onOpenLeaderboard: () => void;
}

function buildDemoState(grid: GameState['grid'], type: TetrominoType, x: number, y: number): GameState {
  const piece = { ...spawnPiece(type), x, y };
  const ghost = computeGhost(grid, piece);
  return {
    grid,
    active: piece,
    ghost,
    nextQueue: [],
    phase: 'start',
    stats: { score: 0, level: 1, lines: 0, durationSeconds: 0 },
    activeHue: piece.hue,
    lineClear: null,
    lockPulse: 0,
    shake: 0,
  };
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function StartScreen({ best, onPlay, onOpenLeaderboard }: StartScreenProps) {
  const [demoState, setDemoState] = useState<GameState>(() =>
    buildDemoState(createEmptyGrid(), 'T', 4, 0)
  );
  const gridRef = useRef(createEmptyGrid());
  const bagRef = useRef<TetrominoType[]>(shuffleBag());
  const pieceRef = useRef({ type: bagRef.current[0], x: 4, y: 0 });

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDemoState(buildDemoState(createEmptyGrid(), 'L', 4, 0));
      return;
    }

    let active = true;
    let lastDrop = performance.now();
    let raf = 0;

    const nextPiece = () => {
      if (bagRef.current.length <= 1) bagRef.current = [...bagRef.current, ...shuffleBag()];
      bagRef.current = bagRef.current.slice(1);
      const type = bagRef.current[0];
      const spawn = spawnPiece(type);
      pieceRef.current = { type, x: spawn.x, y: spawn.y };
    };

    const tick = (now: number) => {
      if (!active) return;
      if (now - lastDrop > 480) {
        lastDrop = now;
        const p = pieceRef.current;
        const piece = { ...spawnPiece(p.type), x: p.x, y: p.y };
        if (!collides(gridRef.current, piece, 0, 1)) {
          pieceRef.current = { ...p, y: p.y + 1 };
        } else {
          gridRef.current = mergePiece(gridRef.current, piece);
          // keep demo board from filling up
          const filledRows = gridRef.current.filter((r) => r.some((c) => c !== 0)).length;
          if (filledRows > 14) gridRef.current = createEmptyGrid();
          nextPiece();
        }
      }
      const p = pieceRef.current;
      setDemoState(buildDemoState(gridRef.current, p.type, p.x, p.y));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col px-5 pb-5 pt-6 safe-top safe-bottom"
    >
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
        className="text-center"
      >
        <Badge className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.35)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
          <Zap size={11} strokeWidth={2.4} /> Synthwave Arcade
        </Badge>
        <h1 className="font-display text-[clamp(2.6rem,13vw,4rem)] font-extrabold leading-[0.92] tracking-tight text-[#F4ECFF] drop-shadow-[0_0_28px_rgba(var(--accent-rgb),0.6)]">
          VIBRA
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">
            TETRIS
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-sm leading-relaxed text-[#8B7BB0]">
          Stack glowing blocks, clear neon lines, ride the speed. Pure 60fps arcade in your pocket.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.12 }}
        className="relative mx-auto mt-5 flex min-h-0 w-full max-w-[260px] flex-1 items-center justify-center"
      >
        <GameCanvas state={demoState} />
        <motion.div
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(var(--accent-rgb),0.4)] bg-[#0A0613]/70 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent2)] backdrop-blur-sm"
        >
          Your Turn
        </motion.div>
      </motion.div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(var(--accent-rgb),0)', '0 0 18px -4px rgba(var(--accent-rgb),0.7)', '0 0 0px rgba(var(--accent-rgb),0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.4)] bg-[#150B26]/70 px-3 py-1.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7BB0]">LV</span>
          <span className="font-display text-base font-extrabold text-[var(--accent)]">1</span>
        </motion.div>
        <div className="flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.2)] bg-[#150B26]/70 px-3 py-1.5">
          <Trophy size={13} className="text-[var(--accent2)]" strokeWidth={2.2} />
          {best > 0 ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7BB0]">Best</span>
              <span className="font-display text-base font-extrabold tabular-nums text-[#F4ECFF]">
                {formatNum(best)}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-semibold text-[#8B7BB0]">Set your first record</span>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.2 }}
        className="mt-5 flex flex-col gap-3"
      >
        <Button
          onClick={onPlay}
          className="h-14 w-full gap-2 rounded-2xl bg-[var(--accent)] text-lg font-extrabold uppercase tracking-[0.12em] text-[#0A0613] shadow-[0_0_36px_-8px_rgba(var(--accent-rgb),0.85)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Play size={20} strokeWidth={2.6} fill="currentColor" /> Tap to Play
        </Button>
        <Button
          variant="outline"
          onClick={onOpenLeaderboard}
          className="h-12 w-full gap-2 rounded-2xl border-[rgba(var(--accent-rgb),0.3)] bg-transparent text-sm font-bold uppercase tracking-wide text-[#F4ECFF] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.12)] active:scale-[0.98]"
        >
          <ListOrdered size={17} strokeWidth={2.2} /> Leaderboard
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default StartScreen;

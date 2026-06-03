import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListOrdered, X } from 'lucide-react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useHighScore } from '../hooks/useHighScore';
import { useDynamicAccent } from '../hooks/useDynamicAccent';
import { useTouchControls } from '../hooks/useTouchControls';
import { gravityForLevel } from '../lib/gameLogic';
import { DynamicGlowBackground } from './DynamicGlowBackground';
import { GameCanvas } from './GameCanvas';
import { HudBar } from './HudBar';
import { TouchControls } from './TouchControls';
import { StartScreen } from './StartScreen';
import { GameOverModal } from './GameOverModal';
import { PauseOverlay } from './PauseOverlay';
import { InstallPrompt } from './InstallPrompt';
import { Leaderboard } from './Leaderboard';

export function GameShell() {
  const high = useHighScore();
  const { state, dispatch, isNewBest } = useGameEngine(high.best);
  const touch = useTouchControls(dispatch, state.phase === 'playing');
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  // breathe accent hue toward active piece
  useDynamicAccent(
    state.phase === 'playing' ? state.activeHue : null,
    state.phase === 'playing'
  );

  // record personal best when game ends
  useEffect(() => {
    if (state.phase === 'gameover') {
      high.recordScore(state.stats.score);
    }
  }, [state.phase, state.stats.score]); // eslint-disable-line react-hooks/exhaustive-deps

  // bind gesture surface to the canvas wrapper
  useEffect(() => {
    touch.bind(surfaceRef.current);
  }, [touch]);

  // tension intensity for background bloom (rises with drop speed)
  const gravity = gravityForLevel(state.stats.level);
  const intensity = Math.min(1, (800 - gravity) / 740);

  const isPlaying = state.phase === 'playing' || state.phase === 'paused';

  return (
    <div className="relative flex h-[100dvh] w-full justify-center overflow-hidden">
      <DynamicGlowBackground hue={state.activeHue} intensity={intensity} />

      <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col px-3 safe-top safe-bottom sm:px-4">
        <AnimatePresence mode="wait">
          {state.phase === 'start' ? (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex h-full flex-col"
            >
              <StartScreen
                best={high.best}
                hasRecord={high.hasRecord}
                onStart={() => dispatch('start')}
                onShowBoard={() => setShowBoard(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex h-full flex-col"
            >
              <div className="shrink-0 pt-2">
                <HudBar
                  stats={state.stats}
                  nextQueue={state.nextQueue}
                  best={high.best}
                  intensity={intensity}
                  onPause={() => dispatch('pause')}
                  onShowBoard={() => setShowBoard(true)}
                />
              </div>

              <div
                ref={surfaceRef}
                className="relative flex min-h-0 flex-1 items-center justify-center py-2"
              >
                <GameCanvas state={state} className="mx-auto" />
              </div>

              <div className="shrink-0">
                <TouchControls
                  controls={touch}
                  disabled={!isPlaying || state.phase === 'paused'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PauseOverlay
        open={state.phase === 'paused'}
        onResume={() => dispatch('resume')}
        onRestart={() => dispatch('restart')}
      />

      <GameOverModal
        open={state.phase === 'gameover'}
        stats={state.stats}
        isNewBest={isNewBest}
        best={high.best}
        playerId={high.playerId}
        playerName={high.playerName}
        onChangeName={high.setPlayerName}
        onPlayAgain={() => dispatch('restart')}
      />

      <AnimatePresence>
        {showBoard && (
          <motion.div
            key="board"
            className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[#0A0613]/80 backdrop-blur-md"
              onClick={() => setShowBoard(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="relative z-10 w-full max-w-[440px] px-3 pb-4 safe-bottom sm:px-4"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 font-display text-lg font-extrabold neon-text">
                  <ListOrdered size={20} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                  LEADERBOARD
                </h3>
                <button
                  onClick={() => setShowBoard(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(var(--accent-rgb),0.3)] text-[#F4ECFF] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.15)] active:scale-95"
                  aria-label="Close leaderboard"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
              <Leaderboard playerId={high.playerId} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallPrompt />
    </div>
  );
}

export default GameShell;

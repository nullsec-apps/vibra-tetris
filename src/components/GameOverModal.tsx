import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCw, Send, Sparkles, Clock, Layers, Gauge, Check, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GameStats, SubmitScorePayload } from '../types';
import { useSubmitScore } from '../hooks/useSubmitScore';
import { haptic } from '../lib/haptics';

interface GameOverModalProps {
  open: boolean;
  stats: GameStats;
  isNewBest: boolean;
  best: number;
  playerId: string;
  playerName: string;
  onChangeName: (name: string) => void;
  onPlayAgain: () => void;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameOverModal({
  open,
  stats,
  isNewBest,
  best,
  playerId,
  playerName,
  onChangeName,
  onPlayAgain,
}: GameOverModalProps) {
  const { status, error, submit, reset } = useSubmitScore();
  const [name, setName] = useState(playerName);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (open) {
      submittedRef.current = false;
      reset();
      setName(playerName);
      if (isNewBest) haptic('tetris');
    }
  }, [open, playerName, reset, isNewBest]);

  const stat = useMemo(
    () => [
      { icon: Gauge, label: 'LEVEL', value: formatNum(stats.level) },
      { icon: Layers, label: 'LINES', value: formatNum(stats.lines) },
      { icon: Clock, label: 'TIME', value: formatTime(stats.durationSeconds) },
    ],
    [stats]
  );

  const handleSubmit = async () => {
    if (submittedRef.current || status === 'submitting') return;
    submittedRef.current = true;
    const trimmed = name.trim().slice(0, 16);
    if (trimmed) onChangeName(trimmed);
    const payload: SubmitScorePayload = {
      player_id: playerId,
      player_name: trimmed || null,
      score: stats.score,
      level: stats.level,
      lines_cleared: stats.lines,
      duration_seconds: stats.durationSeconds,
    };
    await submit(payload);
  };

  const submitted = status === 'success' || status === 'queued';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 safe-top safe-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-[#0A0613]/85 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-[420px] surface-panel neon-border rounded-3xl p-6 sm:p-7"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            {isNewBest && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 16 }}
                className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest neon-border"
                style={{ color: 'var(--accent)' }}
              >
                <Sparkles size={16} strokeWidth={2} />
                NEW BEST!
              </motion.div>
            )}

            <p className="text-center text-xs font-medium tracking-[0.35em] text-[#8B7BB0]">
              GAME OVER
            </p>
            <h2 className="mt-1 text-center font-display text-5xl font-extrabold leading-none neon-accent tabular-nums">
              {formatNum(stats.score)}
            </h2>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-[#8B7BB0]">
              <Trophy size={13} strokeWidth={2} />
              BEST {formatNum(Math.max(best, stats.score))}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {stat.map(({ icon: Icon, label, value }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="rounded-2xl border border-[rgba(var(--accent-rgb),0.18)] bg-[#150B26]/70 p-3 text-center"
                >
                  <Icon size={16} strokeWidth={1.5} className="mx-auto text-[#8B7BB0]" />
                  <div className="mt-1.5 font-display text-lg font-bold tabular-nums text-[#F4ECFF]">
                    {value}
                  </div>
                  <div className="text-[10px] tracking-widest text-[#8B7BB0]">{label}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 space-y-2.5">
              {!submitted ? (
                <>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a handle for the board"
                    maxLength={16}
                    className="h-12 rounded-2xl border-[rgba(var(--accent-rgb),0.3)] bg-[#0A0613]/60 text-center text-base tracking-wide text-[#F4ECFF] placeholder:text-[#8B7BB0] focus-visible:ring-[var(--accent)]"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={status === 'submitting'}
                    className="h-12 w-full rounded-2xl bg-[var(--accent)] text-base font-bold tracking-wide text-[#0A0613] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    style={{ boxShadow: '0 0 24px rgba(var(--accent-rgb),0.5)' }}
                  >
                    {status === 'submitting' ? (
                      'SUBMITTING…'
                    ) : (
                      <>
                        <Send size={18} strokeWidth={2} /> SUBMIT TO LEADERBOARD
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--accent-rgb),0.25)] bg-[#0A0613]/50 py-3 text-sm text-[#F4ECFF]"
                >
                  {status === 'queued' ? (
                    <>
                      <WifiOff size={16} strokeWidth={2} className="text-[#8B7BB0]" />
                      Saved — will sync when online
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                      Posted to the leaderboard!
                    </>
                  )}
                </motion.div>
              )}
              {error && status !== 'queued' && (
                <p className="text-center text-xs text-[#FF6B9B]">{error}</p>
              )}
            </div>

            <Button
              onClick={onPlayAgain}
              variant="outline"
              className="mt-3 h-12 w-full rounded-2xl border-[rgba(var(--accent-rgb),0.4)] bg-transparent text-base font-bold tracking-wide text-[#F4ECFF] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.12)] active:scale-[0.98]"
            >
              <RotateCw size={18} strokeWidth={2} /> PLAY AGAIN
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GameOverModal;

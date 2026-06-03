import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Trophy, ListOrdered } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NextPiecePreview } from './NextPiecePreview';
import type { GameStats, TetrominoType } from '../types';

interface HudBarProps {
  stats: GameStats;
  best: number;
  intensity: number;
  nextQueue: TetrominoType[];
  onPause: () => void;
  onOpenLeaderboard: () => void;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

function useAnimatedNumber(value: number): number {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const duration = 320;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(start + diff * eased);
      ref.current = cur;
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return display;
}

function StatBlock({
  label,
  value,
  intensity,
  big,
}: {
  label: string;
  value: number;
  intensity: number;
  big?: boolean;
}) {
  const animated = useAnimatedNumber(value);
  const glow = 8 + intensity * 22;
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8B7BB0]">{label}</span>
      <span
        className={`font-display font-extrabold tabular-nums leading-none text-[#F4ECFF] ${
          big ? 'text-2xl sm:text-3xl' : 'text-lg'
        }`}
        style={{ textShadow: `0 0 ${glow}px rgba(var(--accent-rgb),${0.4 + intensity * 0.4})` }}
      >
        {formatNum(animated)}
      </span>
    </div>
  );
}

export function HudBar({ stats, best, intensity, nextQueue, onPause, onOpenLeaderboard }: HudBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className="flex flex-col gap-2.5 px-3 pt-3 safe-top"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(var(--accent-rgb),0)',
                `0 0 ${10 + intensity * 18}px -2px rgba(var(--accent-rgb),0.7)`,
                '0 0 0px rgba(var(--accent-rgb),0)',
              ],
            }}
            transition={{ duration: Math.max(0.7, 1.8 - intensity), repeat: Infinity }}
            className="flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.4)] bg-[#150B26]/80 px-3 py-1.5"
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8B7BB0]">LV</span>
            <span className="font-display text-base font-extrabold leading-none text-[var(--accent)]">
              {stats.level}
            </span>
          </motion.div>
          <Badge className="flex items-center gap-1 rounded-full border border-[rgba(22,224,255,0.3)] bg-[rgba(22,224,255,0.08)] px-2.5 py-1 text-[10px] font-bold text-[var(--accent2)]">
            <Trophy size={11} strokeWidth={2.4} />
            <span className="tabular-nums">{best > 0 ? formatNum(best) : '—'}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Leaderboard"
            onClick={onOpenLeaderboard}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--accent-rgb),0.25)] bg-[#150B26]/80 text-[#F4ECFF] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.16)] active:scale-95"
          >
            <ListOrdered size={18} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Pause"
            onClick={onPause}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.24)] active:scale-95"
          >
            <Pause size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 rounded-2xl border border-[rgba(var(--accent-rgb),0.2)] bg-[#150B26]/60 px-4 py-3">
        <StatBlock label="Score" value={stats.score} intensity={intensity} big />
        <div className="flex items-end gap-4">
          <StatBlock label="Lines" value={stats.lines} intensity={intensity * 0.5} />
          <div className="w-[88px]">
            <NextPiecePreview queue={nextQueue} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HudBar;

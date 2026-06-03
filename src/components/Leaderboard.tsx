import { motion } from 'framer-motion';
import { Crown, RefreshCw, Sparkles, Trophy, WifiOff, AlertTriangle, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { isSampleRow } from '../lib/sampleScores';
import type { ScoreRow } from '../types';

interface LeaderboardProps {
  playerId: string;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

function rankColor(rank: number): string {
  if (rank === 1) return '#FFE14D';
  if (rank === 2) return '#16E0FF';
  if (rank === 3) return '#FF8A3D';
  return '#8B7BB0';
}

function Row({ row, rank, isYou }: { row: ScoreRow; rank: number; isYou: boolean }) {
  const sample = isSampleRow(row);
  const color = rankColor(rank);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.03, 0.4) }}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-200 ${
        isYou
          ? 'border-[rgba(var(--accent-rgb),0.5)] bg-[rgba(var(--accent-rgb),0.1)]'
          : 'border-[rgba(var(--accent-rgb),0.12)] bg-[#0A0613]/40 hover:bg-[#150B26]/60'
      }`}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-sm font-extrabold tabular-nums"
        style={{
          color,
          background: rank <= 3 ? `${color}22` : 'transparent',
        }}
      >
        {rank === 1 ? <Crown size={16} strokeWidth={2} /> : rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-[#F4ECFF]">
            {row.player_name || 'ANON'}
          </p>
          {isYou && (
            <span className="shrink-0 rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#0A0613]">
              YOU
            </span>
          )}
          {sample && (
            <span className="shrink-0 rounded-md border border-[rgba(var(--accent-rgb),0.3)] px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[#8B7BB0]">
              SAMPLE
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#8B7BB0]">
          LV {formatNum(row.level)} · {formatNum(row.lines_cleared)} lines
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-base font-extrabold tabular-nums text-[#F4ECFF]">
          {formatNum(row.score)}
        </div>
      </div>
    </motion.div>
  );
}

export function Leaderboard({ playerId }: LeaderboardProps) {
  const { rows, status, usingSample, refresh } = useLeaderboard(20);

  return (
    <Card className="overflow-hidden rounded-3xl border-[rgba(var(--accent-rgb),0.25)] surface-panel p-0">
      <div className="flex items-center justify-between border-b border-[rgba(var(--accent-rgb),0.15)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          <span className="font-display text-sm font-extrabold tracking-wide text-[#F4ECFF]">
            TOP SCORES
          </span>
          {status === 'offline' && (
            <Badge className="gap-1 border-none bg-[rgba(139,123,176,0.2)] text-[10px] text-[#8B7BB0]">
              <WifiOff size={11} strokeWidth={2} /> OFFLINE
            </Badge>
          )}
          {status === 'error' && (
            <Badge className="gap-1 border-none bg-[rgba(255,107,155,0.18)] text-[10px] text-[#FF6B9B]">
              <AlertTriangle size={11} strokeWidth={2} /> CACHED
            </Badge>
          )}
        </div>
        <button
          onClick={() => refresh()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B7BB0] transition-all duration-200 hover:rotate-90 hover:text-[var(--accent)] active:scale-90"
          aria-label="Refresh leaderboard"
        >
          <RefreshCw size={16} strokeWidth={2} />
        </button>
      </div>

      {usingSample && (
        <div className="flex items-center gap-2 border-b border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--accent-rgb),0.06)] px-4 py-2">
          <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          <p className="text-[11px] text-[#8B7BB0]">
            {status === 'offline'
              ? 'Showing sample scores — reconnect to load the live board'
              : 'Sample scores shown. Set your first record to top the real board!'}
          </p>
        </div>
      )}

      <ScrollArea className="h-[min(56vh,420px)] px-3 py-3">
        {status === 'loading' ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(var(--accent-rgb),0.1)] bg-[#0A0613]/40 px-3 py-2.5"
              >
                <Skeleton className="h-8 w-8 rounded-xl bg-[#150B26]" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded bg-[#150B26]" />
                  <Skeleton className="h-2.5 w-16 rounded bg-[#150B26]" />
                </div>
                <Skeleton className="h-4 w-12 rounded bg-[#150B26]" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(var(--accent-rgb),0.12)]">
              <User size={24} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-sm font-bold text-[#F4ECFF]">No scores yet</p>
            <p className="max-w-[220px] text-xs text-[#8B7BB0]">
              Play a round and submit to claim the first spot on the board.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <Row
                key={row.id}
                row={row}
                rank={i + 1}
                isYou={!usingSample && row.player_id === playerId}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

export default Leaderboard;

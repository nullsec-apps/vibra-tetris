import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';
import type { ScoreRow } from '../types';
import { SAMPLE_SCORES } from '../lib/sampleScores';

const PROJECT_ID =
  (typeof window !== 'undefined' && (window as any).__NULLSEC__?.projectId) || 'local';
const TABLE = `app_${PROJECT_ID}_scores`;

export type LeaderboardStatus = 'loading' | 'ready' | 'empty' | 'error' | 'offline';

export interface LeaderboardApi {
  rows: ScoreRow[];
  status: LeaderboardStatus;
  usingSample: boolean;
  topBest: number;
  refresh: () => Promise<void>;
}

function dedupeByPlayer(rows: ScoreRow[]): ScoreRow[] {
  const best = new Map<string, ScoreRow>();
  for (const r of rows) {
    const existing = best.get(r.player_id);
    if (!existing || r.score > existing.score) best.set(r.player_id, r);
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}

export function useLeaderboard(limit = 20): LeaderboardApi {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>('loading');
  const [usingSample, setUsingSample] = useState(false);
  const mounted = useRef(true);

  const fetchScores = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!mounted.current) return;
      setRows(SAMPLE_SCORES.slice(0, limit));
      setUsingSample(true);
      setStatus('offline');
      return;
    }
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('score', { ascending: false })
        .limit(limit * 3);
      if (error) throw error;
      if (!mounted.current) return;
      const real = dedupeByPlayer((data ?? []) as ScoreRow[]).slice(0, limit);
      if (real.length === 0) {
        setRows(SAMPLE_SCORES.slice(0, limit));
        setUsingSample(true);
        setStatus('empty');
      } else {
        setRows(real);
        setUsingSample(false);
        setStatus('ready');
      }
    } catch {
      if (!mounted.current) return;
      setRows(SAMPLE_SCORES.slice(0, limit));
      setUsingSample(true);
      setStatus('error');
    }
  }, [limit]);

  useEffect(() => {
    mounted.current = true;
    fetchScores();
    return () => {
      mounted.current = false;
    };
  }, [fetchScores]);

  // realtime INSERT subscription
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToTable(
        'scores',
        () => {
          fetchScores();
        },
        { event: 'INSERT' }
      );
    } catch {
      /* realtime unavailable — polling fallback below */
    }
    return () => {
      if (unsub) unsub();
    };
  }, [fetchScores]);

  // online/offline reaction
  useEffect(() => {
    const onOnline = () => fetchScores();
    const onOffline = () => {
      setRows(SAMPLE_SCORES.slice(0, limit));
      setUsingSample(true);
      setStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [fetchScores, limit]);

  const topBest = rows.length > 0 && !usingSample ? rows[0].score : 0;

  return { rows, status, usingSample, topBest, refresh: fetchScores };
}

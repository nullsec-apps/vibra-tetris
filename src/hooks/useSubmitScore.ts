import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SubmitScorePayload } from '../types';

const PROJECT_ID =
  (typeof window !== 'undefined' && (window as any).__NULLSEC__?.projectId) || 'local';
const TABLE = `app_${PROJECT_ID}_scores`;
const QUEUE_KEY = 'vibra_score_queue';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'queued' | 'error';

export interface SubmitScoreApi {
  status: SubmitStatus;
  error: string | null;
  submit: (payload: SubmitScorePayload) => Promise<boolean>;
  reset: () => void;
  flushQueue: () => Promise<void>;
}

function readQueue(): SubmitScorePayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: SubmitScorePayload[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

async function insertRow(payload: SubmitScorePayload): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    player_id: payload.player_id,
    player_name: payload.player_name ?? null,
    score: payload.score,
    level: payload.level,
    lines_cleared: payload.lines_cleared,
    duration_seconds: payload.duration_seconds ?? null,
  });
  if (error) throw error;
}

export function useSubmitScore(): SubmitScoreApi {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const flushing = useRef(false);

  const flushQueue = useCallback(async () => {
    if (flushing.current) return;
    const queue = readQueue();
    if (queue.length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    flushing.current = true;
    const remaining: SubmitScorePayload[] = [];
    for (const item of queue) {
      try {
        await insertRow(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
    flushing.current = false;
  }, []);

  const submit = useCallback(
    async (payload: SubmitScorePayload): Promise<boolean> => {
      setStatus('submitting');
      setError(null);

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const queue = readQueue();
        queue.push(payload);
        writeQueue(queue);
        setStatus('queued');
        return false;
      }

      try {
        await insertRow(payload);
        setStatus('success');
        // opportunistically flush any backlog
        flushQueue();
        return true;
      } catch (e) {
        const queue = readQueue();
        queue.push(payload);
        writeQueue(queue);
        setError(e instanceof Error ? e.message : 'Could not submit score');
        setStatus('queued');
        return false;
      }
    },
    [flushQueue]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  // flush queued scores when back online / on mount
  useEffect(() => {
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushQueue]);

  return { status, error, submit, reset, flushQueue };
}

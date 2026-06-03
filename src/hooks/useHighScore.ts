import { useCallback, useEffect, useState } from 'react';

const PLAYER_ID_KEY = 'vibra_player_id';
const BEST_KEY = 'vibra_best_score';
const NAME_KEY = 'vibra_player_name';

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fallthrough */
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export interface HighScoreApi {
  playerId: string;
  playerName: string;
  best: number;
  hasRecord: boolean;
  setPlayerName: (name: string) => void;
  recordScore: (score: number) => boolean;
  syncRemoteBest: (remoteBest: number) => void;
}

export function useHighScore(): HighScoreApi {
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerNameState] = useState<string>('');
  const [best, setBest] = useState<number>(0);

  useEffect(() => {
    try {
      let id = localStorage.getItem(PLAYER_ID_KEY);
      if (!id) {
        id = makeId();
        localStorage.setItem(PLAYER_ID_KEY, id);
      }
      setPlayerId(id);
      setBest(readNumber(BEST_KEY));
      const n = localStorage.getItem(NAME_KEY);
      if (n) setPlayerNameState(n);
    } catch {
      setPlayerId(makeId());
    }
  }, []);

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 16);
    setPlayerNameState(trimmed);
    try {
      localStorage.setItem(NAME_KEY, trimmed);
    } catch {
      /* ignore */
    }
  }, []);

  const recordScore = useCallback(
    (score: number): boolean => {
      let isBest = false;
      setBest((prev) => {
        if (score > prev) {
          isBest = true;
          try {
            localStorage.setItem(BEST_KEY, String(score));
          } catch {
            /* ignore */
          }
          return score;
        }
        return prev;
      });
      return isBest;
    },
    []
  );

  const syncRemoteBest = useCallback((remoteBest: number) => {
    setBest((prev) => {
      if (remoteBest > prev) {
        try {
          localStorage.setItem(BEST_KEY, String(remoteBest));
        } catch {
          /* ignore */
        }
        return remoteBest;
      }
      return prev;
    });
  }, []);

  return {
    playerId,
    playerName,
    best,
    hasRecord: best > 0,
    setPlayerName,
    recordScore,
    syncRemoteBest,
  };
}

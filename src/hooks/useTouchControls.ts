import { useCallback, useEffect, useRef } from 'react';
import type { GameAction } from '../types';
import { haptic } from '../lib/haptics';

interface TouchPoint {
  x: number;
  y: number;
  t: number;
}

export interface TouchControlsApi {
  bind: (el: HTMLElement | null) => void;
  press: (action: GameAction) => void;
  startRepeat: (action: GameAction) => void;
  stopRepeat: () => void;
}

const SWIPE_THRESHOLD = 26; // px before a horizontal move registers
const FLICK_VELOCITY = 1.1; // px/ms for hard-drop flick
const TAP_MAX_MOVE = 16; // px movement still counts as a tap (rotate)
const TAP_MAX_TIME = 240; // ms
const REPEAT_INITIAL = 170; // ms before auto-repeat begins
const REPEAT_INTERVAL = 60; // ms between repeats

/**
 * Maps gestures + button presses to engine actions.
 * Gestures: swipe L/R = move, tap = rotate, sustained swipe-down = soft drop,
 * fast flick-down = hard drop. On-screen buttons use press()/startRepeat().
 */
export function useTouchControls(
  dispatch: (action: GameAction) => void,
  enabled: boolean
): TouchControlsApi {
  const elRef = useRef<HTMLElement | null>(null);
  const startRef = useRef<TouchPoint | null>(null);
  const lastRef = useRef<TouchPoint | null>(null);
  const movedCols = useRef(0);
  const softDropFired = useRef(false);
  const repeatTimer = useRef<number | null>(null);
  const repeatInterval = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const press = useCallback((action: GameAction) => {
    haptic('tap');
    dispatchRef.current(action);
  }, []);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current) {
      window.clearTimeout(repeatTimer.current);
      repeatTimer.current = null;
    }
    if (repeatInterval.current) {
      window.clearInterval(repeatInterval.current);
      repeatInterval.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (action: GameAction) => {
      stopRepeat();
      haptic('tap');
      dispatchRef.current(action);
      repeatTimer.current = window.setTimeout(() => {
        repeatInterval.current = window.setInterval(() => {
          dispatchRef.current(action);
        }, REPEAT_INTERVAL);
      }, REPEAT_INITIAL);
    },
    [stopRepeat]
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enabledRef.current) return;
    const p = { x: clientX, y: clientY, t: performance.now() };
    startRef.current = p;
    lastRef.current = p;
    movedCols.current = 0;
    softDropFired.current = false;
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!enabledRef.current || !startRef.current) return;
    const start = startRef.current;
    const dx = clientX - start.x;
    const dy = clientY - start.y;

    // horizontal stepping move
    const targetCols = Math.trunc(dx / SWIPE_THRESHOLD);
    if (targetCols !== movedCols.current && Math.abs(dx) > Math.abs(dy)) {
      const diff = targetCols - movedCols.current;
      const action: GameAction = diff > 0 ? 'moveRight' : 'moveLeft';
      for (let i = 0; i < Math.abs(diff); i++) dispatchRef.current(action);
      movedCols.current = targetCols;
    }

    // sustained downward swipe = soft drop
    if (dy > 34 && Math.abs(dy) > Math.abs(dx) && !softDropFired.current) {
      dispatchRef.current('softDrop');
      softDropFired.current = true;
    }

    lastRef.current = { x: clientX, y: clientY, t: performance.now() };
  }, []);

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabledRef.current || !startRef.current) return;
      const start = startRef.current;
      const last = lastRef.current ?? start;
      const dx = clientX - start.x;
      const dy = clientY - start.y;
      const dt = performance.now() - start.t;

      // velocity of last segment for flick detection
      const segDt = Math.max(1, performance.now() - last.t);
      const velY = (clientY - last.y) / segDt;
      const totalVelY = dy / Math.max(1, dt);

      const isTap =
        Math.abs(dx) < TAP_MAX_MOVE && Math.abs(dy) < TAP_MAX_MOVE && dt < TAP_MAX_TIME;

      if (isTap) {
        dispatchRef.current('rotate');
      } else if (
        dy > 60 &&
        Math.abs(dy) > Math.abs(dx) &&
        (totalVelY > FLICK_VELOCITY || velY > FLICK_VELOCITY)
      ) {
        // fast flick down = hard drop
        dispatchRef.current('hardDrop');
      }

      startRef.current = null;
      lastRef.current = null;
      movedCols.current = 0;
      softDropFired.current = false;
    },
    []
  );

  const bind = useCallback(
    (el: HTMLElement | null) => {
      if (elRef.current === el) return;
      elRef.current = el;
    },
    []
  );

  // attach listeners whenever the bound element changes
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleStart(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        handleMove(t.clientX, t.clientY);
        if (enabledRef.current) e.preventDefault();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) handleEnd(t.clientX, t.clientY);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd, elRef.current]);

  return { bind, press, startRepeat, stopRepeat };
}

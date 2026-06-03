import { useEffect, useRef } from 'react';
import { render } from '../lib/renderer';
import type { GameState } from '../types';

interface GameCanvasProps {
  state: GameState;
  className?: string;
}

/**
 * Core 10x20 play matrix. Drives a DPR-aware Canvas at 60fps via rAF,
 * painting glowing tetrominoes, ghost projection, lock pulse, and the
 * spectrum-sweep line-clear flash.
 */
export function GameCanvas({ state, className }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const loop = () => {
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(ctx, {
        grid: stateRef.current.grid,
        active: stateRef.current.active,
        ghost: stateRef.current.ghost,
        lineClear: stateRef.current.lineClear,
        lockPulse: stateRef.current.lockPulse,
        shake: stateRef.current.shake,
        now: performance.now(),
        dpr,
        width: w,
        height: h,
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative h-full w-full ${className ?? ''}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="VIBRA Tetris play matrix"
      />
    </div>
  );
}

export default GameCanvas;

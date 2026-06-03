import { useEffect, useRef } from 'react';

function hueToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function shortestHueDelta(from: number, to: number): number {
  let delta = ((to - from + 540) % 360) - 180;
  return delta;
}

/**
 * Smoothly lerps the global --accent CSS hue toward the active piece hue
 * so the whole UI "breathes" with gameplay.
 */
export function useDynamicAccent(targetHue: number | null, active: boolean): void {
  const currentHue = useRef(326); // base accent hue (#FF2D9B)
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(targetHue ?? 326);

  useEffect(() => {
    targetRef.current = targetHue ?? 326;
  }, [targetHue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const apply = (hue: number) => {
      const [r, g, b] = hueToRgb(((hue % 360) + 360) % 360, 0.92, 0.58);
      const root = document.documentElement;
      root.style.setProperty('--accent-hue', String(Math.round(hue)));
      root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
      root.style.setProperty('--accent', `rgb(${r}, ${g}, ${b})`);
    };

    const tick = () => {
      const delta = shortestHueDelta(currentHue.current, targetRef.current);
      currentHue.current += delta * (reduced ? 1 : 0.08);
      apply(currentHue.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (active) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // ease back to base hue when not playing
      targetRef.current = 326;
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);
}

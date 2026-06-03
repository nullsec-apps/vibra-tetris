import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { renderPreview } from '../lib/renderer';
import { getColor, getMatrix } from '../lib/tetrominoes';
import type { TetrominoType } from '../types';

interface NextPiecePreviewProps {
  queue: TetrominoType[];
}

function MiniPiece({ type, index }: { type: TetrominoType; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderPreview(ctx, {
      matrix: getMatrix(type, 0),
      color: getColor(type),
      width: w,
      height: h,
    });
  }, [type]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: index * 0.04 }}
      ref={wrapRef}
      className={`relative aspect-square rounded-xl border transition-all duration-200 ${
        index === 0
          ? 'border-[rgba(var(--accent-rgb),0.45)] bg-[#0A0613]/60 shadow-[0_0_18px_-6px_rgba(var(--accent-rgb),0.5)]'
          : 'border-[rgba(var(--accent-rgb),0.16)] bg-[#0A0613]/30'
      }`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </motion.div>
  );
}

export function NextPiecePreview({ queue }: NextPiecePreviewProps) {
  const upcoming = queue.slice(1, 4);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8B7BB0]">Next</span>
      <div className="grid grid-cols-3 gap-1.5">
        {upcoming.length > 0 ? (
          upcoming.map((t, i) => <MiniPiece key={`${t}-${i}`} type={t} index={i} />)
        ) : (
          <div className="col-span-3 flex aspect-[3/1] items-center justify-center rounded-xl border border-[rgba(var(--accent-rgb),0.12)] bg-[#0A0613]/30 text-[9px] uppercase tracking-widest text-[#8B7BB0]">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export default NextPiecePreview;

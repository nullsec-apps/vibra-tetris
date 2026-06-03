import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCw, ChevronsDown, ArrowDownToLine } from 'lucide-react';
import type { GameAction } from '../types';
import { haptic } from '../lib/haptics';

interface TouchControlsProps {
  onAction: (action: GameAction) => void;
  disabled?: boolean;
}

let rippleId = 0;

interface ControlButtonProps {
  action: GameAction;
  label: string;
  icon: React.ReactNode;
  onAction: (a: GameAction) => void;
  disabled?: boolean;
  wide?: boolean;
  variant?: 'default' | 'accent' | 'cyan';
}

function ControlButton({ action, label, icon, onAction, disabled, wide, variant = 'default' }: ControlButtonProps) {
  const [ripples, setRipples] = useState<number[]>([]);

  const fire = () => {
    if (disabled) return;
    haptic('tap');
    const id = ++rippleId;
    setRipples((r) => [...r, id]);
    setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 480);
    onAction(action);
  };

  const palette =
    variant === 'accent'
      ? 'border-[rgba(var(--accent-rgb),0.5)] bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)] active:bg-[rgba(var(--accent-rgb),0.24)]'
      : variant === 'cyan'
        ? 'border-[rgba(22,224,255,0.45)] bg-[rgba(22,224,255,0.1)] text-[var(--accent2)] active:bg-[rgba(22,224,255,0.2)]'
        : 'border-[rgba(var(--accent-rgb),0.25)] bg-[#150B26]/80 text-[#F4ECFF] active:bg-[rgba(var(--accent-rgb),0.16)]';

  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      whileTap={{ scale: 0.93 }}
      onPointerDown={(e) => {
        e.preventDefault();
        fire();
      }}
      className={`relative flex min-h-[60px] touch-manipulation select-none items-center justify-center overflow-hidden rounded-2xl border font-display text-xs font-bold uppercase tracking-wide backdrop-blur-sm transition-all duration-150 disabled:opacity-40 ${palette} ${
        wide ? 'flex-1 gap-2 px-4' : 'aspect-square'
      }`}
    >
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.span
            key={id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.46, ease: 'easeOut' }}
            className="pointer-events-none absolute h-12 w-12 rounded-full bg-current"
          />
        ))}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {wide && <span>{label}</span>}
      </span>
    </motion.button>
  );
}

export function TouchControls({ onAction, disabled }: TouchControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className="flex flex-col gap-2.5 px-3 pb-3 safe-bottom"
    >
      <div className="grid grid-cols-3 gap-2.5">
        <ControlButton
          action="moveLeft"
          label="Move left"
          icon={<ChevronLeft size={26} strokeWidth={2.4} />}
          onAction={onAction}
          disabled={disabled}
        />
        <ControlButton
          action="rotate"
          label="Rotate"
          icon={<RotateCw size={24} strokeWidth={2.4} />}
          onAction={onAction}
          disabled={disabled}
          variant="accent"
        />
        <ControlButton
          action="moveRight"
          label="Move right"
          icon={<ChevronRight size={26} strokeWidth={2.4} />}
          onAction={onAction}
          disabled={disabled}
        />
      </div>
      <div className="flex gap-2.5">
        <ControlButton
          action="softDrop"
          label="Soft Drop"
          icon={<ChevronsDown size={20} strokeWidth={2.4} />}
          onAction={onAction}
          disabled={disabled}
          wide
        />
        <ControlButton
          action="hardDrop"
          label="Hard Drop"
          icon={<ArrowDownToLine size={20} strokeWidth={2.4} />}
          onAction={onAction}
          disabled={disabled}
          wide
          variant="cyan"
        />
      </div>
    </motion.div>
  );
}

export default TouchControls;

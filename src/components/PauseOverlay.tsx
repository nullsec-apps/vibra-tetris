import { AnimatePresence, motion } from 'framer-motion';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '../lib/haptics';

interface PauseOverlayProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
}

const TIPS = [
  'Swipe left / right to slide pieces',
  'Tap the matrix to rotate',
  'Flick down for an instant hard drop',
  'Clear four rows at once for a TETRIS',
];

export function PauseOverlay({ open, onResume, onRestart }: PauseOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex items-center justify-center px-5 safe-top safe-bottom"
        >
          <div className="absolute inset-0 bg-[#0A0613]/72 backdrop-blur-md" onClick={onResume} />
          <motion.div
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative z-10 w-full max-w-[360px] rounded-3xl border border-[rgba(var(--accent-rgb),0.3)] bg-[#150B26]/90 p-7 text-center shadow-[0_0_60px_-20px_rgba(var(--accent-rgb),0.7)]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">
              <Pause size={26} strokeWidth={2} />
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#F4ECFF] drop-shadow-[0_0_18px_rgba(var(--accent-rgb),0.55)]">
              PAUSED
            </h2>
            <p className="mt-1.5 text-sm text-[#8B7BB0]">Take a breath. The neon waits for you.</p>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={() => {
                  haptic('tap');
                  onResume();
                }}
                className="h-12 w-full gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold tracking-wide text-[#0A0613] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                <Play size={18} strokeWidth={2.4} /> Resume
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  haptic('tap');
                  onRestart();
                }}
                className="h-12 w-full gap-2 rounded-2xl border-[rgba(var(--accent-rgb),0.4)] bg-transparent text-base font-bold tracking-wide text-[#F4ECFF] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.12)] active:scale-[0.98]"
              >
                <RotateCcw size={18} strokeWidth={2.2} /> Restart
              </Button>
            </div>

            <div className="mt-6 space-y-1.5 rounded-2xl border border-[rgba(var(--accent-rgb),0.14)] bg-[#0A0613]/40 p-3 text-left">
              {TIPS.map((tip) => (
                <p key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-[#8B7BB0]">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--accent2)] shadow-[0_0_6px_var(--accent2)]" />
                  {tip}
                </p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PauseOverlay;

import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function InstallPrompt() {
  const { canInstall, install, dismiss } = usePwaInstall();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 safe-bottom"
        >
          <div className="flex w-full max-w-[440px] items-center gap-3 rounded-2xl surface-panel neon-border px-3.5 py-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(var(--accent-rgb),0.16)',
                color: 'var(--accent)',
              }}
            >
              <Download size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#F4ECFF]">Install VIBRA TETRIS</p>
              <p className="truncate text-xs text-[#8B7BB0]">
                Fullscreen, offline-ready, on your home screen
              </p>
            </div>
            <Button
              onClick={install}
              className="h-9 shrink-0 rounded-xl bg-[var(--accent)] px-4 text-xs font-bold tracking-wide text-[#0A0613] transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ boxShadow: '0 0 18px rgba(var(--accent-rgb),0.45)' }}
            >
              INSTALL
            </Button>
            <button
              onClick={dismiss}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8B7BB0] transition-all duration-200 hover:text-[#F4ECFF] active:scale-90"
              aria-label="Dismiss install prompt"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InstallPrompt;

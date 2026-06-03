import { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Zap } from 'lucide-react';
import { GameShell } from './components/GameShell';

class GameErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('VIBRA TETRIS crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0A0613] px-6">
          <div
            className="pointer-events-none absolute -top-1/4 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,45,155,0.18) 0%, transparent 65%)' }}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative z-10 w-full max-w-[360px] rounded-3xl border border-[rgba(255,45,155,0.3)] bg-[#150B26]/90 p-7 text-center shadow-[0_0_60px_-20px_rgba(255,45,155,0.7)]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,45,155,0.4)] bg-[rgba(255,45,155,0.12)] text-[#FF2D9B]">
              <Zap size={26} strokeWidth={2.2} />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4ECFF] drop-shadow-[0_0_18px_rgba(255,45,155,0.55)]">
              SIGNAL LOST
            </h1>
            <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-[#8B7BB0]">
              The neon grid glitched out. Reload to drop back into the matrix — your best score is safe.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#FF2D9B] text-base font-bold uppercase tracking-wide text-[#0A0613] shadow-[0_0_28px_-6px_rgba(255,45,155,0.85)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              <RotateCcw size={18} strokeWidth={2.4} /> Reload
            </button>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GameErrorBoundary>
      <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#0A0613] font-sans text-[#F4ECFF] antialiased">
        <GameShell />
      </main>
    </GameErrorBoundary>
  );
}

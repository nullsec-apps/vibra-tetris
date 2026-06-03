import { memo } from 'react';
import { motion } from 'framer-motion';

interface DynamicGlowBackgroundProps {
  /** active piece hue (0-360) — UI breathes toward it. null = base */
  hue?: number | null;
  /** drop speed factor 0..1, intensifies the bloom as tension rises */
  intensity?: number;
}

/**
 * Animated synthwave backdrop: layered radial neon blooms + a slowly drifting
 * perspective grid. Hue is driven by the global --accent CSS variable (lerped
 * by useDynamicAccent) so the whole screen breathes with the active piece.
 */
function DynamicGlowBackgroundBase({ intensity = 0 }: DynamicGlowBackgroundProps) {
  const bloom = 0.16 + Math.min(0.22, intensity * 0.22);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* base wash */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--bg)', transition: 'background 600ms ease' }}
      />

      {/* top bloom — accent tinted, intensifies with drop speed */}
      <motion.div
        className="absolute -top-1/4 left-1/2 h-[70vh] w-[120vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(var(--accent-rgb), ${bloom}) 0%, transparent 65%)`,
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* secondary cyan bloom for the synthwave duotone feel */}
      <motion.div
        className="absolute bottom-[-15%] right-[-10%] h-[55vh] w-[80vw] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(22, 224, 255, 0.12) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* drifting perspective grid */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(var(--accent-rgb),0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          transform: 'perspective(420px) rotateX(58deg)',
          transformOrigin: 'bottom',
          animation: 'float-grid 5s linear infinite',
          transition: 'background-image 600ms ease',
        }}
      />

      {/* subtle grain to add atmosphere over flat panels */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export const DynamicGlowBackground = memo(DynamicGlowBackgroundBase);
export default DynamicGlowBackground;

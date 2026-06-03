type HapticEvent = 'move' | 'rotate' | 'lock' | 'lineClear' | 'tetris' | 'hardDrop' | 'gameOver' | 'tap';

const PATTERNS: Record<HapticEvent, number | number[]> = {
  move: 8,
  rotate: 12,
  lock: 18,
  lineClear: [0, 22, 30, 22],
  tetris: [0, 30, 40, 30, 40, 50],
  hardDrop: [0, 14, 12, 24],
  gameOver: [0, 60, 50, 80, 50, 120],
  tap: 6,
};

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export function haptic(event: HapticEvent): void {
  if (!enabled || !canVibrate()) return;
  try {
    navigator.vibrate(PATTERNS[event]);
  } catch {
    /* no-op on unsupported devices */
  }
}

export function stopHaptics(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* no-op */
  }
}

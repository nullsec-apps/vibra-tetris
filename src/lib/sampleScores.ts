import type { ScoreRow } from '../types';

const NAMES = [
  'NEONFOX',
  'PIX3L',
  'SYNTH_K',
  'GR1DLOCK',
  'BLOOMER',
  'VAPOR99',
  'L1NECLR',
  'RETROWAV',
  'GLOW_T',
  'ARCADIA',
];

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - Math.floor(daysAgo * 1.7));
  return d.toISOString();
}

export const SAMPLE_SCORES: ScoreRow[] = [
  { id: 'sample-1', player_id: 'sample-1', player_name: NAMES[0], score: 184250, level: 14, lines_cleared: 142, duration_seconds: 968, created_at: iso(1), isSample: true },
  { id: 'sample-2', player_id: 'sample-2', player_name: NAMES[1], score: 152800, level: 12, lines_cleared: 118, duration_seconds: 842, created_at: iso(2), isSample: true },
  { id: 'sample-3', player_id: 'sample-3', player_name: NAMES[2], score: 127640, level: 11, lines_cleared: 103, duration_seconds: 731, created_at: iso(2), isSample: true },
  { id: 'sample-4', player_id: 'sample-4', player_name: NAMES[3], score: 98420, level: 9, lines_cleared: 87, duration_seconds: 610, created_at: iso(3), isSample: true },
  { id: 'sample-5', player_id: 'sample-5', player_name: NAMES[4], score: 76110, level: 8, lines_cleared: 71, duration_seconds: 522, created_at: iso(4), isSample: true },
  { id: 'sample-6', player_id: 'sample-6', player_name: NAMES[5], score: 58300, level: 7, lines_cleared: 58, duration_seconds: 441, created_at: iso(5), isSample: true },
  { id: 'sample-7', player_id: 'sample-7', player_name: NAMES[6], score: 41200, level: 6, lines_cleared: 44, duration_seconds: 360, created_at: iso(6), isSample: true },
  { id: 'sample-8', player_id: 'sample-8', player_name: NAMES[7], score: 28950, level: 5, lines_cleared: 33, duration_seconds: 288, created_at: iso(7), isSample: true },
  { id: 'sample-9', player_id: 'sample-9', player_name: NAMES[8], score: 17640, level: 4, lines_cleared: 24, duration_seconds: 201, created_at: iso(9), isSample: true },
  { id: 'sample-10', player_id: 'sample-10', player_name: NAMES[9], score: 9320, level: 3, lines_cleared: 14, duration_seconds: 132, created_at: iso(11), isSample: true },
];

export function isSampleRow(row: ScoreRow): boolean {
  return row.isSample === true || row.id.startsWith('sample-');
}

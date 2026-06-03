export type CellValue = string | 0;

export type Grid = CellValue[][];

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  type: TetrominoType;
  color: string;
  glow: string;
  hue: number;
  rotations: number[][][];
  spawnOffset: { x: number; y: number };
}

export interface ActivePiece {
  type: TetrominoType;
  color: string;
  glow: string;
  hue: number;
  matrix: number[][];
  rotationIndex: number;
  x: number;
  y: number;
}

export type GamePhase = 'start' | 'playing' | 'paused' | 'gameover';

export interface GameStats {
  score: number;
  level: number;
  lines: number;
  durationSeconds: number;
}

export interface LineClearEffect {
  rows: number[];
  startedAt: number;
}

export interface GameState {
  grid: Grid;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  nextQueue: TetrominoType[];
  phase: GamePhase;
  stats: GameStats;
  activeHue: number;
  lineClear: LineClearEffect | null;
  lockPulse: number;
  shake: number;
}

export type GameAction =
  | 'moveLeft'
  | 'moveRight'
  | 'rotate'
  | 'softDrop'
  | 'hardDrop'
  | 'pause'
  | 'resume'
  | 'start'
  | 'restart';

export interface ScoreRow {
  id: string;
  player_id: string;
  player_name: string | null;
  score: number;
  level: number;
  lines_cleared: number;
  duration_seconds: number | null;
  created_at: string;
  isSample?: boolean;
}

export interface SubmitScorePayload {
  player_id: string;
  player_name?: string | null;
  score: number;
  level: number;
  lines_cleared: number;
  duration_seconds?: number | null;
}

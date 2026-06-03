import type { ActivePiece, Grid, TetrominoType } from '../types';
import { BOARD_HEIGHT, BOARD_WIDTH, getMatrix, getTetromino, TETROMINO_TYPES } from './tetrominoes';

export function createEmptyGrid(): Grid {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0 as 0));
}

export function shuffleBag(): TetrominoType[] {
  const bag = [...TETROMINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function spawnPiece(type: TetrominoType): ActivePiece {
  const t = getTetromino(type);
  return {
    type,
    color: t.color,
    glow: t.glow,
    hue: t.hue,
    matrix: t.rotations[0],
    rotationIndex: 0,
    x: t.spawnOffset.x,
    y: t.spawnOffset.y,
  };
}

export function collides(grid: Grid, piece: ActivePiece, offsetX = 0, offsetY = 0, matrix?: number[][]): boolean {
  const m = matrix ?? piece.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = piece.x + c + offsetX;
      const ny = piece.y + r + offsetY;
      if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return true;
      if (ny >= 0 && grid[ny][nx] !== 0) return true;
    }
  }
  return false;
}

const WALL_KICKS = [0, -1, 1, -2, 2];

export function rotatePiece(grid: Grid, piece: ActivePiece, dir: 1 | -1 = 1): ActivePiece | null {
  const nextIndex = (piece.rotationIndex + dir + 4) % 4;
  const nextMatrix = getMatrix(piece.type, nextIndex);
  for (const kick of WALL_KICKS) {
    if (!collides(grid, { ...piece, matrix: nextMatrix }, kick, 0, nextMatrix)) {
      return { ...piece, rotationIndex: nextIndex, matrix: nextMatrix, x: piece.x + kick };
    }
  }
  return null;
}

export function computeGhost(grid: Grid, piece: ActivePiece): ActivePiece {
  let dropY = 0;
  while (!collides(grid, piece, 0, dropY + 1)) dropY++;
  return { ...piece, y: piece.y + dropY };
}

export function mergePiece(grid: Grid, piece: ActivePiece): Grid {
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const nx = piece.x + c;
      const ny = piece.y + r;
      if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
        next[ny][nx] = piece.color;
      }
    }
  }
  return next;
}

export function findFullRows(grid: Grid): number[] {
  const rows: number[] = [];
  for (let r = 0; r < grid.length; r++) {
    if (grid[r].every((cell) => cell !== 0)) rows.push(r);
  }
  return rows;
}

export function clearRows(grid: Grid, rows: number[]): Grid {
  if (rows.length === 0) return grid;
  const rowSet = new Set(rows);
  const remaining = grid.filter((_, idx) => !rowSet.has(idx));
  const empties = Array.from({ length: rows.length }, () =>
    Array.from({ length: BOARD_WIDTH }, () => 0 as 0)
  );
  return [...empties, ...remaining];
}

const LINE_SCORES = [0, 100, 300, 500, 800];

export function scoreForLines(linesCleared: number, level: number): number {
  const base = LINE_SCORES[Math.min(linesCleared, 4)] ?? 0;
  return base * level;
}

export function softDropScore(cells: number): number {
  return cells;
}

export function hardDropScore(cells: number): number {
  return cells * 2;
}

export function levelForLines(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

// Gravity in ms per cell drop. Faster as level rises, floored for playability.
export function gravityForLevel(level: number): number {
  const ms = 800 * Math.pow(0.82, level - 1);
  return Math.max(60, Math.round(ms));
}

export function isTetris(linesCleared: number): boolean {
  return linesCleared >= 4;
}

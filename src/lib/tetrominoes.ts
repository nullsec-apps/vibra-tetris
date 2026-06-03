import type { Tetromino, TetrominoType } from '../types';

// Each rotation is a square matrix where 1 = filled cell.
// Colors are vibrant neon synthwave tones with matching glow + hue (for dynamic accent).

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    type: 'I',
    color: '#16E0FF',
    glow: 'rgba(22, 224, 255, 0.85)',
    hue: 189,
    spawnOffset: { x: 3, y: -1 },
    rotations: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  O: {
    type: 'O',
    color: '#FFE14D',
    glow: 'rgba(255, 225, 77, 0.85)',
    hue: 50,
    spawnOffset: { x: 4, y: 0 },
    rotations: [
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },
  T: {
    type: 'T',
    color: '#C16BFF',
    glow: 'rgba(193, 107, 255, 0.85)',
    hue: 277,
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  S: {
    type: 'S',
    color: '#3DFFB0',
    glow: 'rgba(61, 255, 176, 0.85)',
    hue: 154,
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  Z: {
    type: 'Z',
    color: '#FF2D9B',
    glow: 'rgba(255, 45, 155, 0.85)',
    hue: 326,
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  },
  J: {
    type: 'J',
    color: '#4D7DFF',
    glow: 'rgba(77, 125, 255, 0.85)',
    hue: 224,
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },
  L: {
    type: 'L',
    color: '#FF8A3D',
    glow: 'rgba(255, 138, 61, 0.85)',
    hue: 25,
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
};

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function getTetromino(type: TetrominoType): Tetromino {
  return TETROMINOES[type];
}

export function getMatrix(type: TetrominoType, rotationIndex: number): number[][] {
  const t = TETROMINOES[type];
  return t.rotations[((rotationIndex % t.rotations.length) + t.rotations.length) % t.rotations.length];
}

export function getColor(type: TetrominoType): string {
  return TETROMINOES[type].color;
}

export function getHue(type: TetrominoType): number {
  return TETROMINOES[type].hue;
}

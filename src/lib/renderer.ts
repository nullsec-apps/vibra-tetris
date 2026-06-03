import type { ActivePiece, Grid, LineClearEffect } from '../types';
import { BOARD_HEIGHT, BOARD_WIDTH } from './tetrominoes';

export interface RenderOptions {
  grid: Grid;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  lineClear: LineClearEffect | null;
  lockPulse: number;
  shake: number;
  now: number;
  dpr: number;
  width: number;
  height: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
  glowAmount: number,
  alpha = 1
): void {
  const pad = size * 0.08;
  const inner = size - pad * 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowAmount;
  ctx.fillStyle = color;
  roundRect(ctx, px + pad, py + pad, inner, inner, size * 0.22);
  ctx.fill();
  // inner highlight
  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * 0.35;
  const grad = ctx.createLinearGradient(px, py, px, py + size);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  roundRect(ctx, px + pad, py + pad, inner, inner, size * 0.22);
  ctx.fill();
  ctx.restore();
}

function drawGhostCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string
): void {
  const pad = size * 0.1;
  const inner = size - pad * 2;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = Math.max(1.5, size * 0.06);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.4;
  roundRect(ctx, px + pad, py + pad, inner, inner, size * 0.2);
  ctx.stroke();
  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, opts: RenderOptions): void {
  const { grid, active, ghost, lineClear, lockPulse, shake, now, width, height } = opts;

  const cell = Math.floor(Math.min(width / BOARD_WIDTH, height / BOARD_HEIGHT));
  const boardW = cell * BOARD_WIDTH;
  const boardH = cell * BOARD_HEIGHT;
  const offX = (width - boardW) / 2;
  const offY = (height - boardH) / 2;

  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 6 : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 6 : 0;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offX + shakeX, offY + shakeY);

  // background well
  ctx.save();
  ctx.shadowColor = 'rgba(255,45,155,0.4)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = 'rgba(12, 7, 24, 0.92)';
  roundRect(ctx, -cell * 0.18, -cell * 0.18, boardW + cell * 0.36, boardH + cell * 0.36, cell * 0.4);
  ctx.fill();
  ctx.restore();

  // grid gutters
  ctx.strokeStyle = 'rgba(139, 123, 176, 0.12)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= BOARD_WIDTH; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cell, 0);
    ctx.lineTo(c * cell, boardH);
    ctx.stroke();
  }
  for (let r = 0; r <= BOARD_HEIGHT; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cell);
    ctx.lineTo(boardW, r * cell);
    ctx.stroke();
  }

  // settled cells
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const v = grid[r][c];
      if (v !== 0) {
        drawCell(ctx, c * cell, r * cell, cell, v, cell * 0.45);
      }
    }
  }

  // ghost
  if (ghost && active) {
    for (let r = 0; r < ghost.matrix.length; r++) {
      for (let c = 0; c < ghost.matrix[r].length; c++) {
        if (!ghost.matrix[r][c]) continue;
        const gy = ghost.y + r;
        if (gy < 0) continue;
        drawGhostCell(ctx, (ghost.x + c) * cell, gy * cell, cell, ghost.color);
      }
    }
  }

  // active piece with lock pulse
  if (active) {
    const pulseGlow = cell * (0.5 + lockPulse * 1.6);
    for (let r = 0; r < active.matrix.length; r++) {
      for (let c = 0; c < active.matrix[r].length; c++) {
        if (!active.matrix[r][c]) continue;
        const ay = active.y + r;
        if (ay < 0) continue;
        drawCell(ctx, (active.x + c) * cell, ay * cell, cell, active.color, pulseGlow, 1);
      }
    }
  }

  // spectrum sweep on line clear
  if (lineClear) {
    const elapsed = now - lineClear.startedAt;
    const duration = 320;
    const t = Math.min(1, elapsed / duration);
    const sweepX = t * boardW;
    for (const row of lineClear.rows) {
      const y = row * cell;
      const grad = ctx.createLinearGradient(0, y, boardW, y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(Math.max(0, t - 0.18), 'rgba(255,255,255,0)');
      grad.addColorStop(Math.min(1, t), 'rgba(255,255,255,0.95)');
      grad.addColorStop(Math.min(1, t + 0.02), 'rgba(22,224,255,0.0)');
      ctx.save();
      ctx.globalAlpha = 1 - t * 0.4;
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, boardW, cell);
      // bright leading edge
      ctx.shadowColor = '#16E0FF';
      ctx.shadowBlur = cell;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(sweepX - 4, y, 8, cell);
      ctx.restore();
    }
  }

  ctx.restore();
}

export interface PreviewRenderOptions {
  matrix: number[][];
  color: string;
  width: number;
  height: number;
}

export function renderPreview(ctx: CanvasRenderingContext2D, opts: PreviewRenderOptions): void {
  const { matrix, color, width, height } = opts;
  ctx.clearRect(0, 0, width, height);
  let minR = matrix.length;
  let maxR = -1;
  let minC = matrix[0].length;
  let maxC = -1;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR < 0) return;
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cell = Math.floor(Math.min(width / (cols + 0.5), height / (rows + 0.5)));
  const gw = cols * cell;
  const gh = rows * cell;
  const ox = (width - gw) / 2;
  const oy = (height - gh) / 2;
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (!matrix[r][c]) continue;
      drawCell(ctx, ox + (c - minC) * cell, oy + (r - minR) * cell, cell, color, cell * 0.5);
    }
  }
}

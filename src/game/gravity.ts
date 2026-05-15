import { getResolvedGravityRotateInterval } from "./config";
import { isStartPlacementRestricted } from "./restrictions";
import type { Board, BoardCell, GameConfig, GameSnapshot, GravityDirection, GravityRotateAngle, GravityRotateSpin, Piece } from "./types";

const DIRECTIONS_CW: GravityDirection[] = ["down", "left", "up", "right"];

export function gravityDirectionIndex(direction: GravityDirection): number {
  const i = DIRECTIONS_CW.indexOf(direction);
  return i >= 0 ? i : 0;
}

export function rotateGravityDirection(
  current: GravityDirection,
  steps: number,
  spin: "cw" | "ccw"
): GravityDirection {
  const n = DIRECTIONS_CW.length;
  let i = gravityDirectionIndex(current);
  const delta = spin === "cw" ? steps : -steps;
  i = ((i + delta) % n + n) % n;
  return DIRECTIONS_CW[i];
}

export function isVerticalGravity(direction: GravityDirection): boolean {
  return direction === "down" || direction === "up";
}

/** Compat: celdas viejas sin campo tratan el hueco roto como barrera (comportamiento previo). */
function brokenCellIsGravitySolid(cell: BoardCell): boolean {
  if (cell.brokenTurns === null) return false;
  return cell.gravityCollisionSolid !== false;
}

function pieceBlocksLanding(cell: BoardCell, ignoredPieceId: number | null): boolean {
  return cell.piece !== null && (ignoredPieceId === null || cell.piece.id !== ignoredPieceId);
}

function gravityStructuralBarrier(
  board: Board,
  config: GameConfig,
  snapshot: GameSnapshot,
  row: number,
  col: number
): boolean {
  if (isStartPlacementRestricted(snapshot, config, row, col)) return true;
  const cell = board[row][col];
  return brokenCellIsGravitySolid(cell);
}

/** Landing row for vertical gravity in column `col`. `direction` down or up. */
export function scanColumnLanding(
  board: Board,
  config: GameConfig,
  direction: GravityDirection,
  col: number,
  ignoredPieceId: number | null,
  snapshot: GameSnapshot
): number | null {
  if (direction === "down") {
    let lastEmpty: number | null = null;
    for (let row = 0; row < config.rows; row++) {
      const cell = board[row][col];
      if (pieceBlocksLanding(cell, ignoredPieceId)) return lastEmpty;
      if (gravityStructuralBarrier(board, config, snapshot, row, col)) return lastEmpty;
      if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
      lastEmpty = row;
    }
    return lastEmpty;
  }

  if (direction === "up") {
    let lastEmpty: number | null = null;
    for (let row = config.rows - 1; row >= 0; row--) {
      const cell = board[row][col];
      if (pieceBlocksLanding(cell, ignoredPieceId)) return lastEmpty;
      if (gravityStructuralBarrier(board, config, snapshot, row, col)) return lastEmpty;
      if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
      lastEmpty = row;
    }
    return lastEmpty;
  }

  return null;
}

/** Landing col for horizontal gravity in row `row`. `direction` left or right. */
export function scanRowLanding(
  board: Board,
  config: GameConfig,
  direction: GravityDirection,
  row: number,
  ignoredPieceId: number | null,
  snapshot: GameSnapshot
): number | null {
  if (direction === "right") {
    let lastEmpty: number | null = null;
    for (let col = 0; col < config.columns; col++) {
      const cell = board[row][col];
      if (pieceBlocksLanding(cell, ignoredPieceId)) return lastEmpty;
      if (gravityStructuralBarrier(board, config, snapshot, row, col)) return lastEmpty;
      if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
      lastEmpty = col;
    }
    return lastEmpty;
  }

  if (direction === "left") {
    let lastEmpty: number | null = null;
    for (let col = config.columns - 1; col >= 0; col--) {
      const cell = board[row][col];
      if (pieceBlocksLanding(cell, ignoredPieceId)) return lastEmpty;
      if (gravityStructuralBarrier(board, config, snapshot, row, col)) return lastEmpty;
      if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
      lastEmpty = col;
    }
    return lastEmpty;
  }

  return null;
}

/** Segmentos de columna entre barreras (rotos firmes/restricciones); huecos permeables enlazan ocupables vecinos. */
function applyGravityColumn(
  board: Board,
  config: GameConfig,
  snapshot: GameSnapshot,
  col: number,
  packToBottom: boolean
): void {
  const segments: number[][] = [];
  let current: number[] = [];
  for (let row = 0; row < config.rows; row++) {
    if (gravityStructuralBarrier(board, config, snapshot, row, col)) {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    const cell = board[row][col];
    if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
    current.push(row);
  }
  if (current.length > 0) segments.push(current);

  for (const seg of segments) {
    const pieces: Piece[] = [];
    if (packToBottom) {
      for (let i = seg.length - 1; i >= 0; i--) {
        const p = board[seg[i]][col].piece;
        if (p !== null) pieces.push(p);
        board[seg[i]][col].piece = null;
      }
      let k = 0;
      for (let i = seg.length - 1; i >= 0; i--) {
        board[seg[i]][col].piece = k < pieces.length ? pieces[k++] : null;
      }
    } else {
      for (let i = 0; i < seg.length; i++) {
        const p = board[seg[i]][col].piece;
        if (p !== null) pieces.push(p);
        board[seg[i]][col].piece = null;
      }
      let k = 0;
      for (let i = 0; i < seg.length; i++) {
        board[seg[i]][col].piece = k < pieces.length ? pieces[k++] : null;
      }
    }
  }
}

/** Segmentos de fila entre barreras. */
function applyGravityRow(board: Board, config: GameConfig, snapshot: GameSnapshot, row: number, packToRight: boolean): void {
  const segments: number[][] = [];
  let current: number[] = [];
  for (let col = 0; col < config.columns; col++) {
    if (gravityStructuralBarrier(board, config, snapshot, row, col)) {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    const cell = board[row][col];
    if (cell.brokenTurns !== null && !brokenCellIsGravitySolid(cell)) continue;
    current.push(col);
  }
  if (current.length > 0) segments.push(current);

  for (const seg of segments) {
    const pieces: Piece[] = [];
    if (packToRight) {
      for (let i = seg.length - 1; i >= 0; i--) {
        const p = board[row][seg[i]].piece;
        if (p !== null) pieces.push(p);
        board[row][seg[i]].piece = null;
      }
      let k = 0;
      for (let i = seg.length - 1; i >= 0; i--) {
        board[row][seg[i]].piece = k < pieces.length ? pieces[k++] : null;
      }
    } else {
      for (let i = 0; i < seg.length; i++) {
        const p = board[row][seg[i]].piece;
        if (p !== null) pieces.push(p);
        board[row][seg[i]].piece = null;
      }
      let k = 0;
      for (let i = 0; i < seg.length; i++) {
        board[row][seg[i]].piece = k < pieces.length ? pieces[k++] : null;
      }
    }
  }
}

export function applyGravity(board: Board, config: GameConfig, direction: GravityDirection, snapshot: GameSnapshot): void {
  if (isVerticalGravity(direction)) {
    for (let col = 0; col < config.columns; col++) {
      applyGravityColumn(board, config, snapshot, col, direction === "down");
    }
    return;
  }

  for (let row = 0; row < config.rows; row++) {
    applyGravityRow(board, config, snapshot, row, direction === "right");
  }
}

function pickRandomAngleSteps(): 1 | 2 | 3 {
  const r = Math.floor(Math.random() * 3);
  return (r === 0 ? 1 : r === 1 ? 2 : 3) as 1 | 2 | 3;
}

function resolveAngleSteps(angle: GravityRotateAngle): 1 | 2 | 3 {
  if (angle === "90") return 1;
  if (angle === "180") return 2;
  if (angle === "270") return 3;
  return pickRandomAngleSteps();
}

function resolveSpin(spin: GravityRotateSpin): "cw" | "ccw" {
  if (spin === "cw") return "cw";
  if (spin === "ccw") return "ccw";
  return Math.random() < 0.5 ? "cw" : "ccw";
}

function shouldRotateGravityThisTurn(snapshot: GameSnapshot, config: GameConfig): boolean {
  if (!config.gravityEnabled || !config.gravityRotateEnabled || snapshot.gameOver) return false;

  const interval = getResolvedGravityRotateInterval(config);
  if (interval <= 0) return false;
  if (snapshot.turnNumber <= 0) return false;
  return snapshot.turnNumber % interval === 0;
}

export function computeRotatedGravityDirection(current: GravityDirection, config: GameConfig): GravityDirection {
  const steps = resolveAngleSteps(config.gravityRotateAngle);
  const spin = resolveSpin(config.gravityRotateSpin);
  return rotateGravityDirection(current, steps, spin);
}

/** Programa la rotación en `pendingGravityRotationTarget` o la limpia si no toca rotar este turno. */
export function scheduleGravityRotationIfDue(snapshot: GameSnapshot, config: GameConfig): void {
  if (!shouldRotateGravityThisTurn(snapshot, config)) {
    snapshot.pendingGravityRotationTarget = null;
    return;
  }
  snapshot.pendingGravityRotationTarget = computeRotatedGravityDirection(snapshot.gravityDirection, config);
}

/** Aplica la rotación pendiente y el reacomodo (tras la pausa en la UI). */
export function applyScheduledGravityRotation(snapshot: GameSnapshot, config: GameConfig): void {
  const target = snapshot.pendingGravityRotationTarget;
  if (target === null) return;
  snapshot.gravityDirection = target;
  snapshot.pendingGravityRotationTarget = null;
  applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);
}

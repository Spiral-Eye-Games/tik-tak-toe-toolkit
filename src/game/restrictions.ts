import { isBroken } from "./brokenHoles";
import {
  DEFAULT_RESTRICTION_START_TURNS
} from "./defaults";
import type { Board, BoardPosition, GameConfig, GameSnapshot, Piece, RestrictionMovementMode, RestrictionStartZone } from "./types";

const RESTRICTION_START_ZONES: RestrictionStartZone[] = ["edges", "corners", "center"];
const RESTRICTION_MOVEMENT_MODES: RestrictionMovementMode[] = [
  "normal",
  "king",
  "grandKing",
  "queen",
  "rook",
  "pillar",
  "bishop",
  "monk",
  "knight",
  "neon",
  "checkers",
  "horsemen",
  "mage"
];

export interface RestrictedMoveResolution {
  legal: boolean;
  eatenPositions: BoardPosition[];
  convertedPositions: BoardPosition[];
}

export function normalizeRestrictionStartZones(value: unknown): RestrictionStartZone[] {
  if (!Array.isArray(value)) return ["center"];

  const zones = value.filter((zone): zone is RestrictionStartZone =>
    RESTRICTION_START_ZONES.includes(zone as RestrictionStartZone)
  );
  return [...new Set(zones)];
}

function normalizeRestrictionStartThickness(value: unknown): Record<RestrictionStartZone, number> {
  const legacyThickness = typeof value === "number" ? value : null;
  const recordValue = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<Record<RestrictionStartZone, unknown>>
    : {};

  return Object.fromEntries(
    RESTRICTION_START_ZONES.map((zone) => [
      zone,
      clampInt(
        legacyThickness ?? Number(recordValue[zone]),
        1,
        12,
        1
      )
    ])
  ) as Record<RestrictionStartZone, number>;
}

export function normalizeRestrictionStartBlockedCells(value: unknown, rows: number, columns: number): BoardPosition[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const positions: BoardPosition[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const loose = item as Partial<BoardPosition>;
    const row = clampInt(Number(loose.row), 0, rows - 1, -1);
    const col = clampInt(Number(loose.col), 0, columns - 1, -1);
    if (row < 0 || col < 0) continue;

    const key = getBlockedCellKey(row, col);
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push({ row, col });
  }

  return positions;
}

export function buildLegacyRestrictionStartBlockedCells(
  rows: number,
  columns: number,
  zonesValue: unknown,
  thicknessValue: unknown
): BoardPosition[] {
  const zones = normalizeRestrictionStartZones(zonesValue);
  if (zones.length === 0) return [];

  const thickness = normalizeRestrictionStartThickness(thicknessValue);
  const seen = new Set<string>();
  const positions: BoardPosition[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!zones.some((zone) => isInStartRestrictionZone(rows, columns, zone, thickness[zone], row, col))) continue;

      const key = getBlockedCellKey(row, col);
      if (seen.has(key)) continue;
      seen.add(key);
      positions.push({ row, col });
    }
  }

  return positions;
}

export function normalizeRestrictionMovementMode(value: unknown): RestrictionMovementMode {
  if (value === "shortRook") return "rook";
  return RESTRICTION_MOVEMENT_MODES.includes(value as RestrictionMovementMode)
    ? (value as RestrictionMovementMode)
    : "normal";
}

export function movementSupportsConversion(mode: RestrictionMovementMode): boolean {
  return mode === "checkers" || mode === "horsemen" || mode === "mage";
}

export function getResolvedRestrictionStartTurns(config: GameConfig): number {
  if (!config.restrictionsEnabled || config.restrictionStartBlockedCells.length === 0) {
    return 0;
  }

  const base = clampInt(
    config.restrictionStartTurns,
    1,
    99,
    DEFAULT_RESTRICTION_START_TURNS
  );
  return config.restrictionStartUnit === "rounds" ? base * config.playerCount : base;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  const number = Number.parseInt(String(value), 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function isRestrictionStartActive(snapshot: GameSnapshot, config: GameConfig): boolean {
  const resolvedTurns = getResolvedRestrictionStartTurns(config);
  return resolvedTurns > 0 && snapshot.turnNumber < resolvedTurns;
}

export function isStartRestrictedPosition(config: GameConfig, row: number, col: number): boolean {
  if (!config.restrictionsEnabled) return false;
  return config.restrictionStartBlockedCells.some((position) => position.row === row && position.col === col);
}

export function isStartPlacementRestricted(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  return isRestrictionStartActive(snapshot, config) && isStartRestrictedPosition(config, row, col);
}

function isInStartRestrictionZone(
  rows: number,
  columns: number,
  zone: RestrictionStartZone,
  thickness: number,
  row: number,
  col: number
): boolean {
  const rowFromEdge = Math.min(row, rows - 1 - row);
  const colFromEdge = Math.min(col, columns - 1 - col);
  const isInRowEdge = rowFromEdge < thickness;
  const isInColEdge = colFromEdge < thickness;

  if (zone === "edges") return isInRowEdge || isInColEdge;
  if (zone === "corners") return isInRowEdge && isInColEdge;

  const expansion = thickness - 1;
  const firstCenterRow = Math.max(0, Math.floor((rows - 1) / 2) - expansion);
  const lastCenterRow = Math.min(rows - 1, Math.ceil((rows - 1) / 2) + expansion);
  const firstCenterCol = Math.max(0, Math.floor((columns - 1) / 2) - expansion);
  const lastCenterCol = Math.min(columns - 1, Math.ceil((columns - 1) / 2) + expansion);
  return row >= firstCenterRow && row <= lastCenterRow && col >= firstCenterCol && col <= lastCenterCol;
}

function getBlockedCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function isRestrictedMovementLegal(
  board: Board,
  config: GameConfig,
  source: BoardPosition,
  target: BoardPosition
): boolean {
  return resolveRestrictedMove(board, config, source, target)?.legal ?? false;
}

export function getRestrictedMoveCaptures(
  board: Board,
  config: GameConfig,
  source: BoardPosition,
  target: BoardPosition
): BoardPosition[] {
  return resolveRestrictedMove(board, config, source, target)?.eatenPositions ?? [];
}

export function getRestrictedMoveConversions(
  board: Board,
  config: GameConfig,
  source: BoardPosition,
  target: BoardPosition
): BoardPosition[] {
  return resolveRestrictedMove(board, config, source, target)?.convertedPositions ?? [];
}

export function resolveRestrictedMove(
  board: Board,
  config: GameConfig,
  source: BoardPosition,
  target: BoardPosition
): RestrictedMoveResolution {
  const mode = config.restrictionMovementMode;
  const canEat = config.restrictionMovementEatEnabled;
  const canConvert = movementSupportsConversion(mode) && config.restrictionMovementConvertEnabled;

  const rowDelta = target.row - source.row;
  const colDelta = target.col - source.col;
  const absRow = Math.abs(rowDelta);
  const absCol = Math.abs(colDelta);
  const movingPiece = board[source.row]?.[source.col]?.piece ?? null;
  const targetCell = board[target.row]?.[target.col];
  const targetPiece = board[target.row]?.[target.col]?.piece ?? null;
  const canLandOnEmptyTarget = targetCell !== undefined && !isBroken(targetCell) && targetPiece === null;
  const canEatTarget = canEat && isEnemyPiece(movingPiece, targetPiece);

  switch (mode) {
    case "normal":
      return canLandOnEmptyTarget ? legalMove() : illegalMove();
    case "king":
      return (canLandOnEmptyTarget || canEatTarget) && Math.max(absRow, absCol) === 1
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "grandKing":
      return (canLandOnEmptyTarget || canEatTarget) && Math.max(absRow, absCol) >= 1 && Math.max(absRow, absCol) <= 2
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "queen":
      return (canLandOnEmptyTarget || canEatTarget) && (isStraight(rowDelta, colDelta) || isDiagonal(absRow, absCol)) && isPathClear(board, source, target)
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "rook":
      return (canLandOnEmptyTarget || canEatTarget) && isStraight(rowDelta, colDelta) && isPathClear(board, source, target)
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "pillar":
      return (canLandOnEmptyTarget || canEatTarget) && isStraight(rowDelta, colDelta) && absRow + absCol === 1
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "bishop":
      return (canLandOnEmptyTarget || canEatTarget) && isDiagonal(absRow, absCol) && isPathClear(board, source, target)
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "monk":
      return (canLandOnEmptyTarget || canEatTarget) && isDiagonal(absRow, absCol) && absRow === 1
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "knight":
      return (canLandOnEmptyTarget || canEatTarget) && ((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))
        ? legalMove(canEatTarget ? [{ row: target.row, col: target.col }] : [])
        : illegalMove();
    case "neon":
      if (canLandOnEmptyTarget && isStraight(rowDelta, colDelta) && absRow + absCol === 1) return legalMove();
      if (canEat && isDiagonal(absRow, absCol) && absRow === 1 && isEnemyPiece(movingPiece, targetPiece)) {
        return legalMove([{ row: target.row, col: target.col }]);
      }
      return illegalMove();
    case "checkers":
      if (canLandOnEmptyTarget && isDiagonal(absRow, absCol) && absRow === 1) return legalMove();
      return resolveJumpCapture(board, movingPiece, source, target, rowDelta, colDelta, "diagonal", canEat, canConvert);
    case "horsemen":
      if (canLandOnEmptyTarget && isStraight(rowDelta, colDelta) && absRow + absCol === 1) return legalMove();
      return resolveJumpCapture(board, movingPiece, source, target, rowDelta, colDelta, "straight", canEat, canConvert);
    case "mage":
      if (canLandOnEmptyTarget && (isDiagonal(absRow, absCol) || isStraight(rowDelta, colDelta)) && Math.max(absRow, absCol) === 1) return legalMove();
      return resolveJumpCapture(board, movingPiece, source, target, rowDelta, colDelta, "any", canEat, canConvert);
    default:
      return canLandOnEmptyTarget ? legalMove() : illegalMove();
  }
}

function legalMove(eatenPositions: BoardPosition[] = [], convertedPositions: BoardPosition[] = []): RestrictedMoveResolution {
  return { legal: true, eatenPositions, convertedPositions };
}

function illegalMove(): RestrictedMoveResolution {
  return { legal: false, eatenPositions: [], convertedPositions: [] };
}

function resolveJumpCapture(
  board: Board,
  movingPiece: Piece | null,
  source: BoardPosition,
  target: BoardPosition,
  rowDelta: number,
  colDelta: number,
  direction: "diagonal" | "straight" | "any",
  canEat: boolean,
  canConvert: boolean
): RestrictedMoveResolution {
  const absRow = Math.abs(rowDelta);
  const absCol = Math.abs(colDelta);
  const diagonalJump = absRow === 2 && absCol === 2;
  const straightJump = (absRow === 2 && absCol === 0) || (absRow === 0 && absCol === 2);
  const validJump = direction === "any"
    ? diagonalJump || straightJump
    : direction === "diagonal"
      ? diagonalJump
      : straightJump;
  if (!validJump) return illegalMove();
  if (board[target.row]?.[target.col]?.piece !== null || isBroken(board[target.row][target.col])) return illegalMove();

  const captured = {
    row: source.row + Math.sign(rowDelta),
    col: source.col + Math.sign(colDelta)
  };
  const capturedPiece = board[captured.row]?.[captured.col]?.piece ?? null;
  if (!isEnemyPiece(movingPiece, capturedPiece)) return illegalMove();
  if (canConvert) return legalMove([], [captured]);
  if (canEat) return legalMove([captured]);
  return legalMove();
}

function isEnemyPiece(movingPiece: Piece | null, targetPiece: Piece | null): boolean {
  return movingPiece !== null && targetPiece !== null && movingPiece.owner !== targetPiece.owner;
}

function isStraight(rowDelta: number, colDelta: number): boolean {
  return rowDelta === 0 || colDelta === 0;
}

function isDiagonal(absRow: number, absCol: number): boolean {
  return absRow === absCol;
}

function isPathClear(board: Board, source: BoardPosition, target: BoardPosition): boolean {
  const rowStep = Math.sign(target.row - source.row);
  const colStep = Math.sign(target.col - source.col);
  let row = source.row + rowStep;
  let col = source.col + colStep;

  while (row !== target.row || col !== target.col) {
    const cell = board[row]?.[col];
    if (!cell || cell.piece !== null || isBroken(cell)) return false;
    row += rowStep;
    col += colStep;
  }

  return true;
}

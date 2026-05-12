import { findPiecePosition } from "./board";
import { isBroken } from "./brokenHoles";
import { isVerticalGravity, scanColumnLanding, scanRowLanding } from "./gravity";
import { isRestrictedMovementLegal, isStartPlacementRestricted } from "./restrictions";
import type { GameConfig, GameSnapshot, GravityDirection, Piece, PlayerId } from "./types";

export function canAddPiece(snapshot: GameSnapshot, config: GameConfig, player: PlayerId): boolean {
  if (config.pieceLimitType === "unlimited") return true;
  const history = snapshot.pieceHistory[player];
  if (!history) return true;
  return history.length < config.maxPiecesPerPlayer;
}

export function mustMovePiece(snapshot: GameSnapshot, config: GameConfig): boolean {
  const player = snapshot.currentPlayer;
  if (config.pieceLimitType === "unlimited") return false;
  if (config.pieceMoveMode === "limitedFree") return false;
  const history = snapshot.pieceHistory[player];
  if (!history) return false;
  return history.length >= config.maxPiecesPerPlayer;
}

export function getDefaultSelectedPieceIdForcedOldest(
  snapshot: GameSnapshot,
  config: GameConfig
): number | null {
  if (config.pieceMoveMode !== "forcedOldest") return null;
  if (!mustMovePiece(snapshot, config)) return null;
  const oldestId = snapshot.pieceHistory[snapshot.currentPlayer]?.[0];
  if (oldestId == null) return null;
  if (findPiecePosition(snapshot.board, oldestId) === null) return null;
  return oldestId;
}

export function canSelectPiece(snapshot: GameSnapshot, config: GameConfig, piece: Piece | null): boolean {
  if (!piece || piece.owner !== snapshot.currentPlayer) return false;

  switch (config.pieceMoveMode) {
    case "forcedOldest":
      return mustMovePiece(snapshot, config) && snapshot.pieceHistory[piece.owner]?.[0] === piece.id;
    case "limitMoveAny":
      return mustMovePiece(snapshot, config);
    case "limitedFree":
      return config.pieceLimitType === "limited";
    case "free":
      return config.pieceLimitType === "unlimited";
    default:
      return false;
  }
}

export function isLegalPlacementDestination(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (config.gravityEnabled) {
    return isGravityPlacementClick(snapshot, config, snapshot.gravityDirection, row, col);
  }

  const cell = snapshot.board[row][col];
  return cell.piece === null && !isBroken(cell) && !isStartPlacementRestricted(snapshot, config, row, col);
}

/** Casilla vacía en la columna (gravedad vertical) o fila (horizontal) donde hay un hueco de caída válido. */
export function isGravityPlacementClick(
  snapshot: GameSnapshot,
  config: GameConfig,
  direction: GravityDirection,
  row: number,
  col: number
): boolean {
  const board = snapshot.board;
  const cell = board[row][col];
  if (isBroken(cell) || cell.piece !== null) return false;

  if (isVerticalGravity(direction)) {
    const landingRow = scanColumnLanding(board, config, direction, col, null);
    return landingRow !== null && !isStartPlacementRestricted(snapshot, config, landingRow, col);
  }
  const landingCol = scanRowLanding(board, config, direction, row, null);
  return landingCol !== null && !isStartPlacementRestricted(snapshot, config, row, landingCol);
}

export function isLegalMoveDestination(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (snapshot.selectedPieceId === null) return false;

  const source = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
  if (!source) return false;
  if (source.row === row && source.col === col) return false;

  const targetCell = snapshot.board[row][col];
  if (isBroken(targetCell)) return false;

  return isRestrictedMovementLegal(snapshot.board, config, source, { row, col });
}

export function isCellClickable(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (snapshot.gameOver) return false;

  const cell = snapshot.board[row][col];
  const piece = cell.piece;

  if (snapshot.pendingGravityRotationTarget !== null) {
    return canSelectPiece(snapshot, config, piece);
  }

  if (canSelectPiece(snapshot, config, piece)) return true;
  if (snapshot.selectedPieceId !== null) return isLegalMoveDestination(snapshot, config, row, col);
  if (!canAddPiece(snapshot, config, snapshot.currentPlayer)) return false;

  return isLegalPlacementDestination(snapshot, config, row, col);
}

export function isGravityLandingCell(
  snapshot: GameSnapshot,
  config: GameConfig,
  direction: GravityDirection,
  row: number,
  col: number
): boolean {
  const board = snapshot.board;
  if (isVerticalGravity(direction)) {
    const landRow = scanColumnLanding(board, config, direction, col, null);
    return landRow !== null && landRow === row && !isStartPlacementRestricted(snapshot, config, row, col);
  }
  const landCol = scanRowLanding(board, config, direction, row, null);
  return landCol !== null && landCol === col && !isStartPlacementRestricted(snapshot, config, row, col);
}

export function hasLegalMove(snapshot: GameSnapshot, config: GameConfig): boolean {
  if (config.gravityEnabled) {
    const d = snapshot.gravityDirection;
    if (isVerticalGravity(d)) {
      for (let col = 0; col < config.columns; col++) {
        const row = scanColumnLanding(snapshot.board, config, d, col, null);
        if (row !== null && !isStartPlacementRestricted(snapshot, config, row, col)) return true;
      }
      return false;
    }
    for (let row = 0; row < config.rows; row++) {
      const col = scanRowLanding(snapshot.board, config, d, row, null);
      if (col !== null && !isStartPlacementRestricted(snapshot, config, row, col)) return true;
    }
    return false;
  }

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = snapshot.board[row][col];
      if (cell.piece === null && !isBroken(cell) && !isStartPlacementRestricted(snapshot, config, row, col)) return true;
    }
  }

  return false;
}

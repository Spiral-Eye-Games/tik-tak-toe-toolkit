import { DRAW_IF_NO_LEGAL_MOVES } from "./defaults";
import { applyGravity } from "./gravity";
import { hasLegalMove } from "./placement";
import type { GameConfig, GameSnapshot } from "./types";

export { createBoard, createEmptyCell, findPiecePosition, isInsideBoard } from "./board";
export { abandonCellForBroken, isBroken, removeAllPiecesForPlayer, tickBrokenHoles } from "./brokenHoles";
export { findLine } from "./lines";
export {
  canAddPiece,
  canSelectPiece,
  getDefaultSelectedPieceIdForcedOldest,
  hasLegalMove,
  isCellClickable,
  isGravityLandingCell,
  isGravityPlacementClick,
  isLegalMoveDestination,
  isLegalPlacementDestination,
  mustMovePiece
} from "./placement";
export { getNextActivePlayer, getNextTurnAfterPlayerRemoved } from "./turns";

export { applyGravity };

export function shouldDrawIfNoLegalMoves(snapshot: GameSnapshot, config: GameConfig): boolean {
  return DRAW_IF_NO_LEGAL_MOVES && !hasLegalMove(snapshot, config);
}

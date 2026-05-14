import { getResolvedBrokenHoleTurns } from "./config";
import { applyGravity } from "./gravity";
import type { Board, BoardCell, BoardPosition, GameConfig, GameSnapshot, PlayerId } from "./types";

export function isBroken(cell: BoardCell | null): boolean {
  return cell !== null && cell.brokenTurns !== null;
}

export function tickBrokenHoles(board: Board, config: GameConfig, turnNumber: number): void {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = board[row][col];
      if (cell.brokenTurns === null || cell.brokenTurns === 0) continue;
      if (cell.brokenCreatedOnTurn === turnNumber) continue;

      cell.brokenTurns--;
      if (cell.brokenTurns <= 0) {
        cell.brokenTurns = null;
        cell.brokenCreatedOnTurn = null;
        cell.gravityCollisionSolid = false;
      }
    }
  }
}

export function abandonCellForBroken(snapshot: GameSnapshot, config: GameConfig, position: BoardPosition): void {
  const cell = snapshot.board[position.row][position.col];
  if (config.brokenEnabled) {
    cell.brokenTurns = getResolvedBrokenHoleTurns(config);
    cell.brokenCreatedOnTurn = snapshot.turnNumber;
    cell.gravityCollisionSolid = config.brokenRuptureGravityCollision;
  } else {
    cell.brokenTurns = null;
    cell.brokenCreatedOnTurn = null;
    cell.gravityCollisionSolid = false;
  }
}

export function removeAllPiecesForPlayer(snapshot: GameSnapshot, config: GameConfig, playerId: PlayerId): void {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = snapshot.board[row][col];
      if (cell.piece?.owner === playerId) {
        cell.piece = null;
        abandonCellForBroken(snapshot, config, { row, col });
      }
    }
  }
  snapshot.pieceHistory[playerId] = [];
  if (config.gravityEnabled) applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);
}

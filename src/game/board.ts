import type { Board, BoardCell, BoardPosition, GameConfig } from "./types";

export function createEmptyCell(): BoardCell {
  return { piece: null, brokenTurns: null, brokenCreatedOnTurn: null, gravityCollisionSolid: false };
}

export function createBoard(config: GameConfig): Board {
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.columns }, () => createEmptyCell())
  );
}

export function findPiecePosition(board: Board, pieceId: number): BoardPosition | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].piece?.id === pieceId) return { row, col };
    }
  }
  return null;
}

export function isInsideBoard(config: GameConfig, row: number, col: number): boolean {
  return row >= 0 && row < config.rows && col >= 0 && col < config.columns;
}

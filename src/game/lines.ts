import { isInsideBoard } from "./board";
import type { BoardPosition, GameConfig, GameSnapshot, PlayerId } from "./types";

export function findLine(snapshot: GameSnapshot, config: GameConfig, player: PlayerId): BoardPosition[] | null {
  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 }
  ];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      for (const direction of directions) {
        const line: BoardPosition[] = [];

        for (let i = 0; i < config.lineLength; i++) {
          const r = row + direction.row * i;
          const c = col + direction.col * i;
          if (!isInsideBoard(config, r, c)) break;
          if (snapshot.board[r][c].piece?.owner !== player) break;
          line.push({ row: r, col: c });
        }

        if (line.length === config.lineLength) return line;
      }
    }
  }

  return null;
}

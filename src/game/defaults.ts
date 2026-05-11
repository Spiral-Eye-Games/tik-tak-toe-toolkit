import type { GameConfig, PieceMoveMode, Player } from "./types";

export const DEFAULT_COLUMNS = 4;
export const DEFAULT_ROWS = 4;
export const DEFAULT_LINE_RULE = "lose";
export const DEFAULT_LINE_LENGTH = 3;

export const DEFAULT_UNLIMITED_PIECES = false;
export const DEFAULT_MAX_PIECES_PER_PLAYER = 3;
export const DEFAULT_LIMITED_PIECE_MOVE_MODE: PieceMoveMode = "forcedOldest";
export const DEFAULT_UNLIMITED_PIECE_MOVE_MODE: PieceMoveMode = "blocked";

export const DEFAULT_BROKEN_ENABLED = true;
export const DEFAULT_BROKEN_HOLE_TURNS = 0;
export const DEFAULT_GRAVITY_ENABLED = false;

export const PLAYERS: Player[] = ["X", "O"];
export const STARTING_PLAYER: Player = "X";
export const DRAW_IF_NO_LEGAL_MOVES = true;

export const DEFAULT_CONFIG: GameConfig = {
  columns: DEFAULT_COLUMNS,
  rows: DEFAULT_ROWS,
  lineRule: DEFAULT_LINE_RULE,
  lineLength: DEFAULT_LINE_LENGTH,
  pieceLimitType: DEFAULT_UNLIMITED_PIECES ? "unlimited" : "limited",
  maxPiecesPerPlayer: DEFAULT_MAX_PIECES_PER_PLAYER,
  pieceMoveMode: DEFAULT_UNLIMITED_PIECES ? DEFAULT_UNLIMITED_PIECE_MOVE_MODE : DEFAULT_LIMITED_PIECE_MOVE_MODE,
  brokenEnabled: DEFAULT_BROKEN_ENABLED,
  brokenHoleTurns: DEFAULT_BROKEN_HOLE_TURNS,
  gravityEnabled: DEFAULT_GRAVITY_ENABLED
};

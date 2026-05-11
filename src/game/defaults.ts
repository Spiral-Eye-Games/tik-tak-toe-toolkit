import type { GameConfig, PieceMoveMode, RosterPlayer } from "./types";

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

export const DEFAULT_ROSTER: RosterPlayer[] = [
  { id: "p0", emoji: "🙂" },
  { id: "p1", emoji: "🐶" },
  { id: "p2", emoji: "🐱" },
  { id: "p3", emoji: "🐭" },
  { id: "p4", emoji: "🐹" },
  { id: "p5", emoji: "🐰" },
  { id: "p6", emoji: "🦊" },
  { id: "p7", emoji: "🐻" },
  { id: "p8", emoji: "🐼" },
  { id: "p9", emoji: "🐨" }
];

export const DEFAULT_PLAYER_COUNT = 2;
export const DEFAULT_ELIMINATE_LOSERS = true;
export const DEFAULT_CONTINUE_RANKING = false;
export const DEFAULT_ELIMINATE_WINNERS = false;

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
  gravityEnabled: DEFAULT_GRAVITY_ENABLED,
  roster: DEFAULT_ROSTER,
  playerCount: DEFAULT_PLAYER_COUNT,
  eliminateLosers: DEFAULT_ELIMINATE_LOSERS,
  continueRanking: DEFAULT_CONTINUE_RANKING,
  eliminateWinners: DEFAULT_ELIMINATE_WINNERS
};

import type { ClockMode, GameConfig, GravityDirection, PieceMoveMode, RosterPlayer } from "./types";

/** Tablero clásico 3×3, ganar con 3 en raya, fichas ilimitadas sin movimiento. */
export const DEFAULT_COLUMNS = 3;
export const DEFAULT_ROWS = 3;
export const DEFAULT_LINE_RULE = "win";
export const DEFAULT_LINE_LENGTH = 3;

export const DEFAULT_UNLIMITED_PIECES = true;
export const DEFAULT_MAX_PIECES_PER_PLAYER = 3;
export const DEFAULT_LIMITED_PIECE_MOVE_MODE: PieceMoveMode = "forcedOldest";
export const DEFAULT_UNLIMITED_PIECE_MOVE_MODE: PieceMoveMode = "blocked";

export const DEFAULT_BROKEN_ENABLED = false;
export const DEFAULT_BROKEN_HOLE_TURNS = 1;
export const DEFAULT_BROKEN_HOLE_UNLIMITED = true;
export const DEFAULT_BROKEN_HOLE_TURNS_PER_PLAYER = false;
export const DEFAULT_GRAVITY_ENABLED = false;
export const DEFAULT_GRAVITY_INITIAL_DIRECTION: GravityDirection = "down";
export const DEFAULT_GRAVITY_ROTATE_ENABLED = false;
export const DEFAULT_GRAVITY_ROTATE_EVERY_TURNS = 3;
export const DEFAULT_GRAVITY_ROTATE_EVERY_TURNS_PER_PLAYER = false;
/** Pausa en ms antes de aplicar la rotación de gravedad (para ver el tablero estable). */
export const DEFAULT_GRAVITY_ROTATION_PAUSE_MS = 1000;

/** Paleta por índice para jugadores nuevos o datos sin color válido. */
export const DEFAULT_PLAYER_COLORS: string[] = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#65a30c"
];

export const DEFAULT_ROSTER: RosterPlayer[] = [
  { id: "p0", symbol: "✖", color: "#2563eb" },
  { id: "p1", symbol: "⬤", color: "#dc2626" },
  { id: "p2", symbol: "◼", color: "#16a34a" },
  { id: "p3", symbol: "▲", color: "#ca8a04" },
  { id: "p4", symbol: "♠", color: "#9333ea" },
  { id: "p5", symbol: "♦", color: "#ea580c" },
  { id: "p6", symbol: "♣", color: "#0891b2" },
  { id: "p7", symbol: "♥", color: "#db2777" },
  { id: "p8", symbol: "★", color: "#4f46e5" },
  { id: "p9", symbol: "☗", color: "#65a30c" }
];

export const DEFAULT_PLAYER_COUNT = 2;
export const DEFAULT_ELIMINATE_LOSERS = true;
export const DEFAULT_CONTINUE_RANKING = false;
export const DEFAULT_ELIMINATE_WINNERS = false;

export const DEFAULT_CLOCK_ENABLED = false;
export const DEFAULT_CLOCK_MODE: ClockMode = "bank";
export const DEFAULT_CLOCK_BANK_SECONDS = 300;
export const DEFAULT_CLOCK_RECOVER_SECONDS = 0;
export const DEFAULT_CLOCK_PER_TURN_SECONDS = 30;

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
  brokenHoleUnlimited: DEFAULT_BROKEN_HOLE_UNLIMITED,
  brokenHoleTurnsPerPlayer: DEFAULT_BROKEN_HOLE_TURNS_PER_PLAYER,
  gravityEnabled: DEFAULT_GRAVITY_ENABLED,
  gravityInitialDirection: DEFAULT_GRAVITY_INITIAL_DIRECTION,
  gravityRotateEnabled: DEFAULT_GRAVITY_ROTATE_ENABLED,
  gravityRotateAngle: "90",
  gravityRotateSpin: "cw",
  gravityRotateEveryTurns: DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  gravityRotateEveryTurnsPerPlayer: DEFAULT_GRAVITY_ROTATE_EVERY_TURNS_PER_PLAYER,
  roster: DEFAULT_ROSTER,
  playerCount: DEFAULT_PLAYER_COUNT,
  eliminateLosers: DEFAULT_ELIMINATE_LOSERS,
  continueRanking: DEFAULT_CONTINUE_RANKING,
  eliminateWinners: DEFAULT_ELIMINATE_WINNERS,
  clockEnabled: DEFAULT_CLOCK_ENABLED,
  clockMode: DEFAULT_CLOCK_MODE,
  clockBankSeconds: DEFAULT_CLOCK_BANK_SECONDS,
  clockRecoverSeconds: DEFAULT_CLOCK_RECOVER_SECONDS,
  clockPerTurnSeconds: DEFAULT_CLOCK_PER_TURN_SECONDS
};

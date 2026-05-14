import type { ClockMode, CollapseType, GameConfig, GravityDirection, IntervalUnit, PieceMoveMode, RestrictionMovementMode, RosterPlayer } from "./types";

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
export const DEFAULT_BROKEN_HOLE_DURATION_UNIT: IntervalUnit = "turns";
export const DEFAULT_BROKEN_HOLE_UNLIMITED = true;
export const DEFAULT_BROKEN_HOLE_TURNS_PER_PLAYER = false;
export const DEFAULT_GRAVITY_ENABLED = false;
export const DEFAULT_GRAVITY_INITIAL_DIRECTION: GravityDirection = "down";
export const DEFAULT_GRAVITY_ROTATE_ENABLED = false;
export const DEFAULT_GRAVITY_ROTATE_EVERY_TURNS = 3;
export const DEFAULT_GRAVITY_ROTATE_EVERY_UNIT: IntervalUnit = "turns";
/** Pausa en ms antes de aplicar la rotación de gravedad (para ver el tablero estable). */
export const DEFAULT_GRAVITY_ROTATION_PAUSE_MS = 1000;
export const DEFAULT_COLLAPSE_ENABLED = false;
export const DEFAULT_COLLAPSE_TYPE: CollapseType = "circular";
export const DEFAULT_COLLAPSE_EVERY_TURNS = 3;
export const DEFAULT_COLLAPSE_EVERY_UNIT: IntervalUnit = "turns";
export const DEFAULT_COLLAPSE_TIMES = 1;
export const DEFAULT_COLLAPSE_KILLS_PLAYERS = false;

export const DEFAULT_ROSTER: RosterPlayer[] = [
  { id: "cross", color: "#2f5eed" },
  { id: "circle", color: "#dc2626" },
  { id: "triangle", color: "#10d147" },
  { id: "square", color: "#b920e8" },
  { id: "spade", color: "#08b1c7" },
  { id: "diamond", color: "#ea580c" },
  { id: "club", color: "#0b9963" },
  { id: "heart", color: "#db2777" },
  { id: "moon", color: "#4989cc" },
  { id: "sun", color: "#f59e0b" },
  { id: "zap", color: "#bfe02b" },
  { id: "star", color: "#7b2ee6" }
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
export const DEFAULT_RESTRICTIONS_ENABLED = false;
export const DEFAULT_RESTRICTION_START_TURNS = 1;
export const DEFAULT_RESTRICTION_START_UNIT: IntervalUnit = "turns";
export const DEFAULT_RESTRICTION_START_BLOCKED_CELLS = [{ row: 1, col: 1 }];
export const DEFAULT_RESTRICTION_MOVEMENT_MODE: RestrictionMovementMode = "normal";
export const DEFAULT_RESTRICTION_MOVEMENT_EAT_ENABLED = false;
export const DEFAULT_RESTRICTION_MOVEMENT_CONVERT_ENABLED = false;

export const DEFAULT_SKIP_TURN_ENABLED = false;

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
  brokenHoleDurationUnit: DEFAULT_BROKEN_HOLE_DURATION_UNIT,
  brokenHoleUnlimited: DEFAULT_BROKEN_HOLE_UNLIMITED,
  brokenHoleTurnsPerPlayer: DEFAULT_BROKEN_HOLE_TURNS_PER_PLAYER,
  gravityEnabled: DEFAULT_GRAVITY_ENABLED,
  gravityInitialDirection: DEFAULT_GRAVITY_INITIAL_DIRECTION,
  gravityRotateEnabled: DEFAULT_GRAVITY_ROTATE_ENABLED,
  gravityRotateAngle: "90",
  gravityRotateSpin: "cw",
  gravityRotateEveryTurns: DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  gravityRotateEveryUnit: DEFAULT_GRAVITY_ROTATE_EVERY_UNIT,
  collapseEnabled: DEFAULT_COLLAPSE_ENABLED,
  collapseType: DEFAULT_COLLAPSE_TYPE,
  collapseEveryTurns: DEFAULT_COLLAPSE_EVERY_TURNS,
  collapseEveryUnit: DEFAULT_COLLAPSE_EVERY_UNIT,
  collapseTimes: DEFAULT_COLLAPSE_TIMES,
  collapseKillsPlayers: DEFAULT_COLLAPSE_KILLS_PLAYERS,
  roster: DEFAULT_ROSTER,
  playerCount: DEFAULT_PLAYER_COUNT,
  eliminateLosers: DEFAULT_ELIMINATE_LOSERS,
  continueRanking: DEFAULT_CONTINUE_RANKING,
  eliminateWinners: DEFAULT_ELIMINATE_WINNERS,
  clockEnabled: DEFAULT_CLOCK_ENABLED,
  clockMode: DEFAULT_CLOCK_MODE,
  clockBankSeconds: DEFAULT_CLOCK_BANK_SECONDS,
  clockRecoverSeconds: DEFAULT_CLOCK_RECOVER_SECONDS,
  clockPerTurnSeconds: DEFAULT_CLOCK_PER_TURN_SECONDS,
  restrictionsEnabled: DEFAULT_RESTRICTIONS_ENABLED,
  restrictionStartTurns: DEFAULT_RESTRICTION_START_TURNS,
  restrictionStartUnit: DEFAULT_RESTRICTION_START_UNIT,
  restrictionStartBlockedCells: DEFAULT_RESTRICTION_START_BLOCKED_CELLS.map((position) => ({ ...position })),
  restrictionMovementMode: DEFAULT_RESTRICTION_MOVEMENT_MODE,
  restrictionMovementEatEnabled: DEFAULT_RESTRICTION_MOVEMENT_EAT_ENABLED,
  restrictionMovementConvertEnabled: DEFAULT_RESTRICTION_MOVEMENT_CONVERT_ENABLED,
  skipTurnEnabled: DEFAULT_SKIP_TURN_ENABLED
};

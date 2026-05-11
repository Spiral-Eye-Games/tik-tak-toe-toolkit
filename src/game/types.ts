export type PlayerId = string;

export interface RosterPlayer {
  id: PlayerId;
  emoji: string;
}

export type LineRule = "lose" | "win";
export type PieceLimitType = "limited" | "unlimited";
export type PieceMoveMode = "forcedOldest" | "limitMoveAny" | "limitedFree" | "blocked" | "free";

export type GravityDirection = "down" | "up" | "left" | "right";
export type GravityRotateAngle = "90" | "180" | "270" | "random";
export type GravityRotateSpin = "cw" | "ccw" | "random";

/** `bank`: tiempo total compartido entre turnos. `perTurn`: tiempo que se restablece cada turno. */
export type ClockMode = "bank" | "perTurn";

export interface GameConfig {
  columns: number;
  rows: number;
  lineRule: LineRule;
  lineLength: number;
  pieceLimitType: PieceLimitType;
  maxPiecesPerPlayer: number;
  pieceMoveMode: PieceMoveMode;
  brokenEnabled: boolean;
  brokenHoleTurns: number;
  brokenHoleUnlimited: boolean;
  brokenHoleTurnsPerPlayer: boolean;
  gravityEnabled: boolean;
  gravityInitialDirection: GravityDirection;
  gravityRotateEnabled: boolean;
  gravityRotateAngle: GravityRotateAngle;
  gravityRotateSpin: GravityRotateSpin;
  gravityRotateEveryTurns: number;
  gravityRotateEveryTurnsPerPlayer: boolean;
  roster: RosterPlayer[];
  playerCount: number;
  eliminateLosers: boolean;
  continueRanking: boolean;
  eliminateWinners: boolean;
  clockEnabled: boolean;
  clockMode: ClockMode;
  /** Modo banca: segundos iniciales (y tope tras recuperación) por jugador. */
  clockBankSeconds: number;
  /** Modo banca: segundos que recuperan al terminar un turno con movimiento válido (0 = desactivado). */
  clockRecoverSeconds: number;
  /** Modo por turno: segundos por jugada; al agotarse pierde el turno. */
  clockPerTurnSeconds: number;
}

export interface Piece {
  id: number;
  owner: PlayerId;
}

export interface BoardCell {
  piece: Piece | null;
  brokenTurns: number | null;
  brokenCreatedOnTurn: number | null;
}

export interface BoardPosition {
  row: number;
  col: number;
}

export type Board = BoardCell[][];

export type PieceHistory = Record<PlayerId, number[]>;

export type GameEndSummary =
  | { type: "draw" }
  | { type: "winner"; winnerId: PlayerId; loserId?: PlayerId }
  | { type: "ranking"; orderedIds: PlayerId[] };

export interface GameSnapshot {
  board: Board;
  pieceHistory: PieceHistory;
  currentPlayer: PlayerId;
  activePlayerIds: PlayerId[];
  placementOrderWin: PlayerId[];
  eliminationOrderLose: PlayerId[];
  gameOver: boolean;
  gameEndSummary: GameEndSummary | null;
  lineCells: BoardPosition[];
  nextPieceId: number;
  turnNumber: number;
  statusMessage: string;
  selectedPieceId: number | null;
  gravityDirection: GravityDirection;
  /** Si no es null, tras el último turno quedó programada una rotación de gravedad (se aplica tras la pausa en UI). */
  pendingGravityRotationTarget: GravityDirection | null;
  /** Inicio del turno actual del reloj (ms desde epoch). */
  clockTurnStartedAtMs: number;
  /** Solo modo banca: segundos restantes por jugador al inicio del turno actual (el activo se agota con el tiempo real). */
  clockBankRemaining: Record<PlayerId, number> | null;
  /** Si hay pausa de rotación de gravedad, marca cuándo empezó (para no descontar ese intervalo del reloj). */
  clockPauseStartedAtMs: number | null;
}

export interface GameState extends GameSnapshot {
  config: GameConfig;
  undoStack: GameSnapshot[];
  redoStack: GameSnapshot[];
}

export type GameAction =
  | { type: "newGame"; config: GameConfig }
  | { type: "playMove"; row: number; col: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "completePendingGravityRotation" }
  | { type: "clockBankTimeout" }
  | { type: "clockPerTurnTimeout" };

export interface HelpContent {
  title: string;
  html: string;
}

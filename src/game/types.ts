export type PlayerId = string;

export interface RosterPlayer {
  id: PlayerId;
  emoji: string;
}

export type LineRule = "lose" | "win";
export type PieceLimitType = "limited" | "unlimited";
export type PieceMoveMode = "forcedOldest" | "limitMoveAny" | "limitedFree" | "blocked" | "free";

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
  gravityEnabled: boolean;
  roster: RosterPlayer[];
  playerCount: number;
  eliminateLosers: boolean;
  continueRanking: boolean;
  eliminateWinners: boolean;
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
  | { type: "redo" };

export interface HelpContent {
  title: string;
  html: string;
}

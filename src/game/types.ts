export type Player = "X" | "O";
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
}

export interface Piece {
  id: number;
  owner: Player;
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

export type PieceHistory = Record<Player, number[]>;

export interface GameSnapshot {
  board: Board;
  pieceHistory: PieceHistory;
  currentPlayer: Player;
  gameOver: boolean;
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

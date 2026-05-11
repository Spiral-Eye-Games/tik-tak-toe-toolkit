import { PLAYERS, STARTING_PLAYER } from "./defaults";
import { sanitizeConfig } from "./config";
import { t } from "../i18n";
import {
  applyGravity,
  canAddPiece,
  canSelectPiece,
  createBoard,
  findLine,
  findPiecePosition,
  getGravityTargetRow,
  getGravityTargetRowIgnoringPiece,
  getNextPlayer,
  isLegalMoveDestination,
  isLegalPlacementDestination,
  shouldDrawIfNoLegalMoves,
  tickBrokenHoles
} from "./rules";
import type { BoardPosition, GameAction, GameConfig, GameSnapshot, GameState, Player } from "./types";

export function createInitialGameState(configInput: GameConfig): GameState {
  const config = sanitizeConfig(configInput);
  const pieceHistory = PLAYERS.reduce((acc, player) => {
    acc[player] = [];
    return acc;
  }, {} as Record<Player, number[]>);

  return {
    config,
    board: createBoard(config),
    pieceHistory,
    currentPlayer: STARTING_PLAYER,
    gameOver: false,
    lineCells: [],
    nextPieceId: 1,
    turnNumber: 0,
    statusMessage: "",
    selectedPieceId: null,
    undoStack: [],
    redoStack: []
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "newGame":
      return createInitialGameState(action.config);
    case "playMove":
      return playMove(state, action.row, action.col);
    case "undo":
      return undoMove(state);
    case "redo":
      return redoMove(state);
    default:
      return state;
  }
}

function playMove(state: GameState, clickedRow: number, clickedCol: number): GameState {
  if (state.gameOver) return state;

  const clickedCell = state.board[clickedRow]?.[clickedCol];
  if (!clickedCell) return state;

  const clickedPiece = clickedCell.piece;

  if (clickedPiece && canSelectPiece(state, state.config, clickedPiece)) {
    return {
      ...state,
      selectedPieceId: state.selectedPieceId === clickedPiece.id ? null : clickedPiece.id
    };
  }

  if (state.selectedPieceId !== null) {
    return moveSelectedPiece(state, clickedRow, clickedCol);
  }

  return placeNewPiece(state, clickedRow, clickedCol);
}

function placeNewPiece(state: GameState, clickedRow: number, clickedCol: number): GameState {
  if (!canAddPiece(state, state.config, state.currentPlayer)) return state;

  const row = state.config.gravityEnabled
    ? getGravityTargetRow(state.board, state.config, clickedCol)
    : clickedRow;
  const col = clickedCol;

  if (row === null) return state;
  if (!isLegalPlacementDestination(state, state.config, row, col)) return state;

  const previousSnapshot = createSnapshot(state);
  const next = cloneSnapshot(previousSnapshot);

  next.turnNumber++;
  next.selectedPieceId = null;
  next.statusMessage = "";

  const piece = { id: next.nextPieceId++, owner: next.currentPlayer };
  next.board[row][col].piece = piece;
  next.pieceHistory[next.currentPlayer].push(piece.id);

  if (state.config.gravityEnabled) applyGravity(next.board, state.config);
  finishTurn(next, state.config);

  return snapshotToState(state, next, [...state.undoStack, previousSnapshot], []);
}

function moveSelectedPiece(state: GameState, clickedRow: number, clickedCol: number): GameState {
  if (state.selectedPieceId === null) return state;

  const source = findPiecePosition(state.board, state.selectedPieceId);
  if (!source) {
    return { ...state, selectedPieceId: null };
  }

  const initialTargetRow = state.config.gravityEnabled
    ? getGravityTargetRowIgnoringPiece(state.board, state.config, clickedCol, state.selectedPieceId)
    : clickedRow;

  if (initialTargetRow === null) return state;
  if (!isLegalMoveDestination(state, state.config, initialTargetRow, clickedCol)) return state;

  const previousSnapshot = createSnapshot(state);
  const next = cloneSnapshot(previousSnapshot);
  const selectedPieceId = state.selectedPieceId;
  const nextSource = findPiecePosition(next.board, selectedPieceId);

  if (!nextSource) return state;

  next.turnNumber++;
  next.statusMessage = "";

  const piece = next.board[nextSource.row][nextSource.col].piece;
  next.board[nextSource.row][nextSource.col].piece = null;
  breakAbandonedCell(next, state.config, nextSource);

  if (state.config.gravityEnabled) applyGravity(next.board, state.config);

  const finalTargetRow = state.config.gravityEnabled
    ? getGravityTargetRow(next.board, state.config, clickedCol)
    : initialTargetRow;

  if (finalTargetRow === null || piece === null) return state;

  next.board[finalTargetRow][clickedCol].piece = piece;
  movePieceToNewest(next, piece.owner, piece.id);
  next.selectedPieceId = null;

  if (state.config.gravityEnabled) applyGravity(next.board, state.config);
  finishTurn(next, state.config);

  return snapshotToState(state, next, [...state.undoStack, previousSnapshot], []);
}

function finishTurn(snapshot: GameSnapshot, config: GameConfig): void {
  const completedLine = findLine(snapshot, config, snapshot.currentPlayer);

  if (completedLine) {
    snapshot.lineCells = completedLine;
    snapshot.gameOver = true;
    snapshot.statusMessage = config.lineRule === "lose"
      ? t("gameOver.lose", { player: snapshot.currentPlayer, lineLength: config.lineLength })
      : t("gameOver.win", { player: snapshot.currentPlayer, lineLength: config.lineLength });
    return;
  }

  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  if (config.gravityEnabled) applyGravity(snapshot.board, config);

  snapshot.currentPlayer = getNextPlayer(snapshot.currentPlayer);
  snapshot.selectedPieceId = null;

  if (shouldDrawIfNoLegalMoves(snapshot, config)) {
    snapshot.gameOver = true;
    snapshot.statusMessage = t("gameOver.draw");
  }
}

function breakAbandonedCell(snapshot: GameSnapshot, config: GameConfig, source: BoardPosition): void {
  const cell = snapshot.board[source.row][source.col];

  if (config.brokenEnabled) {
    cell.brokenTurns = config.brokenHoleTurns;
    cell.brokenCreatedOnTurn = snapshot.turnNumber;
  } else {
    cell.brokenTurns = null;
    cell.brokenCreatedOnTurn = null;
  }
}

function movePieceToNewest(snapshot: GameSnapshot, player: Player, pieceId: number): void {
  const history = snapshot.pieceHistory[player];
  const index = history.indexOf(pieceId);
  if (index >= 0) history.splice(index, 1);
  history.push(pieceId);
}

function undoMove(state: GameState): GameState {
  if (state.undoStack.length === 0) return state;

  const undoStack = state.undoStack.slice(0, -1);
  const restored = cloneSnapshot(state.undoStack[state.undoStack.length - 1]);
  const redoStack = [...state.redoStack, createSnapshot(state)];

  return snapshotToState(state, restored, undoStack, redoStack);
}

function redoMove(state: GameState): GameState {
  if (state.redoStack.length === 0) return state;

  const redoStack = state.redoStack.slice(0, -1);
  const restored = cloneSnapshot(state.redoStack[state.redoStack.length - 1]);
  const undoStack = [...state.undoStack, createSnapshot(state)];

  return snapshotToState(state, restored, undoStack, redoStack);
}

export function createSnapshot(state: GameSnapshot): GameSnapshot {
  return cloneSnapshot({
    board: state.board,
    pieceHistory: state.pieceHistory,
    currentPlayer: state.currentPlayer,
    gameOver: state.gameOver,
    lineCells: state.lineCells,
    nextPieceId: state.nextPieceId,
    turnNumber: state.turnNumber,
    statusMessage: state.statusMessage,
    selectedPieceId: state.selectedPieceId
  });
}

function cloneSnapshot(snapshot: GameSnapshot): GameSnapshot {
  return structuredClone(snapshot) as GameSnapshot;
}

function snapshotToState(base: GameState, snapshot: GameSnapshot, undoStack: GameSnapshot[], redoStack: GameSnapshot[]): GameState {
  return {
    ...snapshot,
    config: base.config,
    undoStack,
    redoStack
  };
}

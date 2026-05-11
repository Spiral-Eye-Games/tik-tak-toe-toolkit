import { sanitizeConfig } from "./config";
import { getPlayerLabel } from "./formatters";
import { t } from "../i18n";
import {
  abandonCellForBroken,
  applyGravity,
  canAddPiece,
  canSelectPiece,
  createBoard,
  findLine,
  findPiecePosition,
  getDefaultSelectedPieceIdForcedOldest,
  getGravityTargetRow,
  getGravityTargetRowIgnoringPiece,
  getNextActivePlayer,
  getNextTurnAfterPlayerRemoved,
  isLegalMoveDestination,
  isLegalPlacementDestination,
  removeAllPiecesForPlayer,
  shouldDrawIfNoLegalMoves,
  tickBrokenHoles
} from "./rules";
import type { BoardPosition, GameAction, GameConfig, GameSnapshot, GameState, PlayerId } from "./types";

export function createInitialGameState(configInput: GameConfig): GameState {
  const config = sanitizeConfig(configInput);
  const rosterSlice = config.roster.slice(0, config.playerCount);
  const activePlayerIds = rosterSlice.map((player) => player.id);
  const pieceHistory = Object.fromEntries(activePlayerIds.map((id) => [id, [] as number[]])) as Record<PlayerId, number[]>;

  return {
    config,
    board: createBoard(config),
    pieceHistory,
    currentPlayer: activePlayerIds[0],
    activePlayerIds,
    placementOrderWin: [],
    eliminationOrderLose: [],
    gameOver: false,
    gameEndSummary: null,
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
    handleCompletedLine(snapshot, config, completedLine);
    return;
  }

  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  if (config.gravityEnabled) applyGravity(snapshot.board, config);

  snapshot.currentPlayer = getNextActivePlayer(snapshot.activePlayerIds, snapshot.currentPlayer);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

  if (shouldDrawIfNoLegalMoves(snapshot, config)) {
    snapshot.gameOver = true;
    snapshot.gameEndSummary = { type: "draw" };
    snapshot.statusMessage = t("gameOver.draw");
  }
}

function handleCompletedLine(snapshot: GameSnapshot, config: GameConfig, completedLine: BoardPosition[]): void {
  snapshot.lineCells = completedLine;
  const activeCount = snapshot.activePlayerIds.length;
  const label = (id: PlayerId) => getPlayerLabel(config, id);

  if (config.lineRule === "win") {
    if (!config.continueRanking) {
      snapshot.gameOver = true;
      snapshot.gameEndSummary = { type: "winner", winnerId: snapshot.currentPlayer };
      snapshot.statusMessage = t("gameOver.win", {
        player: label(snapshot.currentPlayer),
        lineLength: config.lineLength
      });
      return;
    }

    const winnerId = snapshot.currentPlayer;
    const oldActive = [...snapshot.activePlayerIds];

    if (activeCount === 2) {
      const loserId = oldActive.find((id) => id !== winnerId);
      snapshot.placementOrderWin.push(winnerId);
      if (config.eliminateWinners) {
        removeAllPiecesForPlayer(snapshot, config, winnerId);
      }
      snapshot.activePlayerIds = [];
      snapshot.lineCells = [];
      snapshot.gameOver = true;
      const orderedIds = loserId ? [...snapshot.placementOrderWin, loserId] : [...snapshot.placementOrderWin];
      snapshot.gameEndSummary = { type: "ranking", orderedIds };
      snapshot.statusMessage = t("gameOver.rankingComplete");
      return;
    }

    snapshot.placementOrderWin.push(winnerId);
    if (config.eliminateWinners) {
      removeAllPiecesForPlayer(snapshot, config, winnerId);
    }
    snapshot.activePlayerIds = oldActive.filter((id) => id !== winnerId);
    snapshot.lineCells = [];

    if (snapshot.activePlayerIds.length <= 1) {
      snapshot.gameOver = true;
      if (snapshot.activePlayerIds.length === 1) {
        snapshot.placementOrderWin.push(snapshot.activePlayerIds[0]);
      }
      snapshot.gameEndSummary = { type: "ranking", orderedIds: [...snapshot.placementOrderWin] };
      snapshot.statusMessage = t("gameOver.rankingComplete");
      return;
    }

    snapshot.currentPlayer = getNextTurnAfterPlayerRemoved(oldActive, winnerId);
    snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);
    tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
    if (config.gravityEnabled) applyGravity(snapshot.board, config);

    if (shouldDrawIfNoLegalMoves(snapshot, config)) {
      snapshot.gameOver = true;
      snapshot.gameEndSummary = { type: "draw" };
      snapshot.statusMessage = t("gameOver.draw");
    }
    return;
  }

  if (activeCount <= 2) {
    snapshot.gameOver = true;
    const loserId = snapshot.currentPlayer;
    const winnerId = snapshot.activePlayerIds.find((id) => id !== loserId);

    if (config.playerCount > 2) {
      const tail = [...snapshot.eliminationOrderLose].reverse();
      const orderedIds = winnerId ? [winnerId, loserId, ...tail] : tail;
      snapshot.gameEndSummary = orderedIds.length > 0
        ? { type: "ranking", orderedIds }
        : winnerId
          ? { type: "winner", winnerId, loserId }
          : { type: "draw" };
      snapshot.statusMessage = winnerId
        ? t("gameOver.survivorWin", { player: label(winnerId) })
        : t("gameOver.lose", {
            player: label(loserId),
            lineLength: config.lineLength
          });
      return;
    }

    snapshot.gameEndSummary = winnerId
      ? { type: "winner", winnerId, loserId }
      : { type: "draw" };
    snapshot.statusMessage = t("gameOver.lose", {
      player: label(snapshot.currentPlayer),
      lineLength: config.lineLength
    });
    return;
  }

  const eliminatedId = snapshot.currentPlayer;
  snapshot.eliminationOrderLose.push(eliminatedId);
  if (config.eliminateLosers) {
    removeAllPiecesForPlayer(snapshot, config, eliminatedId);
  }

  const oldActive = [...snapshot.activePlayerIds];
  snapshot.activePlayerIds = oldActive.filter((id) => id !== eliminatedId);
  snapshot.lineCells = [];

  if (snapshot.activePlayerIds.length === 1) {
    snapshot.gameOver = true;
    const champ = snapshot.activePlayerIds[0];
    const orderedIds = [champ, ...[...snapshot.eliminationOrderLose].reverse()];
    snapshot.gameEndSummary = { type: "ranking", orderedIds };
    snapshot.statusMessage = t("gameOver.survivorWin", {
      player: label(champ)
    });
    return;
  }

  snapshot.currentPlayer = getNextTurnAfterPlayerRemoved(oldActive, eliminatedId);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);
  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  if (config.gravityEnabled) applyGravity(snapshot.board, config);

  if (shouldDrawIfNoLegalMoves(snapshot, config)) {
    snapshot.gameOver = true;
    snapshot.gameEndSummary = { type: "draw" };
    snapshot.statusMessage = t("gameOver.draw");
  }
}

function breakAbandonedCell(snapshot: GameSnapshot, config: GameConfig, source: BoardPosition): void {
  abandonCellForBroken(snapshot, config, source);
}

function movePieceToNewest(snapshot: GameSnapshot, player: PlayerId, pieceId: number): void {
  const history = snapshot.pieceHistory[player];
  if (!history) return;
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
    activePlayerIds: state.activePlayerIds,
    placementOrderWin: state.placementOrderWin,
    eliminationOrderLose: state.eliminationOrderLose,
    gameOver: state.gameOver,
    gameEndSummary: state.gameEndSummary,
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

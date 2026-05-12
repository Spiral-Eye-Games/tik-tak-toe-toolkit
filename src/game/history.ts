import type { GameSnapshot, GameState, PlayerId } from "./types";

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
    selectedPieceId: state.selectedPieceId,
    gravityDirection: state.gravityDirection,
    pendingGravityRotationTarget: state.pendingGravityRotationTarget ?? null,
    collapseCount: state.collapseCount,
    clockTurnStartedAtMs: state.clockTurnStartedAtMs,
    clockBankRemaining: state.clockBankRemaining ? { ...state.clockBankRemaining } : null,
    clockPauseStartedAtMs: state.clockPauseStartedAtMs ?? null
  });
}

export function cloneSnapshot(snapshot: GameSnapshot): GameSnapshot {
  return structuredClone(snapshot) as GameSnapshot;
}

export function snapshotToState(
  base: GameState,
  snapshot: GameSnapshot,
  undoStack: GameSnapshot[],
  redoStack: GameSnapshot[]
): GameState {
  return {
    ...snapshot,
    pendingGravityRotationTarget: snapshot.pendingGravityRotationTarget ?? null,
    config: base.config,
    undoStack,
    redoStack
  };
}

export function undoMove(state: GameState): GameState {
  if (state.undoStack.length === 0) return state;

  const undoStack = state.undoStack.slice(0, -1);
  const restored = cloneSnapshot(state.undoStack[state.undoStack.length - 1]);
  const redoStack = [...state.redoStack, createSnapshot(state)];

  return snapshotToState(state, restored, undoStack, redoStack);
}

export function redoMove(state: GameState): GameState {
  if (state.redoStack.length === 0) return state;

  const redoStack = state.redoStack.slice(0, -1);
  const restored = cloneSnapshot(state.redoStack[state.redoStack.length - 1]);
  const undoStack = [...state.undoStack, createSnapshot(state)];

  return snapshotToState(state, restored, undoStack, redoStack);
}

export function movePieceToNewest(snapshot: GameSnapshot, player: PlayerId, pieceId: number): void {
  const history = snapshot.pieceHistory[player];
  if (!history) return;
  const index = history.indexOf(pieceId);
  if (index >= 0) history.splice(index, 1);
  history.push(pieceId);
}

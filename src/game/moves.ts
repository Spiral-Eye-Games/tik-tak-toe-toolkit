import { commitBankAfterSuccessfulMove, isClockEnabled, restartTurnClock } from "./clock";
import { isVerticalGravity, scanColumnLanding, scanRowLanding } from "./gravity";
import { createSnapshot, cloneSnapshot, movePieceToNewest, snapshotToState } from "./history";
import { finishTurn } from "./outcomes";
import {
  abandonCellForBroken,
  applyGravity,
  canAddPiece,
  canSelectPiece,
  findPiecePosition,
  isBroken,
  isLegalMoveDestination,
  isLegalPlacementDestination
} from "./rules";
import { getRestrictedMoveCaptures, getRestrictedMoveConversions } from "./restrictions";
import type { BoardPosition, GameSnapshot, GameState, PlayerId } from "./types";

export function playMove(state: GameState, clickedRow: number, clickedCol: number): GameState {
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

  if (state.pendingGravityRotationTarget !== null) return state;

  if (state.selectedPieceId !== null) {
    return moveSelectedPiece(state, clickedRow, clickedCol);
  }

  return placeNewPiece(state, clickedRow, clickedCol);
}

function placeNewPiece(state: GameState, clickedRow: number, clickedCol: number): GameState {
  if (!canAddPiece(state, state.config, state.currentPlayer)) return state;

  if (!isLegalPlacementDestination(state, state.config, clickedRow, clickedCol)) return state;

  const d = state.gravityDirection;
  let row = clickedRow;
  let col = clickedCol;
  if (state.config.gravityEnabled) {
    if (isVerticalGravity(d)) {
      const r = scanColumnLanding(state.board, state.config, d, clickedCol, null, state);
      if (r === null) return state;
      row = r;
      col = clickedCol;
    } else {
      const c = scanRowLanding(state.board, state.config, d, clickedRow, null, state);
      if (c === null) return state;
      row = clickedRow;
      col = c;
    }
  }

  const previousSnapshot = createSnapshot(state);
  const next = cloneSnapshot(previousSnapshot);

  next.turnNumber++;
  next.selectedPieceId = null;
  next.statusMessage = "";

  const piece = { id: next.nextPieceId++, owner: next.currentPlayer };
  next.board[row][col].piece = piece;
  next.pieceHistory[next.currentPlayer].push(piece.id);

  if (state.config.gravityEnabled) applyGravity(next.board, state.config, next.gravityDirection, next);
  commitBankAfterSuccessfulMove(next, state.config, Date.now(), { ignoreElapsed: state.turnNumber === 0 });
  finishTurn(next, state.config);
  if (!next.gameOver && isClockEnabled(state.config)) {
    restartTurnClock(next, state.config, Date.now());
  }

  return snapshotToState(state, next, [...state.undoStack, previousSnapshot], []);
}

function moveSelectedPiece(state: GameState, clickedRow: number, clickedCol: number): GameState {
  if (state.selectedPieceId === null) return state;

  const source = findPiecePosition(state.board, state.selectedPieceId);
  if (!source) {
    return { ...state, selectedPieceId: null };
  }

  if (!isLegalMoveDestination(state, state.config, clickedRow, clickedCol)) return state;
  const capturedPositions = getRestrictedMoveCaptures(
    state.board,
    state.config,
    source,
    { row: clickedRow, col: clickedCol }
  );
  const convertedPositions = getRestrictedMoveConversions(
    state.board,
    state.config,
    source,
    { row: clickedRow, col: clickedCol }
  );

  const previousSnapshot = createSnapshot(state);
  const next = cloneSnapshot(previousSnapshot);
  const selectedPieceId = state.selectedPieceId;
  const nextSource = findPiecePosition(next.board, selectedPieceId);

  if (!nextSource) return state;

  next.turnNumber++;
  next.statusMessage = "";

  removeCapturedPieces(next, capturedPositions);
  convertCapturedPieces(next, convertedPositions, next.currentPlayer);

  const piece = next.board[nextSource.row][nextSource.col].piece;
  if (piece === null) return state;

  next.board[nextSource.row][nextSource.col].piece = null;
  abandonCellForBroken(next, state.config, nextSource);

  if (state.config.gravityEnabled) applyGravity(next.board, state.config, next.gravityDirection, next);

  const destCell = next.board[clickedRow]?.[clickedCol];
  if (!destCell || destCell.piece !== null || isBroken(destCell)) return state;

  next.board[clickedRow][clickedCol].piece = piece;
  movePieceToNewest(next, piece.owner, piece.id);
  next.selectedPieceId = null;

  if (state.config.gravityEnabled) applyGravity(next.board, state.config, next.gravityDirection, next);
  commitBankAfterSuccessfulMove(next, state.config, Date.now(), { ignoreElapsed: state.turnNumber === 0 });
  finishTurn(next, state.config);
  if (!next.gameOver && isClockEnabled(state.config)) {
    restartTurnClock(next, state.config, Date.now());
  }

  return snapshotToState(state, next, [...state.undoStack, previousSnapshot], []);
}

function removeCapturedPieces(snapshot: GameSnapshot, positions: BoardPosition[]): void {
  for (const position of positions) {
    const piece = snapshot.board[position.row]?.[position.col]?.piece;
    if (!piece) continue;

    snapshot.board[position.row][position.col].piece = null;
    removePieceFromHistory(snapshot, piece.owner, piece.id);
  }
}

function removePieceFromHistory(snapshot: GameSnapshot, player: PlayerId, pieceId: number): void {
  const history = snapshot.pieceHistory[player];
  if (!history) return;
  const index = history.indexOf(pieceId);
  if (index >= 0) history.splice(index, 1);
}

function convertCapturedPieces(snapshot: GameSnapshot, positions: BoardPosition[], newOwner: PlayerId): void {
  for (const position of positions) {
    const piece = snapshot.board[position.row]?.[position.col]?.piece;
    if (!piece || piece.owner === newOwner) continue;

    removePieceFromHistory(snapshot, piece.owner, piece.id);
    piece.owner = newOwner;
    snapshot.pieceHistory[newOwner]?.push(piece.id);
  }
}

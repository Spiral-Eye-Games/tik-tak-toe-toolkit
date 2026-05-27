import {
  clearClockPauseIfNoPendingGravity,
  commitBankAfterSuccessfulMove,
  isClockEnabled,
  restartTurnClock
} from "./clock";
import { resolveCombosGameEndIfDue } from "./combosEnd";
import { runCombosCascadeUntilStable } from "./combosResolve";
import { advanceCombosAfterSpendingOneAction, combosRotatePlayerAndRefill } from "./combosTurn";
import { scheduleGravityRotationIfDue } from "./gravity";
import { snapshotToState } from "./history";
import { resolveExileEmptyBoard } from "./objectiveExtras";
import { applyGlobalBoardMaintenance } from "./outcomes";
import type { BoardPosition, GameSnapshot, GameState, PlayerId } from "./types";

function finalizeCombosPlacementCommon(
  baseState: GameState,
  previousSnapshot: GameSnapshot,
  snap: GameSnapshot,
  placementHint: BoardPosition,
  creditPlayer: PlayerId
): GameState {
  runCombosCascadeUntilStable(snap, baseState.config, placementHint, creditPlayer);

  applyGlobalBoardMaintenance(snap, baseState.config);
  if (snap.gameOver) {
    return snapshotToState(baseState, snap, [...baseState.undoStack, previousSnapshot], []);
  }

  snap.combosActionsRemainingThisTurn--;
  advanceCombosAfterSpendingOneAction(snap, baseState.config);

  resolveCombosGameEndIfDue(snap, baseState.config);

  if (!snap.gameOver) {
    resolveExileEmptyBoard(snap, baseState.config);
  }

  scheduleGravityRotationIfDue(snap, baseState.config);
  clearClockPauseIfNoPendingGravity(snap);

  if (!snap.gameOver && isClockEnabled(baseState.config)) {
    restartTurnClock(snap, baseState.config, Date.now());
  }

  return snapshotToState(baseState, snap, [...baseState.undoStack, previousSnapshot], []);
}

export function finalizeCombosAfterPlacement(
  baseState: GameState,
  previousSnapshot: GameSnapshot,
  snap: GameSnapshot,
  landedPosition: BoardPosition,
  creditPlayer: PlayerId
): GameState {
  commitBankAfterSuccessfulMove(snap, baseState.config, Date.now(), { ignoreElapsed: baseState.turnNumber === 0 });
  return finalizeCombosPlacementCommon(baseState, previousSnapshot, snap, landedPosition, creditPlayer);
}

export function finalizeCombosAfterMovePiece(
  baseState: GameState,
  previousSnapshot: GameSnapshot,
  snap: GameSnapshot,
  destination: BoardPosition,
  creditPlayer: PlayerId
): GameState {
  commitBankAfterSuccessfulMove(snap, baseState.config, Date.now(), { ignoreElapsed: baseState.turnNumber === 0 });
  return finalizeCombosPlacementCommon(baseState, previousSnapshot, snap, destination, creditPlayer);
}

/** Omite acciones restantes y avanza turno/ronda como fin de turno clásico. */
export function finalizeCombosForcedTurnEnd(baseState: GameState, previousSnapshot: GameSnapshot, snap: GameSnapshot): GameState {
  applyGlobalBoardMaintenance(snap, baseState.config);
  if (!snap.gameOver) {
    combosRotatePlayerAndRefill(snap, baseState.config);
  }

  resolveCombosGameEndIfDue(snap, baseState.config);

  if (!snap.gameOver) {
    resolveExileEmptyBoard(snap, baseState.config);
  }

  scheduleGravityRotationIfDue(snap, baseState.config);
  clearClockPauseIfNoPendingGravity(snap);

  if (!snap.gameOver && isClockEnabled(baseState.config)) {
    restartTurnClock(snap, baseState.config, Date.now());
  }

  return snapshotToState(baseState, snap, [...baseState.undoStack, previousSnapshot], []);
}

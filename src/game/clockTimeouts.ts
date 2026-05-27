import {
  clearClockPauseIfNoPendingGravity,
  extendClockTurnStartAfterGravityPause,
  getClockRemainingSeconds,
  isClockEnabled,
  restartTurnClock
} from "./clock";
import { isCombosObjective } from "./config";
import { finalizeCombosForcedTurnEnd } from "./combosAfterMove";
import { applyScheduledGravityRotation, scheduleGravityRotationIfDue } from "./gravity";
import { cloneSnapshot, createSnapshot, snapshotToState } from "./history";
import { advanceTurnAfterNoLine, resolveActivePlayerLine, resolveBankTimeoutLoss } from "./outcomes";
import type { GameState } from "./types";

export function applyClockBankTimeout(state: GameState): GameState {
  if (
    state.gameOver ||
    !state.config.clockEnabled ||
    state.config.clockMode !== "bank" ||
    state.pendingGravityRotationTarget !== null
  ) {
    return state;
  }

  const remaining = getClockRemainingSeconds(state, state.config, Date.now());
  if (remaining === null || remaining > 0.12) return state;

  const snap = cloneSnapshot(createSnapshot(state));
  resolveBankTimeoutLoss(snap, state.config);
  if (!snap.gameOver && isClockEnabled(state.config)) {
    restartTurnClock(snap, state.config, Date.now());
  }

  return snapshotToState(state, snap, state.undoStack, []);
}

export function applyClockPerTurnTimeout(state: GameState): GameState {
  if (
    state.gameOver ||
    !state.config.clockEnabled ||
    state.config.clockMode !== "perTurn" ||
    state.pendingGravityRotationTarget !== null
  ) {
    return state;
  }

  const remaining = getClockRemainingSeconds(state, state.config, Date.now());
  if (remaining === null || remaining > 0.12) return state;

  const previousSnapshot = createSnapshot(state);
  const snap = cloneSnapshot(previousSnapshot);
  snap.turnNumber++;
  snap.statusMessage = "";

  if (isCombosObjective(state.config)) {
    return finalizeCombosForcedTurnEnd(state, previousSnapshot, snap);
  }

  advanceTurnAfterNoLine(snap, state.config);
  scheduleGravityRotationIfDue(snap, state.config);
  clearClockPauseIfNoPendingGravity(snap);

  if (!snap.gameOver && isClockEnabled(state.config)) {
    restartTurnClock(snap, state.config, Date.now());
  }

  return snapshotToState(state, snap, [...state.undoStack, previousSnapshot], []);
}

export function completePendingGravityRotation(state: GameState): GameState {
  if (state.pendingGravityRotationTarget === null) return state;

  const snap = cloneSnapshot(createSnapshot(state));
  const nowMs = Date.now();
  extendClockTurnStartAfterGravityPause(snap, nowMs);

  resolveActivePlayerLine(snap, state.config);
  if (snap.gameOver) return snapshotToState(state, snap, state.undoStack, state.redoStack);

  applyScheduledGravityRotation(snap, state.config);
  resolveActivePlayerLine(snap, state.config);
  return snapshotToState(state, snap, state.undoStack, state.redoStack);
}

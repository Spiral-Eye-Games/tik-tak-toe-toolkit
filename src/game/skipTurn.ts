import { commitBankAfterVoluntaryPass, clearClockPauseIfNoPendingGravity, isClockEnabled, restartTurnClock } from "./clock";
import { scheduleGravityRotationIfDue } from "./gravity";
import { cloneSnapshot, createSnapshot, snapshotToState } from "./history";
import { advanceTurnAfterNoLine } from "./outcomes";
import type { GameState } from "./types";

export function applySkipTurn(state: GameState): GameState {
  if (!state.config.skipTurnEnabled || state.gameOver || state.pendingGravityRotationTarget !== null) {
    return state;
  }

  const previousSnapshot = createSnapshot(state);
  const snap = cloneSnapshot(previousSnapshot);
  commitBankAfterVoluntaryPass(snap, state.config, Date.now(), { ignoreElapsed: state.turnNumber === 0 });
  snap.turnNumber++;
  snap.statusMessage = "";
  advanceTurnAfterNoLine(snap, state.config);
  scheduleGravityRotationIfDue(snap, state.config);
  clearClockPauseIfNoPendingGravity(snap);

  if (!snap.gameOver && isClockEnabled(state.config)) {
    restartTurnClock(snap, state.config, Date.now());
  }

  return snapshotToState(state, snap, [...state.undoStack, previousSnapshot], []);
}

import { clearClockPauseIfNoPendingGravity } from "./clock";
import { applyCollapseIfDue } from "./collapse";
import { getPlayerLabel } from "./formatters";
import { scheduleGravityRotationIfDue } from "./gravity";
import { cloneSnapshot, createSnapshot, snapshotToState } from "./history";
import { t } from "../i18n";
import { applyGravity } from "./gravity";
import {
  applyStalemateTieBreakMostPieces,
  resolveExileEmptyBoard
} from "./objectiveExtras";
import {
  findLine,
  getDefaultSelectedPieceIdForcedOldest,
  removeAllPiecesForPlayer,
  shouldDrawIfNoLegalMoves,
  tickBrokenHoles
} from "./rules";
import { getNextActivePlayerAfterChanges } from "./turns";
import type { BoardPosition, GameConfig, GameSnapshot, GameState, PlayerId } from "./types";

export function advanceTurnAfterNoLine(snapshot: GameSnapshot, config: GameConfig): void {
  const oldActive = [...snapshot.activePlayerIds];
  const completedPlayer = snapshot.currentPlayer;
  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  applyCollapseIfDue(snapshot, config);
  if (snapshot.gameOver) return;

  if (config.gravityEnabled) applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);

  snapshot.currentPlayer = getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, completedPlayer);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

  finishIfNoLegalMoves(snapshot, config);
}

export function finishTurn(snapshot: GameSnapshot, config: GameConfig): void {
  const completedLine = findLine(snapshot, config, snapshot.currentPlayer);

  if (completedLine) {
    handleCompletedLine(snapshot, config, completedLine);
  } else {
    advanceTurnAfterNoLine(snapshot, config);
  }

  if (!snapshot.gameOver) {
    resolveExileEmptyBoard(snapshot, config);
  }

  scheduleGravityRotationIfDue(snapshot, config);
  clearClockPauseIfNoPendingGravity(snapshot);
}

export function resolveActivePlayerLine(snapshot: GameSnapshot, config: GameConfig): boolean {
  if (snapshot.gameOver) return false;

  const activePlayers = getActivePlayersStartingFromCurrent(snapshot);
  for (const playerId of activePlayers) {
    const completedLine = findLine(snapshot, config, playerId);
    if (!completedLine) continue;

    snapshot.currentPlayer = playerId;
    handleCompletedLine(snapshot, config, completedLine);
    return true;
  }

  return false;
}

type ForfeitKind = "disconnect" | "surrender";

export function forfeitPlayer(state: GameState, playerId: PlayerId, kind: ForfeitKind = "disconnect"): GameState {
  if (state.gameOver || !state.activePlayerIds.includes(playerId)) return state;

  const snap = cloneSnapshot(createSnapshot(state));
  resolveForfeitLoss(snap, state.config, playerId, kind);
  return snapshotToState(state, snap, state.undoStack, []);
}

function resolveForfeitLoss(snapshot: GameSnapshot, config: GameConfig, playerId: PlayerId, kind: ForfeitKind): void {
  if (snapshot.gameOver || !snapshot.activePlayerIds.includes(playerId)) return;

  const oldActive = [...snapshot.activePlayerIds];
  const activeCount = snapshot.activePlayerIds.length;
  const label = (id: PlayerId) => getPlayerLabel(config, id);

  snapshot.currentPlayer = playerId;
  snapshot.lineCells = [];

  if (activeCount <= 2) {
    snapshot.gameOver = true;
    const winnerId = oldActive.find((id) => id !== playerId);
    snapshot.gameEndSummary = winnerId ? { type: "winner", winnerId, loserId: playerId } : { type: "draw" };
    snapshot.statusMessage = winnerId
      ? kind === "surrender"
        ? t("gameOver.surrender", { loser: label(playerId), winner: label(winnerId) })
        : t("gameOver.forfeit", { loser: label(playerId), winner: label(winnerId) })
      : t("gameOver.draw");
    return;
  }

  snapshot.eliminationOrderLose.push(playerId);
  if (config.removeOutOfGamePieces) {
    removeAllPiecesForPlayer(snapshot, config, playerId);
  }
  snapshot.activePlayerIds = oldActive.filter((id) => id !== playerId);

  if (snapshot.activePlayerIds.length === 1) {
    snapshot.gameOver = true;
    const champ = snapshot.activePlayerIds[0];
    const orderedIds = [champ, ...[...snapshot.eliminationOrderLose].reverse()];
    snapshot.gameEndSummary = { type: "ranking", orderedIds };
    snapshot.statusMessage = t("gameOver.survivorWin", { player: label(champ) });
    return;
  }

  advanceAfterPlayerRemoved(snapshot, config, oldActive, playerId);

  if (!snapshot.gameOver) {
    scheduleGravityRotationIfDue(snapshot, config);
    clearClockPauseIfNoPendingGravity(snapshot);
  }
}

function handleCompletedLine(snapshot: GameSnapshot, config: GameConfig, completedLine: BoardPosition[]): void {
  snapshot.lineCells = completedLine;
  const activeCount = snapshot.activePlayerIds.length;
  const label = (id: PlayerId) => getPlayerLabel(config, id);

  if (config.lineRule === "win") {
    handleWinningLine(snapshot, config, activeCount, label);
    return;
  }

  handleLosingLine(snapshot, config, activeCount, label);
}

function handleWinningLine(
  snapshot: GameSnapshot,
  config: GameConfig,
  activeCount: number,
  label: (id: PlayerId) => string
): void {
  if (config.singleWinner) {
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
    if (config.removeOutOfGamePieces) {
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
  if (config.removeOutOfGamePieces) {
    removeAllPiecesForPlayer(snapshot, config, winnerId);
  }
  snapshot.activePlayerIds = oldActive.filter((id) => id !== winnerId);

  if (snapshot.activePlayerIds.length <= 1) {
    snapshot.gameOver = true;
    if (snapshot.activePlayerIds.length === 1) {
      snapshot.placementOrderWin.push(snapshot.activePlayerIds[0]);
    }
    snapshot.gameEndSummary = { type: "ranking", orderedIds: [...snapshot.placementOrderWin] };
    snapshot.statusMessage = t("gameOver.rankingComplete");
    return;
  }

  if (finishIfNoLegalMoves(snapshot, config)) return;

  snapshot.lineCells = [];
  advanceAfterPlayerRemoved(snapshot, config, oldActive, winnerId);
}

function handleLosingLine(
  snapshot: GameSnapshot,
  config: GameConfig,
  activeCount: number,
  label: (id: PlayerId) => string
): void {
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
  if (config.removeOutOfGamePieces) {
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

  advanceAfterPlayerRemoved(snapshot, config, oldActive, eliminatedId);
}

function advanceAfterPlayerRemoved(
  snapshot: GameSnapshot,
  config: GameConfig,
  oldActive: PlayerId[],
  removedId: PlayerId
): void {
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);
  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  applyCollapseIfDue(snapshot, config);
  if (snapshot.gameOver) return;

  if (config.gravityEnabled) applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);
  snapshot.currentPlayer = getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, removedId);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

  finishIfNoLegalMoves(snapshot, config);
}

function finishIfNoLegalMoves(snapshot: GameSnapshot, config: GameConfig): boolean {
  resolveExileEmptyBoard(snapshot, config);
  if (snapshot.gameOver) return true;
  if (!shouldDrawIfNoLegalMoves(snapshot, config)) return false;

  snapshot.gameOver = true;
  if (snapshot.placementOrderWin.length > 0 || snapshot.eliminationOrderLose.length > 0) {
    snapshot.gameEndSummary = { type: "ranking", orderedIds: buildResolvedRanking(snapshot) };
    snapshot.statusMessage = t("gameOver.rankingComplete");
    return true;
  }

  if (applyStalemateTieBreakMostPieces(snapshot, config)) {
    return true;
  }

  snapshot.gameEndSummary = { type: "draw" };
  snapshot.statusMessage = t("gameOver.draw");
  return true;
}

function buildResolvedRanking(snapshot: GameSnapshot): PlayerId[] {
  const orderedIds = [
    ...snapshot.placementOrderWin,
    ...snapshot.activePlayerIds,
    ...[...snapshot.eliminationOrderLose].reverse()
  ];
  return orderedIds.filter((id, index) => orderedIds.indexOf(id) === index);
}

function getActivePlayersStartingFromCurrent(snapshot: GameSnapshot): PlayerId[] {
  const index = snapshot.activePlayerIds.indexOf(snapshot.currentPlayer);
  if (index < 0) return [...snapshot.activePlayerIds];
  return [
    ...snapshot.activePlayerIds.slice(index),
    ...snapshot.activePlayerIds.slice(0, index)
  ];
}

/** El jugador actual se queda sin tiempo en modo banca: pierde la partida o queda eliminado. */
export function resolveBankTimeoutLoss(snapshot: GameSnapshot, config: GameConfig): void {
  const activeCount = snapshot.activePlayerIds.length;
  const label = (id: PlayerId) => getPlayerLabel(config, id);
  const timedOutId = snapshot.currentPlayer;

  if (snapshot.clockBankRemaining && snapshot.clockBankRemaining[timedOutId] !== undefined) {
    snapshot.clockBankRemaining[timedOutId] = 0;
  }

  if (activeCount <= 2) {
    snapshot.gameOver = true;
    snapshot.lineCells = [];
    const loserId = timedOutId;
    const winnerId = snapshot.activePlayerIds.find((id) => id !== loserId);
    snapshot.gameEndSummary = winnerId ? { type: "winner", winnerId, loserId, endKind: "clock_bank" } : { type: "draw" };
    snapshot.statusMessage = winnerId
      ? t("gameOver.clockBankOut", { loser: label(loserId), winner: label(winnerId) })
      : t("gameOver.draw");
    return;
  }

  const eliminatedId = timedOutId;
  snapshot.eliminationOrderLose.push(eliminatedId);
  if (config.removeOutOfGamePieces) {
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

  advanceAfterPlayerRemoved(snapshot, config, oldActive, eliminatedId);

  if (!snapshot.gameOver) {
    scheduleGravityRotationIfDue(snapshot, config);
    clearClockPauseIfNoPendingGravity(snapshot);
  }
}

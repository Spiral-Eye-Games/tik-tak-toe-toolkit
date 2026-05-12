import { clearClockPauseIfNoPendingGravity } from "./clock";
import { applyCollapseIfDue } from "./collapse";
import { getPlayerLabel } from "./formatters";
import { scheduleGravityRotationIfDue } from "./gravity";
import { t } from "../i18n";
import {
  applyGravity,
  findLine,
  getDefaultSelectedPieceIdForcedOldest,
  removeAllPiecesForPlayer,
  shouldDrawIfNoLegalMoves,
  tickBrokenHoles
} from "./rules";
import type { BoardPosition, GameConfig, GameSnapshot, PlayerId } from "./types";

export function advanceTurnAfterNoLine(snapshot: GameSnapshot, config: GameConfig): void {
  const oldActive = [...snapshot.activePlayerIds];
  const completedPlayer = snapshot.currentPlayer;
  tickBrokenHoles(snapshot.board, config, snapshot.turnNumber);
  applyCollapseIfDue(snapshot, config);
  if (snapshot.gameOver) return;

  if (config.gravityEnabled) applyGravity(snapshot.board, config, snapshot.gravityDirection);

  snapshot.currentPlayer = getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, completedPlayer);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

  if (shouldDrawIfNoLegalMoves(snapshot, config)) {
    snapshot.gameOver = true;
    snapshot.gameEndSummary = { type: "draw" };
    snapshot.statusMessage = t("gameOver.draw");
  }
}

export function finishTurn(snapshot: GameSnapshot, config: GameConfig): void {
  const completedLine = findLine(snapshot, config, snapshot.currentPlayer);

  if (completedLine) {
    handleCompletedLine(snapshot, config, completedLine);
  } else {
    advanceTurnAfterNoLine(snapshot, config);
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

  if (config.gravityEnabled) applyGravity(snapshot.board, config, snapshot.gravityDirection);
  snapshot.currentPlayer = getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, removedId);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

  if (shouldDrawIfNoLegalMoves(snapshot, config)) {
    snapshot.gameOver = true;
    snapshot.gameEndSummary = { type: "draw" };
    snapshot.statusMessage = t("gameOver.draw");
  }
}

function getNextActivePlayerAfterChanges(oldActive: PlayerId[], activePlayerIds: PlayerId[], afterPlayerId: PlayerId): PlayerId {
  if (activePlayerIds.length === 0) return afterPlayerId;
  const startIndex = oldActive.indexOf(afterPlayerId);
  if (startIndex < 0) return activePlayerIds[0];

  for (let step = 1; step <= oldActive.length; step++) {
    const candidate = oldActive[(startIndex + step) % oldActive.length];
    if (activePlayerIds.includes(candidate)) return candidate;
  }

  return activePlayerIds[0];
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

  advanceAfterPlayerRemoved(snapshot, config, oldActive, eliminatedId);

  if (!snapshot.gameOver) {
    scheduleGravityRotationIfDue(snapshot, config);
    clearClockPauseIfNoPendingGravity(snapshot);
  }
}

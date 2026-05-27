import { getPlayerLabel } from "./formatters";
import { applyGravity } from "./gravity";
import { t } from "../i18n";
import { getDefaultSelectedPieceIdForcedOldest, removeAllPiecesForPlayer } from "./rules";
import { getNextActivePlayerAfterChanges } from "./turns";
import type { GameConfig, GameSnapshot, ObjectiveExtraRuleId, PlayerId } from "./types";

export function hasObjectiveRule(config: GameConfig, rule: ObjectiveExtraRuleId): boolean {
  if (config.lineRule === "combos") return false;
  return config.objectiveExtraRules.includes(rule);
}

function boardHasAnyPiece(snapshot: GameSnapshot, config: GameConfig): boolean {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      if (snapshot.board[row][col].piece) return true;
    }
  }
  return false;
}

function countPiecesOnBoardForPlayer(snapshot: GameSnapshot, config: GameConfig, playerId: PlayerId): number {
  let n = 0;
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      if (snapshot.board[row][col].piece?.owner === playerId) n++;
    }
  }
  return n;
}

/** Antes de declarar empate por falta de jugadas: gana quien tiene más fichas en tablero (si el desempate está activo). */
export function applyStalemateTieBreakMostPieces(snapshot: GameSnapshot, config: GameConfig): boolean {
  if (!hasObjectiveRule(config, "tieBreakMostPieces")) return false;
  const active = snapshot.activePlayerIds;
  if (active.length < 2) return false;

  const counts: Partial<Record<PlayerId, number>> = {};
  for (const id of active) counts[id] = 0;
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const owner = snapshot.board[row][col].piece?.owner;
      if (owner !== undefined && counts[owner] !== undefined) counts[owner]!++;
    }
  }

  const countList = active.map((id) => counts[id] ?? 0);
  const max = Math.max(...countList);
  const leaders = active.filter((id) => (counts[id] ?? 0) === max);
  if (leaders.length !== 1) return false;

  const winnerId = leaders[0]!;
  const label = (id: PlayerId) => getPlayerLabel(config, id);

  if (active.length === 2) {
    const loserId = active.find((id) => id !== winnerId)!;
    snapshot.gameOver = true;
    snapshot.gameEndSummary = { type: "winner", winnerId, loserId };
    snapshot.statusMessage = t("gameOver.stalemateDominio", { winner: label(winnerId), count: max });
    return true;
  }

  const rosterIndex = (id: PlayerId) => config.roster.findIndex((p) => p.id === id);
  const sorted = [...active].sort((a, b) => {
    const ca = counts[a] ?? 0;
    const cb = counts[b] ?? 0;
    if (cb !== ca) return cb - ca;
    return rosterIndex(a) - rosterIndex(b);
  });
  if ((counts[sorted[0]!] ?? 0) === (counts[sorted[1]!] ?? 0)) return false;

  snapshot.gameOver = true;
  snapshot.gameEndSummary = { type: "ranking", orderedIds: sorted };
  snapshot.statusMessage = t("gameOver.stalemateDominioRanking", {
    winner: label(sorted[0]!),
    count: counts[sorted[0]!] ?? 0
  });
  return true;
}

/**
 * Pierde quien se queda sin fichas en el tablero mientras el juego ya está en curso.
 * Se retrasa hasta `turnNumber >= playerCount` para no eliminar a quien aún no pudo colocar en la apertura.
 */
export function resolveExileEmptyBoard(snapshot: GameSnapshot, config: GameConfig): void {
  if (!hasObjectiveRule(config, "exileEmptyBoard")) return;
  if (snapshot.gameOver) return;
  if (snapshot.turnNumber < config.playerCount) return;
  if (!boardHasAnyPiece(snapshot, config)) return;

  let losers = snapshot.activePlayerIds.filter((id) => countPiecesOnBoardForPlayer(snapshot, config, id) === 0);

  const label = (id: PlayerId) => getPlayerLabel(config, id);

  while (losers.length > 0 && !snapshot.gameOver) {
    const batch = losers;
    const oldActive = [...snapshot.activePlayerIds];

    for (const loserId of batch) {
      snapshot.eliminationOrderLose.push(loserId);
      if (config.removeOutOfGamePieces && countPiecesOnBoardForPlayer(snapshot, config, loserId) > 0) {
        removeAllPiecesForPlayer(snapshot, config, loserId);
      } else {
        snapshot.pieceHistory[loserId] = [];
      }
    }

    snapshot.activePlayerIds = oldActive.filter((id) => !batch.includes(id));
    snapshot.lineCells = [];

    if (snapshot.activePlayerIds.length === 0) {
      snapshot.gameOver = true;
      snapshot.gameEndSummary = { type: "draw" };
      snapshot.statusMessage = t("gameOver.draw");
      return;
    }

    if (snapshot.activePlayerIds.length === 1) {
      snapshot.gameOver = true;
      const champ = snapshot.activePlayerIds[0]!;
      const lastLoser = snapshot.eliminationOrderLose[snapshot.eliminationOrderLose.length - 1]!;
      if (config.playerCount === 2) {
        snapshot.gameEndSummary = { type: "winner", winnerId: champ, loserId: lastLoser };
        snapshot.statusMessage = t("gameOver.exilioWinner", {
          winner: label(champ),
          loser: label(lastLoser)
        });
      } else {
        snapshot.gameEndSummary = {
          type: "ranking",
          orderedIds: [champ, ...[...snapshot.eliminationOrderLose].reverse()]
        };
        snapshot.statusMessage = t("gameOver.survivorWin", { player: label(champ) });
      }
      return;
    }

    const ref = batch.includes(snapshot.currentPlayer)
      ? getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, snapshot.currentPlayer)
      : snapshot.currentPlayer;
    snapshot.currentPlayer = snapshot.activePlayerIds.includes(ref)
      ? ref
      : snapshot.activePlayerIds[0]!;
    snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);

    snapshot.statusMessage =
      batch.length === 1
        ? t("gameOver.exilio", { loser: label(batch[0]!) })
        : t("gameOver.exilioBatch", { players: batch.map(label).join(", ") });

    if (config.gravityEnabled) {
      applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);
    }

    losers = snapshot.activePlayerIds.filter((id) => countPiecesOnBoardForPlayer(snapshot, config, id) === 0);
  }
}

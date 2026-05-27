import { getPlayerLabel } from "./formatters";
import { t } from "../i18n";
import type { GameConfig, GameSnapshot, PlayerId } from "./types";

function combosRankingOrder(snapshot: GameSnapshot, config: GameConfig): PlayerId[] {
  const ids = [...snapshot.activePlayerIds];
  ids.sort((a, b) => {
    const sa = snapshot.combosScores[a] ?? 0;
    const sb = snapshot.combosScores[b] ?? 0;
    if (sa !== sb) return sb - sa;
    const ia = config.roster.findIndex((player) => player.id === a);
    const ib = config.roster.findIndex((player) => player.id === b);
    return ia - ib;
  });
  return ids;
}

function finalizeCombosRanking(snapshot: GameSnapshot, config: GameConfig): void {
  snapshot.gameOver = true;
  snapshot.lineCells = [];
  const orderedIds = combosRankingOrder(snapshot, config);
  snapshot.gameEndSummary = { type: "ranking", orderedIds };
  const label = (id: PlayerId) => getPlayerLabel(config, id);
  const leader = orderedIds[0];
  snapshot.statusMessage = leader ? t("gameOver.combosRankingSummary", { player: label(leader) }) : t("gameOver.draw");
}

/** Condiciones de fin solo modo Combos (sin victoria clásica por raya). */
export function resolveCombosGameEndIfDue(snapshot: GameSnapshot, config: GameConfig): void {
  if (snapshot.gameOver || config.lineRule !== "combos") return;

  if (config.combosEndMode === "maxRounds") {
    if (snapshot.fullRoundsCompleted >= config.combosEndValue) {
      finalizeCombosRanking(snapshot, config);
    }
    return;
  }

  const target = config.combosEndValue;
  for (const id of snapshot.activePlayerIds) {
    if ((snapshot.combosScores[id] ?? 0) >= target) {
      finalizeCombosRanking(snapshot, config);
      return;
    }
  }
}

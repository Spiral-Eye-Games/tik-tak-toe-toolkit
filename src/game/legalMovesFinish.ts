import { t } from "../i18n";
import { applyStalemateTieBreakMostPieces, resolveExileEmptyBoard } from "./objectiveExtras";
import { shouldDrawIfNoLegalMoves } from "./rules";
import type { GameConfig, GameSnapshot, PlayerId } from "./types";

export function buildResolvedRanking(snapshot: GameSnapshot): PlayerId[] {
  const orderedIds = [
    ...snapshot.placementOrderWin,
    ...snapshot.activePlayerIds,
    ...[...snapshot.eliminationOrderLose].reverse()
  ];
  return orderedIds.filter((id, index) => orderedIds.indexOf(id) === index);
}

export function finishIfNoLegalMoves(snapshot: GameSnapshot, config: GameConfig): boolean {
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

import { getPlayerLabel } from "../game/formatters";
import type { GameState, PlayerId } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

type OutcomeKind = "eliminated" | "round_won";

function buildEntries(state: GameState): Array<{ kind: OutcomeKind; playerId: PlayerId }> {
  const cfg = state.config;
  const list: Array<{ kind: OutcomeKind; playerId: PlayerId }> = [];

  if (cfg.lineRule === "lose") {
    for (const id of state.eliminationOrderLose) {
      list.push({ kind: "eliminated", playerId: id });
    }
  } else if (cfg.lineRule === "win" && cfg.continueRanking) {
    for (const id of state.placementOrderWin) {
      list.push({ kind: "round_won", playerId: id });
    }
  }

  return list;
}

export function BoardOutcomeStrip({ state }: { state: GameState }) {
  const entries = buildEntries(state);
  if (entries.length === 0) return null;

  return (
    <aside className="board-outcome-strip" aria-label={t("board.outcomeStripLabel")}>
      {entries.map((entry, index) => {
        const label = getPlayerLabel(state.config, entry.playerId);
        const title =
          entry.kind === "eliminated"
            ? t("board.outcomeEliminated", { player: label })
            : t("board.outcomeRoundWin", { player: label });

        return (
          <div
            key={`${entry.kind}-${entry.playerId}-${index}`}
            className={`board-outcome-chip board-outcome-chip--${entry.kind}`}
            title={title}
          >
            <PlayerMarkSpan config={state.config} playerId={entry.playerId} className="board-outcome-emoji" />
          </div>
        );
      })}
    </aside>
  );
}

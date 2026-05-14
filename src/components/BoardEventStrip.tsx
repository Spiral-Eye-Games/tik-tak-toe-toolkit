import { ArrowDown, ChevronsLeftRight, LockOpen } from "lucide-react";
import type { BoardTimelineRow } from "../game/boardTurnTimeline";
import type { GameState } from "../game/types";
import { getPlayerLabel } from "../game/formatters";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

function TimelineIcon({ row }: { row: BoardTimelineRow }) {
  if (row.kind === "collapse") {
    return <ChevronsLeftRight aria-hidden="true" />;
  }
  if (row.kind === "restrictionEnd") {
    return <LockOpen aria-hidden="true" />;
  }
  if (row.kind === "gravityPending" || row.kind === "gravityRotate") {
    return <ArrowDown aria-hidden="true" />;
  }
  return null;
}

function getTimelineRowText(state: GameState, row: BoardTimelineRow): string {
  if (row.kind === "player" && row.playerId) {
    return t("board.timeline.playerTurn", { player: getPlayerLabel(state.config, row.playerId) });
  }
  if (row.kind === "gravityPending") {
    return t("board.timeline.gravityPending");
  }
  if (row.kind === "gravityRotate") {
    return t("board.timeline.gravityRotate");
  }
  if (row.kind === "collapse") {
    return t("board.timeline.collapse");
  }
  if (row.kind === "restrictionEnd") {
    return t("board.timeline.restrictionEnd");
  }
  return "";
}

export function BoardEventStrip({ state, rows }: { state: GameState; rows: BoardTimelineRow[] }) {
  if (rows.length === 0) return null;

  return (
    <aside className="board-event-strip" aria-label={t("board.timeline.stripAriaLabel")}>
      {rows.map((row, index) => {
        const isCurrent = index === 0;
        const text = getTimelineRowText(state, row);
        const icon = row.kind === "player" ? null : <TimelineIcon row={row} />;

        if (row.kind === "player" && row.playerId) {
          return (
            <div
              key={`p-${index}-${row.playerId}`}
              className={[
                "board-event-chip",
                "board-event-chip--player",
                isCurrent ? "board-event-chip--current" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={text}
              title={text}
            >
              <PlayerMarkSpan config={state.config} playerId={row.playerId} className="board-event-strip__mark" />
              <span className="board-event-chip__text">{getPlayerLabel(state.config, row.playerId)}</span>
            </div>
          );
        }

        const modifier =
          row.kind === "collapse"
            ? "collapse"
            : row.kind === "restrictionEnd"
              ? "restrictionStart"
              : "gravity";

        return (
          <div
            key={`e-${index}-${row.kind}`}
            className={[
              "board-event-chip",
              `board-event-chip--${modifier}`,
              isCurrent ? "board-event-chip--current" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={text}
            title={text}
          >
            {icon !== null && <span className="board-event-icon">{icon}</span>}
            <span className="board-event-chip__text">{text}</span>
          </div>
        );
      })}
    </aside>
  );
}

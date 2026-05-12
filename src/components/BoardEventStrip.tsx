import { ArrowDown, ChevronsLeftRight } from "lucide-react";
import { getBoardEventCountdowns, type BoardEventCountdown } from "../game/eventCountdowns";
import type { GameState } from "../game/types";
import { t } from "../i18n";

function getUnitText(event: BoardEventCountdown): string {
  const unitKey = event.displayUnit === "rounds"
    ? event.displayAmount === 1 ? "roundSingular" : "roundPlural"
    : event.displayAmount === 1 ? "turnSingular" : "turnPlural";

  return t(`board.events.units.${unitKey}`);
}

function getEventText(event: BoardEventCountdown): string {
  const unit = getUnitText(event);

  if (event.kind === "collapse") {
    return t("board.events.collapseIn", {
      amount: event.displayAmount,
      unit
    });
  }

  if (event.remainingTurns === 0) {
    return t("board.events.gravityNow");
  }

  return t("board.events.gravityIn", {
    amount: event.displayAmount,
    unit
  });
}

function getVisibleEventText(event: BoardEventCountdown): string {
  if (event.remainingTurns === 0) return t("board.events.now");
  return t("board.events.eventIn", {
    amount: event.displayAmount,
    unit: getUnitText(event)
  });
}

function EventIcon({ kind }: { kind: BoardEventCountdown["kind"] }) {
  if (kind === "collapse") {
    return <ChevronsLeftRight aria-hidden="true" />;
  }

  return <ArrowDown aria-hidden="true" />;
}

export function BoardEventStrip({ state }: { state: GameState }) {
  const events = getBoardEventCountdowns(state, state.config);
  if (events.length === 0) return null;

  return (
    <aside className="board-event-strip" aria-label={t("board.events.label")}>
      {events.map((event) => (
        <div
          key={event.kind}
          className={`board-event-chip board-event-chip--${event.kind}`}
          aria-label={getEventText(event)}
          title={getEventText(event)}
        >
          <span className="board-event-icon"><EventIcon kind={event.kind} /></span>
          <span>{getVisibleEventText(event)}</span>
        </div>
      ))}
    </aside>
  );
}

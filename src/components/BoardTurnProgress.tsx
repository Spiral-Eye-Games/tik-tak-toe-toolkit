import { getMatchProgress } from "../game/matchProgress";
import type { GameState } from "../game/types";
import { t } from "../i18n";

interface ProgressBulletProps {
  kind: "rounds" | "turns";
  label: string;
  count: number;
}

function ProgressBullet({ kind, label, count }: ProgressBulletProps) {
  return (
    <div
      className={`board-turn-progress__bullet board-turn-progress__bullet--${kind}`}
      aria-label={t("board.timeline.progressItemAria", { label, count })}
    >
      <span className="board-turn-progress__dot" aria-hidden />
      <span className="board-turn-progress__meta">
        <span className="board-turn-progress__label">{label}</span>
        <span className="board-turn-progress__value">{count}</span>
      </span>
    </div>
  );
}

export function BoardTurnProgress({ state }: { state: GameState }) {
  const { turnsCompleted, roundsCompleted } = getMatchProgress(state);

  return (
    <div className="board-turn-progress" role="group" aria-label={t("board.timeline.progressAria")}>
      <ProgressBullet kind="rounds" label={t("board.timeline.roundLabel")} count={roundsCompleted} />
      <ProgressBullet kind="turns" label={t("board.timeline.turnLabel")} count={turnsCompleted} />
    </div>
  );
}

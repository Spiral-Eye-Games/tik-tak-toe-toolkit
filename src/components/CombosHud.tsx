import { getPlayerLabel } from "../game/formatters";
import type { GameState } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

/** Marcador vivo modo Combos (puntos, ronda y acciones restantes). */
export function CombosHud({ state }: { state: GameState }) {
  if (state.config.lineRule !== "combos" || state.gameOver) return null;

  const snapshot = state;
  const cfg = state.config;
  const endPhrase =
    cfg.combosEndMode === "maxRounds"
      ? t("combos.hud.roundsCap", { max: cfg.combosEndValue })
      : t("combos.hud.targetScore", { target: cfg.combosEndValue });

  return (
    <div className="combos-hud" role="region" aria-label={t("combos.hud.aria")}>
      <div className="combos-hud-title">{t("combos.hud.title")}</div>
      <div className="combos-hud-meta">
        <span>{t("combos.hud.roundsProgress", { count: snapshot.fullRoundsCompleted })}</span>
        <span className="combos-hud-meta-sep" aria-hidden>
          ·
        </span>
        <span>{endPhrase}</span>
        <span className="combos-hud-meta-sep" aria-hidden>
          ·
        </span>
        <span>{t("combos.hud.actionsLeft", { count: snapshot.combosActionsRemainingThisTurn })}</span>
      </div>
      <ul className="combos-hud-scores">
        {snapshot.activePlayerIds.map((id) => (
          <li key={id} className="combos-hud-score-row">
            <PlayerMarkSpan config={cfg} playerId={id} className="player-mark-glyph player-mark-glyph--compact" />
            <span className="combos-hud-score-label">{getPlayerLabel(cfg, id)}</span>
            <span className="combos-hud-score-value">{snapshot.combosScores[id] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

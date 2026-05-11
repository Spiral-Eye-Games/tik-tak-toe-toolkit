import { getPlayerLabel, victoryModalShowsRanking } from "../game/formatters";
import type { GameState } from "../game/types";
import { t } from "../i18n";

interface VictoryModalProps {
  state: GameState;
  onNewGame: () => void;
  onUndo: () => void;
}

export function VictoryModal({ state, onNewGame, onUndo }: VictoryModalProps) {
  if (!state.gameOver || !state.gameEndSummary) return null;

  const summary = state.gameEndSummary;
  const config = state.config;

  const showFullRanking =
    summary.type === "ranking" && victoryModalShowsRanking(config, summary);

  const title =
    summary.type === "draw"
      ? t("victory.titleDraw")
      : summary.type === "ranking"
        ? t("victory.titleRanking")
        : summary.type === "winner" && summary.loserId !== undefined
          ? t("victory.titleOutcome")
          : t("victory.titleWinner");

  return (
    <div className="victory-board-overlay" aria-hidden={false}>
      <section className="victory-board-panel" role="dialog" aria-modal="true" aria-labelledby="victoryTitle">
        <header className="victory-board-header">
          <h2 className="victory-board-title" id="victoryTitle">{title}</h2>
        </header>
        <div className="victory-board-body">
          {summary.type === "draw" && (
            <p className="victory-message">{t("victory.drawMessage")}</p>
          )}

          {summary.type === "winner" && (
            <div className="victory-champion">
              <div className="victory-emoji-row">
                <span className="victory-emoji" aria-hidden>{getPlayerLabel(config, summary.winnerId)}</span>
                {summary.loserId !== undefined && (
                  <span className="victory-emoji" aria-hidden>{getPlayerLabel(config, summary.loserId)}</span>
                )}
              </div>
              <p className="victory-message">{t("victory.winnerLine", { player: getPlayerLabel(config, summary.winnerId) })}</p>
              {summary.loserId !== undefined && (
                <p className="victory-message victory-message-secondary">{t("victory.loserLine", { player: getPlayerLabel(config, summary.loserId) })}</p>
              )}
            </div>
          )}

          {summary.type === "ranking" && showFullRanking && (
            <div className="victory-ranking">
              {summary.orderedIds.map((id, index) => (
                <div key={id} className="victory-ranking-row">
                  <span className="victory-rank-num">{t("victory.rankLabel", { place: index + 1 })}</span>
                  <span className="victory-rank-emoji" aria-hidden>{getPlayerLabel(config, id)}</span>
                </div>
              ))}
            </div>
          )}

          {summary.type === "ranking" && !showFullRanking && summary.orderedIds.length > 0 && (
            <div className="victory-champion">
              <span className="victory-emoji" aria-hidden>{getPlayerLabel(config, summary.orderedIds[0])}</span>
              <p className="victory-message">{t("victory.winnerLine", { player: getPlayerLabel(config, summary.orderedIds[0]) })}</p>
            </div>
          )}
        </div>
        <footer className="victory-board-actions">
          <button className="button full" type="button" onClick={onNewGame}>{t("buttons.newGame")}</button>
          <button
            className="button full secondary"
            type="button"
            disabled={state.undoStack.length === 0}
            onClick={onUndo}
          >
            {t("actions.undo")}
          </button>
        </footer>
      </section>
    </div>
  );
}

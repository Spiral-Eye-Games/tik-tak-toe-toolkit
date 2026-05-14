import {
  getVictoryModalPlayerDisplayName,
  victoryModalShowsRanking,
  type VictoryOnlineNameContext
} from "../game/formatters";
import type { GameState, PlayerId } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

interface VictoryModalProps {
  state: GameState;
  onNewGame: () => void;
  onUndo: () => void;
  newGameDisabled?: boolean;
  undoDisabled?: boolean;
  /** Si hay partida online, nicknames por ficha; si no, nombres de figura en el texto del modal. */
  onlineNameContext?: VictoryOnlineNameContext | null;
}

export function VictoryModal({
  state,
  onNewGame,
  onUndo,
  newGameDisabled = false,
  undoDisabled = false,
  onlineNameContext = null
}: VictoryModalProps) {
  if (!state.gameOver || !state.gameEndSummary) return null;

  const summary = state.gameEndSummary;
  const config = state.config;

  const nameFor = (id: PlayerId) => getVictoryModalPlayerDisplayName(id, onlineNameContext);

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
                <PlayerMarkSpan config={config} playerId={summary.winnerId} className="victory-emoji" />
                {summary.loserId !== undefined && (
                  <PlayerMarkSpan config={config} playerId={summary.loserId} className="victory-emoji" />
                )}
              </div>
              <p className="victory-message">{t("victory.winnerLine", { player: nameFor(summary.winnerId) })}</p>
              {summary.loserId !== undefined && (
                <p className="victory-message victory-message-secondary">{t("victory.loserLine", { player: nameFor(summary.loserId) })}</p>
              )}
            </div>
          )}

          {summary.type === "ranking" && showFullRanking && (
            <div className="victory-ranking">
              {summary.orderedIds.map((id, index) => (
                <div key={id} className="victory-ranking-row">
                  <span className="victory-rank-num">{t("victory.rankLabel", { place: index + 1 })}</span>
                  <PlayerMarkSpan config={config} playerId={id} className="victory-rank-emoji" />
                  <span className="victory-rank-name">{nameFor(id)}</span>
                </div>
              ))}
            </div>
          )}

          {summary.type === "ranking" && !showFullRanking && summary.orderedIds.length > 0 && (
            <div className="victory-champion">
              <PlayerMarkSpan config={config} playerId={summary.orderedIds[0]} className="victory-emoji" />
              <p className="victory-message">{t("victory.winnerLine", { player: nameFor(summary.orderedIds[0]) })}</p>
            </div>
          )}
        </div>
        <footer className="victory-board-actions">
          <button className="button full" type="button" disabled={newGameDisabled} onClick={onNewGame}>{t("buttons.newGame")}</button>
          <button
            className="button full secondary"
            type="button"
            disabled={undoDisabled || state.undoStack.length === 0}
            onClick={onUndo}
          >
            {t("actions.undo")}
          </button>
        </footer>
      </section>
    </div>
  );
}

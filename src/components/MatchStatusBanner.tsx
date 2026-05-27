import type { ReactNode } from "react";
import { findPiecePosition, getPieceOrder, getStatusText } from "../game/formatters";
import type { GameConfig, GameSnapshot, GameState, PlayerId } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

type MustMoveFn = (snapshot: GameSnapshot, config: GameConfig) => boolean;

function renderGameOverBanner(state: GameState): ReactNode {
  const summary = state.gameEndSummary;
  const cfg = state.config;
  if (!summary) return null;

  if (summary.type === "draw") {
    return t("gameOver.draw");
  }

  if (summary.type === "winner") {
    if (summary.endKind === "clock_bank" && summary.loserId !== undefined && summary.winnerId) {
      return (
        <>
          <PlayerMarkSpan config={cfg} playerId={summary.loserId} />
          {t("gameOver.clockMid")}
          {t("gameOver.clockWinBeforeMark")}
          <PlayerMarkSpan config={cfg} playerId={summary.winnerId} />
          {t("gameOver.clockWinAfterMark")}
        </>
      );
    }

    if (summary.endKind === "collapse" && summary.loserId !== undefined && summary.winnerId) {
      return (
        <>
          <PlayerMarkSpan config={cfg} playerId={summary.loserId} />
          {t("gameOver.collapseMid")}
          {t("gameOver.clockWinBeforeMark")}
          <PlayerMarkSpan config={cfg} playerId={summary.winnerId} />
          {t("gameOver.clockWinAfterMark")}
        </>
      );
    }

    if (cfg.lineRule === "win") {
      return (
        <>
          <PlayerMarkSpan config={cfg} playerId={summary.winnerId} />
          {t("gameOver.winAfterMark", { lineLength: cfg.lineLength })}
        </>
      );
    }
    if (cfg.lineRule === "combos") {
      return (
        <>
          <PlayerMarkSpan config={cfg} playerId={summary.winnerId} />
          {t("gameOver.combosSimpleWin")}
        </>
      );
    }
    const loseId: PlayerId = summary.loserId ?? summary.winnerId;
    return (
      <>
        <PlayerMarkSpan config={cfg} playerId={loseId} />
        {t("gameOver.loseAfterMark", { lineLength: cfg.lineLength })}
      </>
    );
  }

  if (summary.type === "ranking") {
    return (
      <>
        <span className="match-status-ranking-line">{t("gameOver.rankingComplete")}</span>
        {summary.orderedIds.length > 0 && (
          <span className="match-status-ranking-marks" aria-hidden={false}>
            {summary.orderedIds.map((id, index) => (
              <span key={id} className="match-status-ranking-chip">
                <span className="match-status-ranking-place">{t("victory.rankLabel", { place: index + 1 })}</span>
                <PlayerMarkSpan config={cfg} playerId={id} className="player-mark-glyph player-mark-glyph--compact" />
              </span>
            ))}
          </span>
        )}
      </>
    );
  }

  return null;
}

function renderMidGameBanner(state: GameState, mustMove: MustMoveFn): ReactNode {
  const snapshot = state;
  const cfg = state.config;

  if (snapshot.pendingGravityRotationTarget !== null && cfg.gravityEnabled && cfg.gravityRotateEnabled) {
    return t("status.gravityRotationPause");
  }

  const currentId = snapshot.currentPlayer;

  if (snapshot.selectedPieceId !== null) {
    const selectedPosition = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
    const selectedPiece = selectedPosition ? snapshot.board[selectedPosition.row][selectedPosition.col].piece : null;
    const order = selectedPiece ? getPieceOrder(snapshot, selectedPiece) : "?";
    return (
      <>
        {t("status.movingLead")}
        <PlayerMarkSpan config={cfg} playerId={currentId} />
        {t("status.movingAfterMark", { order })}
      </>
    );
  }

  if (mustMove(snapshot, cfg)) {
    if (cfg.pieceMoveMode === "forcedOldest") {
      return (
        <>
          {t("status.turnLead")}
          <PlayerMarkSpan config={cfg} playerId={currentId} />
          {t("status.turnForcedFirstSuffix")}
        </>
      );
    }
    return (
      <>
        {t("status.turnLead")}
        <PlayerMarkSpan config={cfg} playerId={currentId} />
        {t("status.turnMustMoveSuffix")}
      </>
    );
  }

  return (
    <>
      {t("status.turnLead")}
      <PlayerMarkSpan config={cfg} playerId={currentId} />
      {t("status.turnPlainSuffix")}
    </>
  );
}

/** Texto equivalente al banner (p. ej. `aria-label`, lectores de pantalla). */
export function getMatchStatusAriaText(state: GameState, mustMove: MustMoveFn): string {
  return getStatusText(state, state.config, mustMove);
}

interface MatchStatusBannerProps {
  state: GameState;
  mustMove: MustMoveFn;
  /** Si true, en fin de ranking se omiten las fichas en línea (útil en pastilla estrecha). */
  compactRanking?: boolean;
}

export function MatchStatusBanner({ state, mustMove, compactRanking }: MatchStatusBannerProps) {
  if (state.statusMessage && !state.gameOver) {
    return <>{state.statusMessage}</>;
  }

  if (state.gameOver && state.gameEndSummary) {
    if (compactRanking && state.gameEndSummary.type === "ranking") {
      return <>{t("gameOver.rankingComplete")}</>;
    }
    const ranking = state.gameEndSummary.type === "ranking";
    return (
      <span
        className={
          ranking
            ? "match-status-banner match-status-banner--gameover match-status-banner--ranking"
            : "match-status-banner match-status-banner--gameover"
        }
      >
        {renderGameOverBanner(state)}
      </span>
    );
  }

  if (state.statusMessage) {
    return <>{state.statusMessage}</>;
  }

  return <span className="match-status-banner match-status-banner--playing">{renderMidGameBanner(state, mustMove)}</span>;
}

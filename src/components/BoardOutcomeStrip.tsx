import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatClockSecondsForDisplay, getBankRemainingSecondsForPlayer, isClockEnabled } from "../game/clock";
import { getPlayerLabel } from "../game/formatters";
import { buildOutcomeStripRows } from "../game/outcomeStripRanking";
import type { GameState } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkSpan } from "./PlayerMarkSpan";

export function BoardOutcomeStrip({ state }: { state: GameState }) {
  const rows = buildOutcomeStripRows(state);
  const multi = state.config.playerCount > 2;
  const showBankChips =
    multi &&
    isClockEnabled(state.config) &&
    state.config.clockMode === "bank" &&
    state.clockBankRemaining !== null;

  const [clockPulse, setClockPulse] = useState(0);
  useEffect(() => {
    if (!showBankChips || state.gameOver) return;
    const id = window.setInterval(() => {
      setClockPulse((value) => value + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [showBankChips, state.gameOver, state.clockTurnStartedAtMs, state.config.clockEnabled, state.config.clockMode]);

  void clockPulse;
  const nowMs = Date.now();

  if (rows.length === 0) return null;

  return (
    <aside
      className={`board-outcome-strip${multi ? " board-outcome-strip--wide" : ""}`}
      aria-label={t("board.outcomeStripLabel")}
    >
      {rows.map((row, index) => {
        const label = getPlayerLabel(state.config, row.playerId);
        const titleBase =
          row.kind === "eliminated"
            ? t("board.outcomeEliminated", { player: label })
            : row.kind === "round_won"
              ? t("board.outcomeRoundWin", { player: label })
              : label;

        const placeText =
          row.place.type === "none"
            ? null
            : row.place.type === "final"
              ? t("victory.rankLabel", { place: row.place.rank })
              : row.place.type === "draw"
                ? t("board.outcomeStandingDraw")
                : t("board.outcomeStandingNumber", { n: String(row.place.value) });

        const bankSecs = showBankChips ? getBankRemainingSecondsForPlayer(state, state.config, row.playerId, nowMs) : null;
        const bankText = bankSecs !== null ? formatClockSecondsForDisplay(bankSecs) : null;

        const title = [titleBase, placeText, bankText].filter(Boolean).join(" · ");

        const ariaParts = [titleBase];
        if (placeText) ariaParts.push(placeText);
        if (bankText) ariaParts.push(t("board.outcomeAriaBank", { time: bankText }));

        return (
          <div key={`${row.playerId}-${index}`} className="board-outcome-row">
            {bankText !== null && (
              <span className="board-outcome-bank-chip" title={t("board.outcomeBankChipTitle", { time: bankText })}>
                <Clock className="board-outcome-bank-icon" aria-hidden size={14} strokeWidth={2.25} />
                <span className="board-outcome-bank-time">{bankText}</span>
              </span>
            )}
            <div
              className={`board-outcome-chip board-outcome-chip--${row.kind}`}
              title={title}
              role="group"
              aria-label={ariaParts.join(". ")}
            >
              <PlayerMarkSpan config={state.config} playerId={row.playerId} className="board-outcome-emoji" />
              {placeText !== null && <span className="board-outcome-place">{placeText}</span>}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

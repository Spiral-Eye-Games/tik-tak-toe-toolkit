import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { getBoardTurnTimeline } from "../game/boardTurnTimeline";
import type { VictoryOnlineNameContext } from "../game/formatters";
import { canSurrender } from "../game/surrender";
import { isSkipTurnUnavailable, skipTurnRemainderTicks } from "../game/skipTurnLock";
import type { GameState } from "../game/types";
import { t } from "../i18n";
import { BoardEventStrip } from "./BoardEventStrip";
import { BoardOutcomeStrip } from "./BoardOutcomeStrip";
import { BoardSkipTurnFab } from "./BoardSkipTurnFab";
import { BoardSurrenderConfirmModal } from "./BoardSurrenderConfirmModal";
import { BoardSurrenderFab } from "./BoardSurrenderFab";
import { BoardUndoRedoRow } from "./BoardUndoRedoRow";
import { Cell } from "./Cell";
import { VictoryModal } from "./VictoryModal";

interface BoardProps {
  state: GameState;
  onPlayMove: (row: number, col: number) => void;
  onVictoryNewGame: () => void;
  onVictoryUndo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  interactionLocked?: boolean;
  victoryNewGameDisabled?: boolean;
  victoryUndoDisabled?: boolean;
  skipTurnInteractive?: boolean;
  onSkipTurn?: () => void;
  surrenderInteractive?: boolean;
  onSurrender?: () => void;
  victoryOnlineNameContext?: VictoryOnlineNameContext | null;
}

export function Board({
  state,
  onPlayMove,
  onVictoryNewGame,
  onVictoryUndo,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  interactionLocked = false,
  victoryNewGameDisabled = false,
  victoryUndoDisabled = false,
  skipTurnInteractive = false,
  onSkipTurn,
  surrenderInteractive = false,
  onSurrender,
  victoryOnlineNameContext = null
}: BoardProps) {
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false);
  const boardMaxAxis = Math.max(state.config.columns, state.config.rows);
  const turnTimeline = getBoardTurnTimeline(state, state.config);
  const showSkipFab =
    Boolean(onSkipTurn) && !state.gameOver && state.pendingGravityRotationTarget === null;
  const skipTurnLocked = isSkipTurnUnavailable(state);
  const skipTurnRemainder = skipTurnRemainderTicks(state);
  let skipTurnTooltip = t("board.skipTurn.tooltip");
  if (!skipTurnInteractive) {
    skipTurnTooltip = t("board.skipTurn.tooltipNotYourTurn");
  } else if (skipTurnLocked) {
    skipTurnTooltip =
      state.config.skipTurnBlockMode === "infinite"
        ? t("board.skipTurn.tooltipLockedInfinite")
        : t("board.skipTurn.tooltipLockedCooldown", { n: skipTurnRemainder });
  }
  const showSurrenderFab =
    Boolean(onSurrender) && !state.gameOver && state.pendingGravityRotationTarget === null;
  const showTimeline = turnTimeline.length > 0;
  const surrenderAllowedByRules = canSurrender(state);
  const surrenderTooltip = surrenderAllowedByRules
    ? t("board.surrender.tooltip")
    : t("board.surrender.tooltipTooEarly");

  useEffect(() => {
    if (state.gameOver) setSurrenderConfirmOpen(false);
  }, [state.gameOver]);

  return (
    <section className="board-section">
      <div className="board-wrap">
        <div className="board-stack">
          <section
            className="board"
            style={{
              gridTemplateColumns: `repeat(${state.config.columns}, 1fr)`,
              gridTemplateRows: `repeat(${state.config.rows}, 1fr)`,
              aspectRatio: `${state.config.columns} / ${state.config.rows}`,
              "--board-columns": state.config.columns,
              "--board-rows": state.config.rows,
              "--board-max-axis": boardMaxAxis
            } as CSSProperties}
          >
            {state.board.map((rowCells, row) =>
              rowCells.map((_cell, col) => (
                <Cell
                  key={`${row}-${col}`}
                  state={state}
                  row={row}
                  col={col}
                  interactionLocked={interactionLocked}
                  onPlayMove={onPlayMove}
                />
              ))
            )}
          </section>

          <div className="board-event-area">
            <div className="board-event-area__left-col">
              {showTimeline && (
                <div className="board-event-area__timeline-clip">
                  <BoardEventStrip
                    state={state}
                    rows={turnTimeline}
                    onlineNameContext={victoryOnlineNameContext}
                  />
                </div>
              )}
              <BoardUndoRedoRow canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
            </div>
            {(showSkipFab || showSurrenderFab) && (
              <div className="board-event-area__fab-col">
                {showSkipFab && onSkipTurn && (
                  <BoardSkipTurnFab
                    disabled={!skipTurnInteractive || skipTurnLocked}
                    tooltip={skipTurnTooltip}
                    onSkipTurn={onSkipTurn}
                  />
                )}
                {showSurrenderFab && onSurrender && (
                  <BoardSurrenderFab
                    disabled={!surrenderInteractive || !surrenderAllowedByRules}
                    tooltip={surrenderTooltip}
                    onOpenConfirm={() => setSurrenderConfirmOpen(true)}
                  />
                )}
              </div>
            )}
          </div>
          <BoardOutcomeStrip state={state} />
        </div>

        <VictoryModal
          state={state}
          onNewGame={onVictoryNewGame}
          onUndo={onVictoryUndo}
          newGameDisabled={victoryNewGameDisabled}
          undoDisabled={victoryUndoDisabled}
          onlineNameContext={victoryOnlineNameContext}
        />

        <BoardSurrenderConfirmModal
          open={surrenderConfirmOpen}
          onClose={() => setSurrenderConfirmOpen(false)}
          onConfirm={() => {
            setSurrenderConfirmOpen(false);
            onSurrender?.();
          }}
        />
      </div>
    </section>
  );
}

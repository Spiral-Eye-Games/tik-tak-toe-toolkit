import type { CSSProperties } from "react";
import { getBoardTurnTimeline } from "../game/boardTurnTimeline";
import type { VictoryOnlineNameContext } from "../game/formatters";
import type { GameState } from "../game/types";
import { BoardEventStrip } from "./BoardEventStrip";
import { BoardOutcomeStrip } from "./BoardOutcomeStrip";
import { BoardSkipTurnFab } from "./BoardSkipTurnFab";
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
  victoryOnlineNameContext = null
}: BoardProps) {
  const boardMaxAxis = Math.max(state.config.columns, state.config.rows);
  const turnTimeline = getBoardTurnTimeline(state, state.config);
  const showSkipFab =
    Boolean(onSkipTurn) &&
    state.config.skipTurnEnabled &&
    !state.gameOver &&
    state.pendingGravityRotationTarget === null;
  const showTimeline = turnTimeline.length > 0;

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
                  <BoardEventStrip state={state} rows={turnTimeline} />
                </div>
              )}
              <BoardUndoRedoRow canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
            </div>
            {showSkipFab && onSkipTurn && (
              <div className="board-event-area__skip-col">
                <BoardSkipTurnFab disabled={!skipTurnInteractive} onSkipTurn={onSkipTurn} />
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
      </div>
    </section>
  );
}

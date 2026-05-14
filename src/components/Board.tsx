import type { CSSProperties } from "react";
import { getBoardEventCountdowns } from "../game/eventCountdowns";
import type { GameState } from "../game/types";
import { BoardEventStrip } from "./BoardEventStrip";
import { BoardOutcomeStrip } from "./BoardOutcomeStrip";
import { BoardSkipTurnFab } from "./BoardSkipTurnFab";
import { Cell } from "./Cell";
import { VictoryModal } from "./VictoryModal";

interface BoardProps {
  state: GameState;
  onPlayMove: (row: number, col: number) => void;
  onVictoryNewGame: () => void;
  onVictoryUndo: () => void;
  interactionLocked?: boolean;
  victoryNewGameDisabled?: boolean;
  victoryUndoDisabled?: boolean;
  skipTurnInteractive?: boolean;
  onSkipTurn?: () => void;
}

export function Board({
  state,
  onPlayMove,
  onVictoryNewGame,
  onVictoryUndo,
  interactionLocked = false,
  victoryNewGameDisabled = false,
  victoryUndoDisabled = false,
  skipTurnInteractive = false,
  onSkipTurn
}: BoardProps) {
  const boardMaxAxis = Math.max(state.config.columns, state.config.rows);
  const upcomingEvents = getBoardEventCountdowns(state, state.config);
  const showSkipFab =
    Boolean(onSkipTurn) &&
    state.config.skipTurnEnabled &&
    !state.gameOver &&
    state.pendingGravityRotationTarget === null;
  const showEventArea = upcomingEvents.length > 0 || showSkipFab;

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

          {showEventArea && (
            <div className="board-event-area">
              <BoardEventStrip state={state} />
              {showSkipFab && onSkipTurn && (
                <BoardSkipTurnFab disabled={!skipTurnInteractive} onSkipTurn={onSkipTurn} />
              )}
            </div>
          )}
          <BoardOutcomeStrip state={state} />
        </div>

        <VictoryModal
          state={state}
          onNewGame={onVictoryNewGame}
          onUndo={onVictoryUndo}
          newGameDisabled={victoryNewGameDisabled}
          undoDisabled={victoryUndoDisabled}
        />
      </div>
    </section>
  );
}

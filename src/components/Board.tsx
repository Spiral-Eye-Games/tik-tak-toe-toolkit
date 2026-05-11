import type { CSSProperties } from "react";
import type { GameState } from "../game/types";
import { BoardOutcomeStrip } from "./BoardOutcomeStrip";
import { Cell } from "./Cell";
import { VictoryModal } from "./VictoryModal";

interface BoardProps {
  state: GameState;
  onPlayMove: (row: number, col: number) => void;
  onVictoryNewGame: () => void;
  onVictoryUndo: () => void;
}

export function Board({ state, onPlayMove, onVictoryNewGame, onVictoryUndo }: BoardProps) {
  const boardMaxAxis = Math.max(state.config.columns, state.config.rows);

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
                <Cell key={`${row}-${col}`} state={state} row={row} col={col} onPlayMove={onPlayMove} />
              ))
            )}
          </section>

          <BoardOutcomeStrip state={state} />

          <VictoryModal
            state={state}
            onNewGame={onVictoryNewGame}
            onUndo={onVictoryUndo}
          />
        </div>
      </div>
    </section>
  );
}

import type { CSSProperties } from "react";
import type { GameState } from "../game/types";
import { Cell } from "./Cell";

interface BoardProps {
  state: GameState;
  onPlayMove: (row: number, col: number) => void;
}

export function Board({ state, onPlayMove }: BoardProps) {
  const boardMaxAxis = Math.max(state.config.columns, state.config.rows);

  return (
    <section className="board-section">
      <div className="board-wrap">
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
      </div>
    </section>
  );
}

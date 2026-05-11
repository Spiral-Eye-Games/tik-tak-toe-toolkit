import { PERMANENT_BROKEN_LABEL } from "../game/defaults";
import { getColumnLetter, getPieceOrder } from "../game/formatters";
import { canSelectPiece, getGravityTargetRow, isBroken, isCellClickable, isLegalMoveDestination } from "../game/rules";
import type { GameState, Piece } from "../game/types";

interface CellProps {
  state: GameState;
  row: number;
  col: number;
  onPlayMove: (row: number, col: number) => void;
}

export function Cell({ state, row, col, onPlayMove }: CellProps) {
  const cell = state.board[row][col];
  const piece = cell.piece;
  const coordinate = `${getColumnLetter(col)}${row + 1}`;
  const clickable = isCellClickable(state, state.config, row, col);
  const gravityTarget = state.config.gravityEnabled && !state.gameOver && getGravityTargetRow(state.board, state.config, col) === row;

  const classNames = ["cell"];
  if (piece?.owner === "X") classNames.push("occupied-x");
  if (piece?.owner === "O") classNames.push("occupied-o");
  if (piece?.id === state.selectedPieceId) classNames.push("selected");
  if (canSelectPiece(state, state.config, piece)) classNames.push("movable");
  if (state.selectedPieceId !== null && isLegalMoveDestination(state, state.config, row, col)) classNames.push("move-target");
  if (isBroken(cell)) classNames.push("broken");
  if (state.lineCells.some((position) => position.row === row && position.col === col)) classNames.push("losing");

  return (
    <button
      className={classNames.join(" ")}
      type="button"
      disabled={!clickable}
      data-broken-label={isBroken(cell) ? getBrokenLabel(cell.brokenTurns) : undefined}
      onClick={() => onPlayMove(row, col)}
    >
      <span className="coord-label">{coordinate}</span>
      {gravityTarget && <span className="gravity-arrow">↓</span>}
      {piece && <PieceView state={state} piece={piece} />}
    </button>
  );
}

function PieceView({ state, piece }: { state: GameState; piece: Piece }) {
  const ownerClass = piece.owner.toLowerCase();

  return (
    <span className={`piece ${ownerClass}`}>
      <span className="piece-mark">{piece.owner}</span>
      <span className="piece-order">{getPieceOrder(state, piece)}</span>
    </span>
  );
}

function getBrokenLabel(brokenTurns: number | null): string {
  if (brokenTurns === 0) return PERMANENT_BROKEN_LABEL;
  return String(brokenTurns ?? "");
}

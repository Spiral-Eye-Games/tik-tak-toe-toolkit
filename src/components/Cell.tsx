import { getColumnLetter, getPieceOrder, getPlayerLabel } from "../game/formatters";
import { canSelectPiece, getGravityTargetRow, isBroken, isCellClickable, isLegalMoveDestination } from "../game/rules";
import type { GameState, Piece } from "../game/types";
import { t } from "../i18n";

type PieceOutKind = "lose" | "win" | null;

function getPieceOutKind(state: GameState, piece: Piece | null): PieceOutKind {
  if (!piece) return null;
  if (state.config.lineRule === "lose" && state.eliminationOrderLose.includes(piece.owner)) {
    return "lose";
  }
  if (
    state.config.lineRule === "win" &&
    state.config.continueRanking &&
    state.placementOrderWin.includes(piece.owner) &&
    !state.activePlayerIds.includes(piece.owner)
  ) {
    return "win";
  }
  return null;
}

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

  const pieceOutKind = getPieceOutKind(state, piece);

  const classNames = ["cell"];
  if (piece) classNames.push("occupied-piece");
  if (pieceOutKind === "lose") classNames.push("cell-eliminated-lose");
  if (pieceOutKind === "win") classNames.push("cell-eliminated-win");
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
      {piece && <PieceView state={state} piece={piece} outKind={pieceOutKind} />}
    </button>
  );
}

function PieceView({ state, piece, outKind }: { state: GameState; piece: Piece; outKind: PieceOutKind }) {
  const mark = getPlayerLabel(state.config, piece.owner);
  const pieceExtra =
    outKind === "lose"
      ? " piece-eliminated-lose"
      : outKind === "win"
        ? " piece-eliminated-win"
        : "";

  return (
    <span className={`piece emoji-piece${pieceExtra}`}>
      <span className="piece-mark">{mark}</span>
      <span className="piece-order">{getPieceOrder(state, piece)}</span>
    </span>
  );
}

function getBrokenLabel(brokenTurns: number | null): string {
  if (brokenTurns === 0) return t("broken.permanent");
  return String(brokenTurns ?? "");
}

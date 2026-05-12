import { isNextCollapsePosition } from "../game/collapse";
import { getColumnLetter, getGravityArrowSymbol, getPieceOrder, getPlayerMark } from "../game/formatters";
import {
  canAddPiece,
  canSelectPiece,
  isBroken,
  isCellClickable,
  isGravityLandingCell,
  isGravityPlacementClick,
  isLegalMoveDestination
} from "../game/rules";
import { isStartPlacementRestricted } from "../game/restrictions";
import type { GameState, Piece } from "../game/types";
import { t } from "../i18n";
import { PlayerMarkGlyph } from "./PlayerMarkSpan";

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
  const gravityLanding =
    state.config.gravityEnabled &&
    !state.gameOver &&
    isGravityLandingCell(state, state.config, state.gravityDirection, row, col);
  const gravityLineHint =
    state.config.gravityEnabled &&
    !state.gameOver &&
    state.selectedPieceId === null &&
    canAddPiece(state, state.config, state.currentPlayer) &&
    isGravityPlacementClick(state, state.config, state.gravityDirection, row, col) &&
    !gravityLanding;

  const pieceOutKind = getPieceOutKind(state, piece);
  const collapseNext = !isBroken(cell) && isNextCollapsePosition(state, state.config, row, col);
  const startRestricted = !piece && isStartPlacementRestricted(state, state.config, row, col);

  const classNames = ["cell"];
  if (piece) classNames.push("occupied-piece");
  if (pieceOutKind === "lose") classNames.push("cell-eliminated-lose");
  if (pieceOutKind === "win") classNames.push("cell-eliminated-win");
  if (piece?.id === state.selectedPieceId) classNames.push("selected");
  if (canSelectPiece(state, state.config, piece)) classNames.push("movable");
  if (state.selectedPieceId !== null && isLegalMoveDestination(state, state.config, row, col)) classNames.push("move-target");
  if (isBroken(cell)) classNames.push("broken");
  if (startRestricted) classNames.push("start-restricted");
  if (collapseNext) classNames.push("collapse-next");
  if (state.lineCells.some((position) => position.row === row && position.col === col)) {
    classNames.push(state.config.lineRule === "win" ? "winning-line" : "losing");
  }

  return (
    <button
      className={classNames.join(" ")}
      type="button"
      disabled={!clickable}
      data-broken-label={isBroken(cell) ? getBrokenLabel(cell.brokenTurns) : undefined}
      data-restricted-label={startRestricted ? t("restrictions.startBlockedCell") : undefined}
      onClick={() => onPlayMove(row, col)}
    >
      <span className="coord-label">{coordinate}</span>
      {gravityLanding && (
        <span className={`gravity-arrow gravity-arrow--${state.gravityDirection}`}>{getGravityArrowSymbol(state.gravityDirection)}</span>
      )}
      {gravityLineHint && (
        <span className={`gravity-arrow gravity-arrow--hint gravity-arrow--${state.gravityDirection}`}>
          {getGravityArrowSymbol(state.gravityDirection)}
        </span>
      )}
      {piece && <PieceView state={state} piece={piece} outKind={pieceOutKind} />}
    </button>
  );
}

function PieceView({ state, piece, outKind }: { state: GameState; piece: Piece; outKind: PieceOutKind }) {
  const mark = getPlayerMark(state.config, piece.owner);
  const pieceExtra =
    outKind === "lose"
      ? " piece-eliminated-lose"
      : outKind === "win"
        ? " piece-eliminated-win"
        : "";

  return (
    <span className={`piece player-piece${pieceExtra}`} style={{ color: mark.color }}>
      <PlayerMarkGlyph playerId={piece.owner} symbol={mark.symbol} className="piece-mark" />
      <span className="piece-order">{getPieceOrder(state, piece)}</span>
    </span>
  );
}

function getBrokenLabel(brokenTurns: number | null): string {
  if (brokenTurns === 0) return t("broken.permanent");
  return String(brokenTurns ?? "");
}

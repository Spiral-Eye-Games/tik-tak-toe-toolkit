import { getResolvedBrokenHoleTurns, getResolvedGravityRotateInterval } from "./config";
import { t } from "../i18n";
import type { Board, GameConfig, GameEndSummary, GameSnapshot, GravityDirection, Piece, PlayerId } from "./types";

export function getGravityArrowSymbol(direction: GravityDirection): string {
  switch (direction) {
    case "down":
      return t("ui.gravityArrows.down");
    case "up":
      return t("ui.gravityArrows.up");
    case "left":
      return t("ui.gravityArrows.left");
    case "right":
      return t("ui.gravityArrows.right");
    default:
      return t("ui.gravityArrows.down");
  }
}

export function getPlayerLabel(config: GameConfig, id: PlayerId): string {
  const found = config.roster.find((player) => player.id === id);
  return found?.emoji ?? id;
}

export function getColumnLetter(col: number): string {
  let label = "";
  let n = col;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function getPieceOrder(snapshot: GameSnapshot, piece: Piece): string {
  const history = snapshot.pieceHistory[piece.owner];
  const index = history ? history.indexOf(piece.id) : -1;
  return index >= 0 ? String(index + 1) : "?";
}

export function getPieceMoveModeText(config: GameConfig): string {
  switch (config.pieceMoveMode) {
    case "forcedOldest": return t("rules.moveModeText.forcedOldest");
    case "limitMoveAny": return t("rules.moveModeText.limitMoveAny");
    case "limitedFree": return t("rules.moveModeText.limitedFree");
    case "blocked": return t("rules.moveModeText.blocked");
    case "free": return t("rules.moveModeText.free");
    default: return t("rules.moveModeText.unknown");
  }
}

export function buildRulesText(config: GameConfig): string {
  const lineText = config.lineRule === "lose" ? t("rules.lineRule.lose") : t("rules.lineRule.win");

  const piecesText = config.pieceLimitType === "unlimited"
    ? t("rules.pieces.unlimited")
    : t("rules.pieces.limited", { maxPieces: config.maxPiecesPerPlayer });

  const moveText = getPieceMoveModeText(config);

  const resolvedBrokenTurns = getResolvedBrokenHoleTurns(config);
  const brokenText = !config.brokenEnabled
    ? t("rules.broken.disabled")
    : resolvedBrokenTurns === 0
      ? t("rules.broken.untilEnd")
      : t("rules.broken.forTurns", { turns: resolvedBrokenTurns });

  const gravityText = !config.gravityEnabled
    ? t("rules.gravity.disabled")
    : config.gravityRotateEnabled
      ? t("rules.gravity.enabledWithRotation", {
        direction: t(`rules.gravity.direction.${config.gravityInitialDirection}`),
        interval: getResolvedGravityRotateInterval(config),
        angle: t(`rules.gravity.rotateAngle.${config.gravityRotateAngle}`),
        spin: t(`rules.gravity.rotateSpin.${config.gravityRotateSpin}`)
      })
      : t("rules.gravity.enabledDirected", {
        direction: t(`rules.gravity.direction.${config.gravityInitialDirection}`)
      });

  return t("rules.summary", {
    columns: config.columns,
    rows: config.rows,
    lineText,
    lineLength: config.lineLength,
    piecesText,
    moveText,
    brokenText,
    gravityText
  });
}

export function getStatusText(snapshot: GameSnapshot, config: GameConfig, mustMovePiece: (snapshot: GameSnapshot, config: GameConfig) => boolean): string {
  if (snapshot.statusMessage) return snapshot.statusMessage;

  if (snapshot.pendingGravityRotationTarget !== null && config.gravityEnabled && config.gravityRotateEnabled) {
    return t("status.gravityRotationPause");
  }

  const currentLabel = getPlayerLabel(config, snapshot.currentPlayer);

  if (snapshot.selectedPieceId !== null) {
    const selectedPosition = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
    const selectedPiece = selectedPosition ? snapshot.board[selectedPosition.row][selectedPosition.col].piece : null;
    const order = selectedPiece ? getPieceOrder(snapshot, selectedPiece) : "?";

    return t("status.moving", {
      currentPlayer: currentLabel,
      order
    });
  }

  if (mustMovePiece(snapshot, config)) {
    if (config.pieceMoveMode === "forcedOldest") {
      return t("status.turnForcedFirst", { currentPlayer: currentLabel });
    }
    return t("status.turnMustMove", { currentPlayer: currentLabel });
  }

  return t("status.turn", { currentPlayer: currentLabel });
}

export function findPiecePosition(board: Board, pieceId: number): { row: number; col: number } | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].piece?.id === pieceId) return { row, col };
    }
  }
  return null;
}

export function victoryModalShowsRanking(config: GameConfig, summary: GameEndSummary): boolean {
  if (summary.type !== "ranking" || summary.orderedIds.length <= 1) return false;
  if (config.lineRule === "lose") {
    return config.playerCount > 2;
  }
  return config.continueRanking;
}

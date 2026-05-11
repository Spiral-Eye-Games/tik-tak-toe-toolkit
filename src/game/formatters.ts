import type { Board, GameConfig, GameSnapshot, Piece } from "./types";

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
  const index = snapshot.pieceHistory[piece.owner].indexOf(piece.id);
  return index >= 0 ? String(index + 1) : "?";
}

export function getPieceMoveModeText(config: GameConfig): string {
  switch (config.pieceMoveMode) {
    case "forcedOldest": return "Al llegar al máximo, se mueve la primera ficha colocada";
    case "limitMoveAny": return "Al llegar al máximo, se mueve cualquier ficha propia";
    case "limitedFree": return "Se puede mover cualquier ficha propia en cualquier momento";
    case "blocked": return "Las fichas no se pueden mover";
    case "free": return "Las fichas se pueden mover libremente";
    default: return "Movimiento de fichas sin definir";
  }
}

export function buildRulesText(config: GameConfig): string {
  const lineText = config.lineRule === "lose" ? "Perdés" : "Ganás";
  const piecesText = config.pieceLimitType === "unlimited"
    ? "fichas ilimitadas"
    : `máximo ${config.maxPiecesPerPlayer} fichas por jugador`;
  const moveText = getPieceMoveModeText(config);
  const brokenText = !config.brokenEnabled
    ? "los huecos abandonados no se rompen"
    : config.brokenHoleTurns === 0
      ? "los huecos abandonados se rompen hasta el final"
      : `los huecos abandonados se rompen por ${config.brokenHoleTurns} turnos`;
  const gravityText = config.gravityEnabled ? "gravedad activada" : "gravedad desactivada";

  return `${config.columns} columnas x ${config.rows} filas. ${lineText} si formás ${config.lineLength} en raya. ${piecesText}. ${moveText}. ${brokenText}. ${gravityText}.`;
}

export function getStatusText(snapshot: GameSnapshot, config: GameConfig, mustMovePiece: (snapshot: GameSnapshot, config: GameConfig) => boolean): string {
  if (snapshot.statusMessage) return snapshot.statusMessage;

  if (snapshot.selectedPieceId !== null) {
    const selectedPosition = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
    const selectedPiece = selectedPosition ? snapshot.board[selectedPosition.row][selectedPosition.col].piece : null;
    const order = selectedPiece ? getPieceOrder(snapshot, selectedPiece) : "?";
    return `Moviendo ${snapshot.currentPlayer} #${order}. Elegí destino o tocá la ficha para cancelar.`;
  }

  if (mustMovePiece(snapshot, config)) {
    if (config.pieceMoveMode === "forcedOldest") return `Turno de ${snapshot.currentPlayer}: mové la ficha #1.`;
    return `Turno de ${snapshot.currentPlayer}: mové una ficha.`;
  }

  return `Turno de ${snapshot.currentPlayer}`;
}

export function findPiecePosition(board: Board, pieceId: number): { row: number; col: number } | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].piece?.id === pieceId) return { row, col };
    }
  }
  return null;
}

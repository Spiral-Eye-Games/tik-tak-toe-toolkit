import { DRAW_IF_NO_LEGAL_MOVES } from "./defaults";
import type { Board, BoardCell, BoardPosition, GameConfig, GameSnapshot, Piece, PlayerId } from "./types";

export function createEmptyCell(): BoardCell {
  return { piece: null, brokenTurns: null, brokenCreatedOnTurn: null };
}

export function createBoard(config: GameConfig): Board {
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.columns }, () => createEmptyCell())
  );
}

export function isBroken(cell: BoardCell | null): boolean {
  return cell !== null && cell.brokenTurns !== null;
}

export function canAddPiece(snapshot: GameSnapshot, config: GameConfig, player: PlayerId): boolean {
  if (config.pieceLimitType === "unlimited") return true;
  const history = snapshot.pieceHistory[player];
  if (!history) return true;
  return history.length < config.maxPiecesPerPlayer;
}

export function mustMovePiece(snapshot: GameSnapshot, config: GameConfig): boolean {
  const player = snapshot.currentPlayer;
  if (config.pieceLimitType === "unlimited") return false;
  if (config.pieceMoveMode === "limitedFree") return false;
  const history = snapshot.pieceHistory[player];
  if (!history) return false;
  return history.length >= config.maxPiecesPerPlayer;
}

export function getDefaultSelectedPieceIdForcedOldest(
  snapshot: GameSnapshot,
  config: GameConfig
): number | null {
  if (config.pieceMoveMode !== "forcedOldest") return null;
  if (!mustMovePiece(snapshot, config)) return null;
  const oldestId = snapshot.pieceHistory[snapshot.currentPlayer]?.[0];
  if (oldestId == null) return null;
  if (findPiecePosition(snapshot.board, oldestId) === null) return null;
  return oldestId;
}

export function canSelectPiece(snapshot: GameSnapshot, config: GameConfig, piece: Piece | null): boolean {
  if (!piece || piece.owner !== snapshot.currentPlayer) return false;

  switch (config.pieceMoveMode) {
    case "forcedOldest":
      return mustMovePiece(snapshot, config) && snapshot.pieceHistory[piece.owner]?.[0] === piece.id;
    case "limitMoveAny":
      return mustMovePiece(snapshot, config);
    case "limitedFree":
      return config.pieceLimitType === "limited";
    case "free":
      return config.pieceLimitType === "unlimited";
    default:
      return false;
  }
}

export function isLegalPlacementDestination(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (config.gravityEnabled) {
    return getGravityTargetRow(snapshot.board, config, col) === row;
  }

  const cell = snapshot.board[row][col];
  return cell.piece === null && !isBroken(cell);
}

export function isLegalMoveDestination(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (snapshot.selectedPieceId === null) return false;

  const source = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
  if (!source) return false;

  const targetRow = config.gravityEnabled
    ? getGravityTargetRowIgnoringPiece(snapshot.board, config, col, snapshot.selectedPieceId)
    : row;

  if (targetRow !== row) return false;
  if (source.row === row && source.col === col) return false;

  const targetCell = snapshot.board[row][col];
  const targetHasOtherPiece = targetCell.piece !== null && targetCell.piece.id !== snapshot.selectedPieceId;

  return !targetHasOtherPiece && !isBroken(targetCell);
}

export function isCellClickable(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  if (snapshot.gameOver) return false;

  const cell = snapshot.board[row][col];
  const piece = cell.piece;

  if (canSelectPiece(snapshot, config, piece)) return true;
  if (snapshot.selectedPieceId !== null) return isLegalMoveDestination(snapshot, config, row, col);
  if (!canAddPiece(snapshot, config, snapshot.currentPlayer)) return false;

  return isLegalPlacementDestination(snapshot, config, row, col);
}

export function getGravityTargetRow(board: Board, config: GameConfig, col: number): number | null {
  let lastEmptyRow: number | null = null;

  for (let row = 0; row < config.rows; row++) {
    const cell = board[row][col];
    if (cell.piece !== null || isBroken(cell)) return lastEmptyRow;
    lastEmptyRow = row;
  }

  return lastEmptyRow;
}

export function getGravityTargetRowIgnoringPiece(board: Board, config: GameConfig, col: number, ignoredPieceId: number): number | null {
  let lastEmptyRow: number | null = null;

  for (let row = 0; row < config.rows; row++) {
    const cell = board[row][col];
    const hasBlockingPiece = cell.piece !== null && cell.piece.id !== ignoredPieceId;

    if (hasBlockingPiece || isBroken(cell)) return lastEmptyRow;
    lastEmptyRow = row;
  }

  return lastEmptyRow;
}

export function findPiecePosition(board: Board, pieceId: number): BoardPosition | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].piece?.id === pieceId) return { row, col };
    }
  }
  return null;
}

export function applyGravity(board: Board, config: GameConfig): void {
  for (let col = 0; col < config.columns; col++) {
    let segmentRows: number[] = [];

    for (let row = config.rows - 1; row >= -1; row--) {
      const reachedTop = row === -1;
      const cell = reachedTop ? null : board[row][col];
      const blocked = reachedTop || isBroken(cell);

      if (blocked) {
        settleSegment(board, segmentRows, col);
        segmentRows = [];
      } else {
        segmentRows.push(row);
      }
    }
  }
}

function settleSegment(board: Board, rowsBottomToTop: number[], col: number): void {
  if (rowsBottomToTop.length === 0) return;

  const piecesBottomToTop: Piece[] = [];

  for (const row of rowsBottomToTop) {
    const piece = board[row][col].piece;
    if (piece !== null) piecesBottomToTop.push(piece);
    board[row][col].piece = null;
  }

  for (let i = 0; i < piecesBottomToTop.length; i++) {
    board[rowsBottomToTop[i]][col].piece = piecesBottomToTop[i];
  }
}

export function tickBrokenHoles(board: Board, config: GameConfig, turnNumber: number): void {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = board[row][col];
      if (cell.brokenTurns === null || cell.brokenTurns === 0) continue;
      if (cell.brokenCreatedOnTurn === turnNumber) continue;

      cell.brokenTurns--;
      if (cell.brokenTurns <= 0) {
        cell.brokenTurns = null;
        cell.brokenCreatedOnTurn = null;
      }
    }
  }
}

export function getNextActivePlayer(activePlayerIds: PlayerId[], current: PlayerId): PlayerId {
  if (activePlayerIds.length === 0) return current;
  const index = activePlayerIds.indexOf(current);
  if (index < 0) return activePlayerIds[0];
  return activePlayerIds[(index + 1) % activePlayerIds.length];
}

export function getNextTurnAfterPlayerRemoved(activePlayerIds: PlayerId[], removedId: PlayerId): PlayerId {
  const index = activePlayerIds.indexOf(removedId);
  const n = activePlayerIds.length;
  if (n <= 1) return activePlayerIds[0] ?? removedId;
  for (let step = 1; step < n; step++) {
    const candidate = activePlayerIds[(index + step) % n];
    if (candidate !== removedId) return candidate;
  }
  return activePlayerIds[0];
}

export function abandonCellForBroken(snapshot: GameSnapshot, config: GameConfig, position: BoardPosition): void {
  const cell = snapshot.board[position.row][position.col];
  if (config.brokenEnabled) {
    cell.brokenTurns = config.brokenHoleTurns;
    cell.brokenCreatedOnTurn = snapshot.turnNumber;
  } else {
    cell.brokenTurns = null;
    cell.brokenCreatedOnTurn = null;
  }
}

export function removeAllPiecesForPlayer(snapshot: GameSnapshot, config: GameConfig, playerId: PlayerId): void {
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = snapshot.board[row][col];
      if (cell.piece?.owner === playerId) {
        cell.piece = null;
        abandonCellForBroken(snapshot, config, { row, col });
      }
    }
  }
  snapshot.pieceHistory[playerId] = [];
  if (config.gravityEnabled) applyGravity(snapshot.board, config);
}

export function hasLegalMove(snapshot: GameSnapshot, config: GameConfig): boolean {
  if (config.gravityEnabled) {
    for (let col = 0; col < config.columns; col++) {
      if (getGravityTargetRow(snapshot.board, config, col) !== null) return true;
    }
    return false;
  }

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const cell = snapshot.board[row][col];
      if (cell.piece === null && !isBroken(cell)) return true;
    }
  }

  return false;
}

export function findLine(snapshot: GameSnapshot, config: GameConfig, player: PlayerId): BoardPosition[] | null {
  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 }
  ];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      for (const direction of directions) {
        const line: BoardPosition[] = [];

        for (let i = 0; i < config.lineLength; i++) {
          const r = row + direction.row * i;
          const c = col + direction.col * i;
          if (!isInsideBoard(config, r, c)) break;
          if (snapshot.board[r][c].piece?.owner !== player) break;
          line.push({ row: r, col: c });
        }

        if (line.length === config.lineLength) return line;
      }
    }
  }

  return null;
}

export function isInsideBoard(config: GameConfig, row: number, col: number): boolean {
  return row >= 0 && row < config.rows && col >= 0 && col < config.columns;
}

export function shouldDrawIfNoLegalMoves(snapshot: GameSnapshot, config: GameConfig): boolean {
  return DRAW_IF_NO_LEGAL_MOVES && !hasLegalMove(snapshot, config);
}

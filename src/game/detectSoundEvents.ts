import { isCombosObjective } from "./config";
import type { Board, GameEndSummary, GameState, PlayerId } from "./types";

export type GameSoundEvent =
  | { type: "place" }
  | { type: "move" }
  | { type: "capture" }
  | { type: "combo"; tier: 3 | 4 | 5 }
  | { type: "outcome"; result: "win" | "lose" | "draw" };

interface PieceOnBoard {
  row: number;
  col: number;
  owner: PlayerId;
}

interface BoardDelta {
  placed: number;
  moved: number;
  removed: number;
  converted: number;
}

export interface DetectSoundEventsContext {
  /** Jugador local en online; null en offline (resultado neutro al ganador). */
  perspectivePlayer: PlayerId | null;
}

export function detectGameSoundEvents(
  prev: GameState,
  next: GameState,
  context: DetectSoundEventsContext
): GameSoundEvent[] {
  if (shouldSkipTransition(prev, next)) {
    return [];
  }

  const events: GameSoundEvent[] = [];

  if (!prev.gameOver && next.gameOver) {
    const outcome = resolveOutcomeEvent(next.gameEndSummary, context.perspectivePlayer);
    if (outcome) {
      events.push(outcome);
    }
    return events;
  }

  const delta = analyzeBoardDelta(prev.board, next.board);
  const comboPoints = getCombosPointsDelta(prev, next);
  const combosScored = comboPoints > 0 && isCombosObjective(next.config);

  if (combosScored) {
    events.push({ type: "combo", tier: comboTierFromPoints(comboPoints) });
  }

  if (!combosScored && (delta.removed > 0 || delta.converted > 0)) {
    events.push({ type: "capture" });
  } else if (delta.placed > 0) {
    events.push({ type: "place" });
  } else if (delta.moved > 0) {
    events.push({ type: "move" });
  }

  return events;
}

function shouldSkipTransition(prev: GameState, next: GameState): boolean {
  if (next.turnNumber < prev.turnNumber) return true;
  if (next.undoStack.length < prev.undoStack.length) return true;
  if (next.redoStack.length < prev.redoStack.length) return true;
  if (prev === next) return true;
  if (onlySelectionChanged(prev, next)) return true;
  return false;
}

function onlySelectionChanged(prev: GameState, next: GameState): boolean {
  return (
    prev.turnNumber === next.turnNumber &&
    prev.currentPlayer === next.currentPlayer &&
    prev.gameOver === next.gameOver &&
    prev.selectedPieceId !== next.selectedPieceId &&
    boardsEqual(prev.board, next.board)
  );
}

function boardsEqual(a: Board, b: Board): boolean {
  if (a.length !== b.length) return false;
  for (let row = 0; row < a.length; row++) {
    const rowA = a[row];
    const rowB = b[row];
    if (!rowA || !rowB || rowA.length !== rowB.length) return false;
    for (let col = 0; col < rowA.length; col++) {
      const pieceA = rowA[col]?.piece ?? null;
      const pieceB = rowB[col]?.piece ?? null;
      if (pieceA?.id !== pieceB?.id) return false;
      if (pieceA?.owner !== pieceB?.owner) return false;
      if (pieceA?.kind !== pieceB?.kind) return false;
    }
  }
  return true;
}

function indexPieces(board: Board): Map<number, PieceOnBoard> {
  const map = new Map<number, PieceOnBoard>();
  for (let row = 0; row < board.length; row++) {
    const cells = board[row];
    if (!cells) continue;
    for (let col = 0; col < cells.length; col++) {
      const piece = cells[col]?.piece;
      if (!piece) continue;
      map.set(piece.id, { row, col, owner: piece.owner });
    }
  }
  return map;
}

function analyzeBoardDelta(prevBoard: Board, nextBoard: Board): BoardDelta {
  const prevPieces = indexPieces(prevBoard);
  const nextPieces = indexPieces(nextBoard);
  const delta: BoardDelta = { placed: 0, moved: 0, removed: 0, converted: 0 };

  for (const [id, prevEntry] of prevPieces) {
    const nextEntry = nextPieces.get(id);
    if (!nextEntry) {
      delta.removed++;
      continue;
    }
    if (nextEntry.owner !== prevEntry.owner) {
      delta.converted++;
      continue;
    }
    if (nextEntry.row !== prevEntry.row || nextEntry.col !== prevEntry.col) {
      delta.moved++;
    }
  }

  for (const id of nextPieces.keys()) {
    if (!prevPieces.has(id)) {
      delta.placed++;
    }
  }

  return delta;
}

function getCombosPointsDelta(prev: GameState, next: GameState): number {
  let delta = 0;
  const keys = new Set([...Object.keys(prev.combosScores), ...Object.keys(next.combosScores)]);
  for (const key of keys) {
    const playerId = key as PlayerId;
    const before = prev.combosScores[playerId] ?? 0;
    const after = next.combosScores[playerId] ?? 0;
    if (after > before) {
      delta += after - before;
    }
  }
  return delta;
}

function comboTierFromPoints(points: number): 3 | 4 | 5 {
  if (points >= 11) return 5;
  if (points >= 6) return 4;
  return 3;
}

function resolveOutcomeEvent(
  summary: GameEndSummary | null,
  perspectivePlayer: PlayerId | null
): GameSoundEvent | null {
  if (!summary) return null;

  if (summary.type === "draw") {
    return { type: "outcome", result: "draw" };
  }

  if (summary.type === "winner") {
    if (perspectivePlayer === null) {
      return { type: "outcome", result: "win" };
    }
    if (summary.winnerId === perspectivePlayer) {
      return { type: "outcome", result: "win" };
    }
    if (summary.loserId === perspectivePlayer) {
      return { type: "outcome", result: "lose" };
    }
    return null;
  }

  if (summary.type === "ranking") {
    if (perspectivePlayer === null) {
      return { type: "outcome", result: "win" };
    }
    const place = summary.orderedIds.indexOf(perspectivePlayer);
    if (place === 0) return { type: "outcome", result: "win" };
    if (place === summary.orderedIds.length - 1 && summary.orderedIds.length > 1) {
      return { type: "outcome", result: "lose" };
    }
    return null;
  }

  return null;
}

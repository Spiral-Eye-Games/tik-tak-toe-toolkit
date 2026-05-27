import { describe, expect, it } from "vitest";
import { createEmptyCell } from "./board";
import { detectGameSoundEvents } from "./detectSoundEvents";
import { DEFAULT_CONFIG } from "./defaults";
import { createInitialGameState } from "./reducer";
import type { GameState } from "./types";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

describe("detectSoundEvents", () => {
  it("detecta colocación de ficha", () => {
    const prev = createInitialGameState({
      ...DEFAULT_CONFIG,
      columns: 3,
      rows: 3,
      playerCount: 2
    });
    const next = cloneState(prev);
    next.turnNumber = 1;
    next.board[1][1] = {
      ...createEmptyCell(),
      piece: { id: 1, owner: "cross", kind: "normal" }
    };
    next.nextPieceId = 2;

    const events = detectGameSoundEvents(prev, next, { perspectivePlayer: null });
    expect(events).toEqual([{ type: "place" }]);
  });

  it("detecta victoria local en online", () => {
    const prev = createInitialGameState({
      ...DEFAULT_CONFIG,
      columns: 3,
      rows: 3,
      playerCount: 2
    });
    const next = cloneState(prev);
    next.gameOver = true;
    next.gameEndSummary = { type: "winner", winnerId: "circle", loserId: "cross" };

    const win = detectGameSoundEvents(prev, next, { perspectivePlayer: "circle" });
    const lose = detectGameSoundEvents(prev, next, { perspectivePlayer: "cross" });

    expect(win).toEqual([{ type: "outcome", result: "win" }]);
    expect(lose).toEqual([{ type: "outcome", result: "lose" }]);
  });

  it("ignora undo", () => {
    const next = createInitialGameState({
      ...DEFAULT_CONFIG,
      columns: 3,
      rows: 3,
      playerCount: 2
    });
    const prev = cloneState(next);
    prev.turnNumber = 3;
    next.turnNumber = 2;
    next.undoStack = [];

    expect(detectGameSoundEvents(prev, next, { perspectivePlayer: null })).toEqual([]);
  });
});

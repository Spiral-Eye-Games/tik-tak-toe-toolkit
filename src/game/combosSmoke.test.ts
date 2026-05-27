import { describe, expect, it } from "vitest";
import { runCombosCascadeUntilStable } from "./combosResolve";
import { sanitizeConfig } from "./config";
import { DEFAULT_CONFIG } from "./defaults";
import { cloneSnapshot, createSnapshot } from "./history";
import { createInitialGameState } from "./reducer";

describe("combos motor (humo)", () => {
  it("inicializa estado combos con acciones y puntajes en cero", () => {
    const config = sanitizeConfig({ ...DEFAULT_CONFIG, lineRule: "combos", playerCount: 2 });
    const state = createInitialGameState(config);
    expect(state.combosActionsRemainingThisTurn).toBeGreaterThan(0);
    expect(state.combosScores[state.activePlayerIds[0]]).toBe(0);
    expect(state.fullRoundsCompleted).toBe(0);
  });

  it("resuelve línea de 3: puntúa al iniciador y limpia las casillas", () => {
    const config = sanitizeConfig({
      ...DEFAULT_CONFIG,
      columns: 4,
      rows: 3,
      lineRule: "combos",
      gravityEnabled: false,
      brokenEnabled: false,
      collapseEnabled: false,
      playerCount: 2
    });
    const base = createInitialGameState(config);
    const snap = cloneSnapshot(createSnapshot(base));
    snap.turnNumber = 1;
    snap.board[1][0].piece = { id: 101, owner: "cross", kind: "normal" };
    snap.board[1][1].piece = { id: 102, owner: "cross", kind: "normal" };
    snap.board[1][2].piece = { id: 103, owner: "cross", kind: "normal" };
    snap.pieceHistory.cross = [101, 102, 103];

    runCombosCascadeUntilStable(snap, config, { row: 1, col: 2 }, "cross");

    expect(snap.combosScores.cross).toBe(3);
    expect(snap.board[1][0].piece).toBeNull();
    expect(snap.board[1][1].piece).toBeNull();
    expect(snap.board[1][2].piece).toBeNull();
  });
});

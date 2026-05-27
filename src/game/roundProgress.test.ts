import { describe, expect, it } from "vitest";
import { advanceTurnAfterNoLine } from "./outcomes";
import { sanitizeConfig } from "./config";
import { DEFAULT_CONFIG } from "./defaults";
import { incrementFullRoundIfWrapped } from "./roundProgress";
import { createInitialGameState } from "./reducer";
import type { GameSnapshot, PlayerId } from "./types";

function snapshotStub(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  const base = createInitialGameState(sanitizeConfig({ ...DEFAULT_CONFIG, playerCount: 3, lineRule: "win" }));
  return { ...base, ...overrides };
}

describe("roundProgress", () => {
  it("incrementa ronda solo al cerrar la vuelta de activos", () => {
    const snap = snapshotStub({
      activePlayerIds: ["cross", "circle", "triangle"],
      currentPlayer: "cross",
      fullRoundsCompleted: 0
    });

    incrementFullRoundIfWrapped(snap, snap.activePlayerIds, "cross");
    expect(snap.fullRoundsCompleted).toBe(0);

    snap.currentPlayer = "circle";
    incrementFullRoundIfWrapped(snap, snap.activePlayerIds, "circle");
    expect(snap.fullRoundsCompleted).toBe(0);

    snap.currentPlayer = "triangle";
    incrementFullRoundIfWrapped(snap, snap.activePlayerIds, "triangle");
    expect(snap.fullRoundsCompleted).toBe(1);
  });

  it("no exige turno de jugadores ya eliminados", () => {
    const snap = snapshotStub({
      activePlayerIds: ["cross", "triangle"],
      currentPlayer: "cross",
      fullRoundsCompleted: 1,
      turnNumber: 4
    });
    const oldActive: PlayerId[] = ["cross", "triangle"];

    incrementFullRoundIfWrapped(snap, oldActive, "cross");
    expect(snap.fullRoundsCompleted).toBe(1);

    incrementFullRoundIfWrapped(snap, oldActive, "triangle");
    expect(snap.fullRoundsCompleted).toBe(2);
  });

  it("avanza rondas clásicas vía advanceTurnAfterNoLine", () => {
    const config = sanitizeConfig({ ...DEFAULT_CONFIG, playerCount: 3, lineRule: "win" });
    const snap = snapshotStub({
      activePlayerIds: ["cross", "circle", "triangle"],
      currentPlayer: "cross",
      fullRoundsCompleted: 0
    });

    advanceTurnAfterNoLine(snap, config);
    expect(snap.currentPlayer).toBe("circle");
    expect(snap.fullRoundsCompleted).toBe(0);

    snap.currentPlayer = "circle";
    advanceTurnAfterNoLine(snap, config);
    expect(snap.currentPlayer).toBe("triangle");
    expect(snap.fullRoundsCompleted).toBe(0);

    snap.currentPlayer = "triangle";
    advanceTurnAfterNoLine(snap, config);
    expect(snap.currentPlayer).toBe("cross");
    expect(snap.fullRoundsCompleted).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { getMatchProgress } from "./matchProgress";
import { createInitialGameState } from "./reducer";
import { sanitizeConfig } from "./config";
import { DEFAULT_CONFIG } from "./defaults";

describe("getMatchProgress", () => {
  it("expone turnNumber y fullRoundsCompleted del snapshot", () => {
    const state = createInitialGameState(sanitizeConfig({ ...DEFAULT_CONFIG, playerCount: 2 }));
    const snap = { ...state, turnNumber: 5, fullRoundsCompleted: 2 };

    expect(getMatchProgress(snap)).toEqual({
      turnsCompleted: 5,
      roundsCompleted: 2
    });
  });
});

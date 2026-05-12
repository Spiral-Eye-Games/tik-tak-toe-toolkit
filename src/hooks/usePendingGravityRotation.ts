import { useEffect } from "react";
import type { Dispatch } from "react";
import { DEFAULT_GRAVITY_ROTATION_PAUSE_MS } from "../game/defaults";
import type { GameAction, GameState } from "../game/types";

export function usePendingGravityRotation(gameState: GameState, dispatch: Dispatch<GameAction>): void {
  useEffect(() => {
    if (gameState.pendingGravityRotationTarget === null) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "completePendingGravityRotation" });
    }, DEFAULT_GRAVITY_ROTATION_PAUSE_MS);
    return () => window.clearTimeout(id);
  }, [gameState.pendingGravityRotationTarget, dispatch]);
}

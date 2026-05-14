import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch } from "react";
import { formatClockSecondsForDisplay, getClockRemainingSeconds, isClockEnabled } from "../game/clock";
import type { GameAction, GameState } from "../game/types";

export function useGameClock(
  gameState: GameState,
  dispatch: Dispatch<GameAction>,
  shouldDispatchTimeout = true
): string | null {
  const gameRef = useRef(gameState);
  gameRef.current = gameState;
  const [clockPulse, setClockPulse] = useState(0);

  useEffect(() => {
    if (gameState.gameOver || !isClockEnabled(gameState.config)) return;

    const id = window.setInterval(() => {
      const gs = gameRef.current;
      if (gs.gameOver || !isClockEnabled(gs.config)) return;

      const remaining = getClockRemainingSeconds(gs, gs.config, Date.now());
      if (shouldDispatchTimeout && remaining !== null && remaining <= 0.12) {
        if (gs.config.clockMode === "bank") {
          dispatch({ type: "clockBankTimeout" });
        } else {
          dispatch({ type: "clockPerTurnTimeout" });
        }
      }

      setClockPulse((value) => value + 1);
    }, 100);

    return () => window.clearInterval(id);
  }, [gameState.gameOver, gameState.config.clockEnabled, gameState.config.clockMode, dispatch, shouldDispatchTimeout]);

  return useMemo(() => {
    if (gameState.gameOver || !isClockEnabled(gameState.config)) return null;
    const remaining = getClockRemainingSeconds(gameState, gameState.config, Date.now());
    if (remaining === null) return null;
    return formatClockSecondsForDisplay(remaining);
  }, [gameState, clockPulse]);
}

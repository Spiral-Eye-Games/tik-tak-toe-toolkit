import { useEffect, useRef } from "react";
import { getClockRemainingSeconds, isClockEnabled } from "../game/clock";
import { detectGameSoundEvents } from "../game/detectSoundEvents";
import { playClockTimeoutSound, playClockUrgentTick, playGameSoundEvent } from "../game/gameSounds";
import type { GameState, PlayerId } from "../game/types";

interface UseGameJuiceSoundsOptions {
  gameState: GameState;
  /** Jugador local en online; null en offline. */
  perspectivePlayer: PlayerId | null;
  /** Si el reloj corre para el jugador local (online: solo en su turno). */
  ownsClockTurn: boolean;
}

export function useGameJuiceSounds({
  gameState,
  perspectivePlayer,
  ownsClockTurn
}: UseGameJuiceSoundsOptions): void {
  const prevStateRef = useRef<GameState>(gameState);
  const skipNextRef = useRef(true);
  const lastUrgentSecondRef = useRef<number | null>(null);
  const gameRef = useRef(gameState);
  gameRef.current = gameState;

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = gameState;

    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    const events = detectGameSoundEvents(prev, gameState, { perspectivePlayer });
    for (const event of events) {
      playGameSoundEvent(event);
    }
  }, [gameState, perspectivePlayer]);

  useEffect(() => {
    lastUrgentSecondRef.current = null;
  }, [gameState.currentPlayer, gameState.gameOver]);

  useEffect(() => {
    if (gameState.gameOver || !ownsClockTurn || !isClockEnabled(gameState.config)) {
      lastUrgentSecondRef.current = null;
      return;
    }

    const id = window.setInterval(() => {
      const gs = gameRef.current;
      if (gs.gameOver || !isClockEnabled(gs.config)) return;

      const remaining = getClockRemainingSeconds(gs, gs.config, Date.now());
      if (remaining === null) return;

      if (remaining <= 0.12) {
        if (lastUrgentSecondRef.current !== 0) {
          lastUrgentSecondRef.current = 0;
          playClockTimeoutSound();
        }
        return;
      }

      const secondsLeft = Math.ceil(remaining);
      if (secondsLeft > 5) {
        lastUrgentSecondRef.current = null;
        return;
      }

      if (lastUrgentSecondRef.current === secondsLeft) return;
      lastUrgentSecondRef.current = secondsLeft;
      playClockUrgentTick(secondsLeft);
    }, 100);

    return () => window.clearInterval(id);
  }, [
    gameState.gameOver,
    gameState.config.clockEnabled,
    gameState.config.clockMode,
    gameState.config.clockPerTurnSeconds,
    gameState.currentPlayer,
    ownsClockTurn
  ]);
}

import type { GameSnapshot, PlayerId } from "./types";

/**
 * Suma una ronda completa si quien acaba de jugar era el último del orden activo actual.
 * Solo los jugadores que siguen en `activePlayerIds` cuentan para cerrar la vuelta.
 */
export function incrementFullRoundIfWrapped(
  snapshot: GameSnapshot,
  oldActive: PlayerId[],
  completedPlayer: PlayerId
): void {
  if (oldActive.length === 0) return;
  const idx = oldActive.indexOf(completedPlayer);
  if (idx >= 0 && idx === oldActive.length - 1) {
    snapshot.fullRoundsCompleted++;
  }
}

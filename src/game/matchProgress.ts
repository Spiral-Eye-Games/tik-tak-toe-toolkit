import type { GameSnapshot } from "./types";

export interface MatchProgress {
  /** Acciones de turno ya completadas (`turnNumber`). */
  turnsCompleted: number;
  /** Rondas completas (cada jugador activo jugó una vez por ronda). */
  roundsCompleted: number;
}

export function getMatchProgress(snapshot: GameSnapshot): MatchProgress {
  return {
    turnsCompleted: snapshot.turnNumber,
    roundsCompleted: snapshot.fullRoundsCompleted
  };
}

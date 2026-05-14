import { forfeitPlayer } from "./outcomes";
import type { GameState } from "./types";

/** Rendición habilitada tras completar al menos una ronda (un turno por cada jugador de la partida). */
export function canSurrender(state: GameState): boolean {
  if (state.gameOver || state.pendingGravityRotationTarget !== null) return false;
  return state.turnNumber >= state.config.playerCount;
}

export function applySurrender(state: GameState): GameState {
  if (!canSurrender(state)) return state;
  return forfeitPlayer(state, state.currentPlayer, "surrender");
}

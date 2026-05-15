import type { GameConfig, GameState } from "./types";

/** Primer valor de `turnNumber` donde ya se puede omitir turno; `Infinity` si nunca. */
export function skipTurnUnlockAtTurn(config: GameConfig): number {
  if (config.skipTurnBlockMode === "infinite") return Number.POSITIVE_INFINITY;
  const amount = Math.max(0, config.skipTurnBlockTurns);
  if (amount <= 0) return 0;
  const factor = config.skipTurnBlockMode === "rounds" ? config.playerCount : 1;
  return amount * factor;
}

export function isSkipTurnUnavailable(state: Pick<GameState, "config" | "turnNumber">): boolean {
  const unlock = skipTurnUnlockAtTurn(state.config);
  return !Number.isFinite(unlock) || state.turnNumber < unlock;
}

export function skipTurnRemainderTicks(state: Pick<GameState, "config" | "turnNumber">): number {
  const unlock = skipTurnUnlockAtTurn(state.config);
  if (!Number.isFinite(unlock)) return 0;
  return Math.max(0, unlock - state.turnNumber);
}

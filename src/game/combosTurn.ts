import { finishIfNoLegalMoves } from "./legalMovesFinish";
import { getDefaultSelectedPieceIdForcedOldest } from "./placement";
import { incrementFullRoundIfWrapped } from "./roundProgress";
import { getNextActivePlayerAfterChanges } from "./turns";
import type { GameConfig, GameSnapshot } from "./types";

export function computeCombosActionBudget(config: GameConfig, fullRoundsCompleted: number): number {
  const base = config.combosActionsMin + config.combosActionsIncrement * Math.max(0, fullRoundsCompleted);
  return Math.min(config.combosActionsMax, base);
}

/** Avanza jugador, incrementa ronda global si hubo wrap y repone cuota de acciones. */
export function combosRotatePlayerAndRefill(snapshot: GameSnapshot, config: GameConfig): void {
  const oldActive = [...snapshot.activePlayerIds];
  const completedPlayer = snapshot.currentPlayer;
  snapshot.currentPlayer = getNextActivePlayerAfterChanges(oldActive, snapshot.activePlayerIds, completedPlayer);
  incrementFullRoundIfWrapped(snapshot, oldActive, completedPlayer);
  snapshot.combosActionsRemainingThisTurn = computeCombosActionBudget(config, snapshot.fullRoundsCompleted);
  snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);
  finishIfNoLegalMoves(snapshot, config);
}

/**
 * Tras consumir una acción del turno Combos: o bien permanece el mismo jugador con fichas actualizadas,
 * o bien rota turno si la cuota llegó a 0 (tras decrementar antes de llamar).
 */
export function advanceCombosAfterSpendingOneAction(snapshot: GameSnapshot, config: GameConfig): void {
  if (snapshot.gameOver) return;
  if (snapshot.combosActionsRemainingThisTurn > 0) {
    snapshot.selectedPieceId = getDefaultSelectedPieceIdForcedOldest(snapshot, config);
    finishIfNoLegalMoves(snapshot, config);
    return;
  }
  combosRotatePlayerAndRefill(snapshot, config);
}

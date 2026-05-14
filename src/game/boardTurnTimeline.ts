import { getResolvedCollapseInterval, getResolvedGravityRotateInterval } from "./config";
import { getResolvedRestrictionStartTurns } from "./restrictions";
import { getNextActivePlayer } from "./turns";
import type { GameConfig, GameSnapshot, PlayerId } from "./types";

export type BoardTimelineRowKind = "gravityPending" | "player" | "collapse" | "gravityRotate" | "restrictionEnd";

export interface BoardTimelineRow {
  kind: BoardTimelineRowKind;
  playerId?: PlayerId;
}

/** Máximo de filas de la línea de tiempo visible (coste de DOM y del bucle). */
export const BOARD_TURN_TIMELINE_MAX_ROWS = 32;

/**
 * Último número de turno simulado hasta el que proyectamos (tras eso solo siguen turnos de jugador / gravedad repetidos).
 */
function computeProjectionHorizonTurn(snapshot: GameSnapshot, config: GameConfig): number {
  const n = Math.max(1, snapshot.activePlayerIds.length);
  let t = snapshot.turnNumber;
  let collapseCount = snapshot.collapseCount;

  const collapseInterval = config.collapseEnabled ? getResolvedCollapseInterval(config) : 0;
  if (config.collapseEnabled && collapseInterval > 0) {
    while (collapseCount < config.collapseTimes) {
      const rem = t % collapseInterval;
      const advance = rem === 0 ? collapseInterval : collapseInterval - rem;
      t += advance;
      collapseCount++;
    }
  }

  const restrictionEnd = getResolvedRestrictionStartTurns(config);
  if (restrictionEnd > 0) {
    t = Math.max(t, restrictionEnd);
  }

  const gravityInterval =
    config.gravityEnabled && config.gravityRotateEnabled ? getResolvedGravityRotateInterval(config) : 0;
  const gravityTail =
    gravityInterval > 0 ? gravityInterval * Math.max(24, n * 6) : n * Math.max(32, n * 6);

  const extraPlayerCycles = Math.max(48, n * 32);
  return t + n * extraPlayerCycles + gravityTail;
}

/**
 * Secuencia vertical para la barra del tablero: primero el momento actual (arriba),
 * luego turnos y eventos proyectados hasta el horizonte (`computeProjectionHorizonTurn`).
 */
export function getBoardTurnTimeline(snapshot: GameSnapshot, config: GameConfig): BoardTimelineRow[] {
  if (snapshot.gameOver || snapshot.activePlayerIds.length === 0) return [];

  const horizonTurn = computeProjectionHorizonTurn(snapshot, config);

  const rows: BoardTimelineRow[] = [];

  if (snapshot.pendingGravityRotationTarget !== null) {
    rows.push({ kind: "gravityPending" });
  }

  rows.push({ kind: "player", playerId: snapshot.currentPlayer });

  let turn = snapshot.turnNumber;
  let currentPlayer = snapshot.currentPlayer;
  let collapseCount = snapshot.collapseCount;

  while (rows.length < BOARD_TURN_TIMELINE_MAX_ROWS && turn < horizonTurn) {
    turn += 1;

    if (shouldApplyCollapseThisTurn(turn, collapseCount, config)) {
      rows.push({ kind: "collapse" });
      collapseCount++;
      if (rows.length >= BOARD_TURN_TIMELINE_MAX_ROWS) break;
    }

    if (shouldEmitRestrictionReleaseThisTurn(turn, config)) {
      rows.push({ kind: "restrictionEnd" });
      if (rows.length >= BOARD_TURN_TIMELINE_MAX_ROWS) break;
    }

    const rotationThisTurn = shouldScheduleGravityRotationThisTurn(turn, config);
    currentPlayer = getNextActivePlayer(snapshot.activePlayerIds, currentPlayer);

    if (rotationThisTurn) {
      rows.push({ kind: "gravityRotate" });
      if (rows.length >= BOARD_TURN_TIMELINE_MAX_ROWS) break;
    }

    rows.push({ kind: "player", playerId: currentPlayer });
  }

  return rows;
}

function shouldApplyCollapseThisTurn(turnNumber: number, collapseCount: number, config: GameConfig): boolean {
  if (!config.collapseEnabled || collapseCount >= config.collapseTimes) return false;
  const interval = getResolvedCollapseInterval(config);
  return interval > 0 && turnNumber % interval === 0;
}

function shouldScheduleGravityRotationThisTurn(turnNumber: number, config: GameConfig): boolean {
  if (!config.gravityEnabled || !config.gravityRotateEnabled) return false;
  const interval = getResolvedGravityRotateInterval(config);
  if (interval <= 0 || turnNumber <= 0) return false;
  return turnNumber % interval === 0;
}

function shouldEmitRestrictionReleaseThisTurn(turnNumber: number, config: GameConfig): boolean {
  if (!config.restrictionsEnabled || config.restrictionStartBlockedCells.length === 0) return false;
  const resolved = getResolvedRestrictionStartTurns(config);
  if (resolved <= 0) return false;
  return turnNumber - 1 < resolved && turnNumber >= resolved;
}

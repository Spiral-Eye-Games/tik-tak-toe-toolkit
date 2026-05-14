import type { GameConfig, GameSnapshot, PlayerId } from "./types";

export function isClockEnabled(config: GameConfig): boolean {
  return config.clockEnabled;
}

export function buildClockBankInitial(activePlayerIds: PlayerId[], bankSeconds: number): Record<PlayerId, number> {
  return Object.fromEntries(activePlayerIds.map((id) => [id, bankSeconds])) as Record<PlayerId, number>;
}

/** Segundos restantes en banca de un jugador (activo o no). El jugador en turno usa el reloj en vivo; el resto, el valor congelado en `clockBankRemaining`. */
export function getBankRemainingSecondsForPlayer(
  snapshot: GameSnapshot,
  config: GameConfig,
  playerId: PlayerId,
  nowMs: number
): number | null {
  if (!isClockEnabled(config) || config.clockMode !== "bank" || !snapshot.clockBankRemaining) return null;

  const bank = snapshot.clockBankRemaining[playerId];
  if (bank === undefined) return null;

  if (snapshot.gameOver) {
    return Math.max(0, bank);
  }

  if (playerId === snapshot.currentPlayer) {
    return getClockRemainingSeconds(snapshot, config, nowMs);
  }

  return Math.max(0, bank);
}

/** Segundos restantes del jugador en turno (null si no aplica). */
export function getClockRemainingSeconds(snapshot: GameSnapshot, config: GameConfig, nowMs: number): number | null {
  if (!isClockEnabled(config) || snapshot.gameOver) return null;

  const turnStart = snapshot.clockTurnStartedAtMs;
  const pauseStart = snapshot.clockPauseStartedAtMs;
  const effectiveNow =
    snapshot.pendingGravityRotationTarget !== null && pauseStart !== null ? pauseStart : nowMs;
  let elapsedSec = Math.max(0, (effectiveNow - turnStart) / 1000);
  /** Antes de la primera jugada el reloj no corre. */
  if (snapshot.turnNumber === 0) {
    elapsedSec = 0;
  }

  if (config.clockEnabled && config.clockMode === "bank" && snapshot.clockBankRemaining) {
    const pid = snapshot.currentPlayer;
    const bank = snapshot.clockBankRemaining[pid];
    if (bank === undefined) return null;
    return Math.max(0, bank - elapsedSec);
  }

  if (config.clockEnabled && config.clockMode === "perTurn") {
    return Math.max(0, config.clockPerTurnSeconds - elapsedSec);
  }

  return null;
}

export interface CommitBankClockOptions {
  /** Si es la primera jugada de la partida (`turnNumber` era 0), no descontar tiempo pensado. */
  ignoreElapsed?: boolean;
}

/** Tras un movimiento que completa el turno (antes de `finishTurn`), actualiza la banca del jugador que movió. */
export function commitBankAfterSuccessfulMove(
  snapshot: GameSnapshot,
  config: GameConfig,
  nowMs: number,
  options?: CommitBankClockOptions
): void {
  if (!config.clockEnabled || config.clockMode !== "bank" || !snapshot.clockBankRemaining) return;

  const turnStart = snapshot.clockTurnStartedAtMs;
  const pauseStart = snapshot.clockPauseStartedAtMs;
  const effectiveNow =
    snapshot.pendingGravityRotationTarget !== null && pauseStart !== null ? pauseStart : nowMs;
  let elapsedSec = Math.max(0, (effectiveNow - turnStart) / 1000);
  if (options?.ignoreElapsed) {
    elapsedSec = 0;
  }

  const pid = snapshot.currentPlayer;
  const bank = snapshot.clockBankRemaining[pid];
  if (bank === undefined) return;

  let next = bank - elapsedSec + Math.max(0, config.clockRecoverSeconds);
  next = Math.max(0, Math.min(config.clockBankSeconds, next));
  snapshot.clockBankRemaining[pid] = next;
}

/** Descuenta el tiempo transcurrido del turno en modo banca, sin recuperación (pase u omisión de jugada). */
export function commitBankAfterVoluntaryPass(
  snapshot: GameSnapshot,
  config: GameConfig,
  nowMs: number,
  options?: CommitBankClockOptions
): void {
  if (!config.clockEnabled || config.clockMode !== "bank" || !snapshot.clockBankRemaining) return;

  const turnStart = snapshot.clockTurnStartedAtMs;
  const pauseStart = snapshot.clockPauseStartedAtMs;
  const effectiveNow =
    snapshot.pendingGravityRotationTarget !== null && pauseStart !== null ? pauseStart : nowMs;
  let elapsedSec = Math.max(0, (effectiveNow - turnStart) / 1000);
  if (options?.ignoreElapsed) {
    elapsedSec = 0;
  }

  const pid = snapshot.currentPlayer;
  const bank = snapshot.clockBankRemaining[pid];
  if (bank === undefined) return;

  let next = bank - elapsedSec;
  next = Math.max(0, Math.min(config.clockBankSeconds, next));
  snapshot.clockBankRemaining[pid] = next;
}

export function restartTurnClock(snapshot: GameSnapshot, config: GameConfig, nowMs: number): void {
  if (!isClockEnabled(config)) return;
  snapshot.clockTurnStartedAtMs = nowMs;
  if (snapshot.pendingGravityRotationTarget !== null) {
    snapshot.clockPauseStartedAtMs = nowMs;
  } else {
    snapshot.clockPauseStartedAtMs = null;
  }
}

/** Al terminar la pausa de rotación de gravedad, no contar ese intervalo contra el reloj. */
export function extendClockTurnStartAfterGravityPause(snapshot: GameSnapshot, pauseEndedAtMs: number): void {
  const pauseStart = snapshot.clockPauseStartedAtMs;
  if (pauseStart === null) return;
  snapshot.clockTurnStartedAtMs += pauseEndedAtMs - pauseStart;
  snapshot.clockPauseStartedAtMs = null;
}

export function clearClockPauseIfNoPendingGravity(snapshot: GameSnapshot): void {
  if (snapshot.pendingGravityRotationTarget === null) {
    snapshot.clockPauseStartedAtMs = null;
  }
}

/** Tiempo restante para la UI (MM:SS, segundos enteros hacia arriba). */
export function formatClockSecondsForDisplay(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds - 1e-6));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

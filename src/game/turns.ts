import type { PlayerId } from "./types";

export function getNextActivePlayer(activePlayerIds: PlayerId[], current: PlayerId): PlayerId {
  if (activePlayerIds.length === 0) return current;
  const index = activePlayerIds.indexOf(current);
  if (index < 0) return activePlayerIds[0];
  return activePlayerIds[(index + 1) % activePlayerIds.length];
}

export function getNextTurnAfterPlayerRemoved(activePlayerIds: PlayerId[], removedId: PlayerId): PlayerId {
  const index = activePlayerIds.indexOf(removedId);
  const n = activePlayerIds.length;
  if (n <= 1) return activePlayerIds[0] ?? removedId;
  for (let step = 1; step < n; step++) {
    const candidate = activePlayerIds[(index + step) % n];
    if (candidate !== removedId) return candidate;
  }
  return activePlayerIds[0];
}

/** Siguiente jugador activo en el orden de `oldActive` tras eliminaciones. */
export function getNextActivePlayerAfterChanges(
  oldActive: PlayerId[],
  activePlayerIds: PlayerId[],
  afterPlayerId: PlayerId
): PlayerId {
  if (activePlayerIds.length === 0) return afterPlayerId;
  const startIndex = oldActive.indexOf(afterPlayerId);
  if (startIndex < 0) return activePlayerIds[0];

  for (let step = 1; step <= oldActive.length; step++) {
    const candidate = oldActive[(startIndex + step) % oldActive.length];
    if (activePlayerIds.includes(candidate)) return candidate;
  }

  return activePlayerIds[0];
}

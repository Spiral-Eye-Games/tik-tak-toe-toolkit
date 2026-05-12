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

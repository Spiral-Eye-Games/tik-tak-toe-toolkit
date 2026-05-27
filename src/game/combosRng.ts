import type { PlayerId } from "./types";

/** Semilla determinista por lista activa y tamaño de tablero (offline/multijugador consistente). */
export function combosSeedFromActivePlayers(activePlayerIds: PlayerId[], columns: number, rows: number): number {
  let h = 2166136261 >>> 0;
  for (const id of activePlayerIds) {
    for (let i = 0; i < id.length; i++) {
      h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
    }
  }
  return (h ^ columns ^ (rows << 16)) >>> 0;
}

export function combosRngNext32(snapshot: { combosRngState: number }): number {
  snapshot.combosRngState = (Math.imul(snapshot.combosRngState, 1664525) + 1013904223) >>> 0;
  return snapshot.combosRngState;
}

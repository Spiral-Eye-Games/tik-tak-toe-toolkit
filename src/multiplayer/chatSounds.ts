import { playTone, playToneSequence } from "../audio/tonePlayer";

/** Tono corto al recibir mensaje de otro jugador (chat). */
export function playChatPlayerTone(): void {
  playTone({
    frequency: 720,
    durationSec: 0.09,
    peakGain: 0.05,
    type: "triangle"
  });
}

/** Tono más suave y grave para mensajes de sistema en el chat. */
export function playChatSystemTone(): void {
  playTone({
    frequency: 380,
    durationSec: 0.065,
    peakGain: 0.032,
    type: "sine"
  });
}

/** Dos notas ascendentes cuando le toca jugar al jugador local en modo online. */
export function playOnlineTurnTone(): void {
  playToneSequence([
    { frequency: 660, durationSec: 0.07, peakGain: 0.055, type: "sine", delaySec: 0 },
    { frequency: 880, durationSec: 0.1, peakGain: 0.055, type: "sine", delaySec: 0.09 }
  ]);
}

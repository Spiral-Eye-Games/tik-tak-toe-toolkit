import { playTone, playToneSequence } from "../audio/tonePlayer";
import type { GameSoundEvent } from "./detectSoundEvents";

export function playGameSoundEvent(event: GameSoundEvent): void {
  switch (event.type) {
    case "place":
      playPlacePieceSound();
      return;
    case "move":
      playMovePieceSound();
      return;
    case "capture":
      playCaptureSound();
      return;
    case "combo":
      playComboSound(event.tier);
      return;
    case "outcome":
      playOutcomeSound(event.result);
      return;
    default:
      return;
  }
}

export function playPlacePieceSound(): void {
  playTone({
    frequency: 220,
    durationSec: 0.06,
    peakGain: 0.045,
    type: "sine"
  });
}

export function playMovePieceSound(): void {
  playTone({
    frequency: 520,
    frequencyEnd: 380,
    durationSec: 0.07,
    peakGain: 0.038,
    type: "triangle"
  });
}

export function playCaptureSound(): void {
  playToneSequence([
    {
      frequency: 340,
      frequencyEnd: 180,
      durationSec: 0.05,
      peakGain: 0.05,
      type: "square"
    },
    {
      frequency: 120,
      durationSec: 0.04,
      peakGain: 0.028,
      type: "sine",
      delaySec: 0.04
    }
  ]);
}

export function playComboSound(tier: 3 | 4 | 5): void {
  const baseNotes =
    tier === 3
      ? [523, 659]
      : tier === 4
        ? [523, 659, 784]
        : [523, 659, 784, 988];

  playToneSequence(
    baseNotes.map((frequency, index) => ({
      frequency,
      durationSec: tier === 5 ? 0.09 : 0.07,
      peakGain: 0.048 + index * 0.004,
      type: "triangle" as OscillatorType,
      delaySec: index * 0.08
    }))
  );
}

export function playOutcomeSound(result: "win" | "lose" | "draw"): void {
  if (result === "draw") {
    playTone({
      frequency: 440,
      durationSec: 0.12,
      peakGain: 0.04,
      type: "sine"
    });
    return;
  }

  if (result === "win") {
    playToneSequence([
      { frequency: 523, durationSec: 0.08, peakGain: 0.05, type: "sine", delaySec: 0 },
      { frequency: 659, durationSec: 0.08, peakGain: 0.05, type: "sine", delaySec: 0.09 },
      { frequency: 784, durationSec: 0.1, peakGain: 0.055, type: "sine", delaySec: 0.18 },
      { frequency: 988, durationSec: 0.14, peakGain: 0.058, type: "triangle", delaySec: 0.28 }
    ]);
    return;
  }

  playToneSequence([
    { frequency: 440, durationSec: 0.1, peakGain: 0.045, type: "sine", delaySec: 0 },
    { frequency: 330, durationSec: 0.12, peakGain: 0.042, type: "sine", delaySec: 0.12 },
    { frequency: 220, durationSec: 0.16, peakGain: 0.038, type: "triangle", delaySec: 0.24 }
  ]);
}

export function playClockUrgentTick(secondsLeft: number): void {
  const peakGain = secondsLeft <= 2 ? 0.042 : 0.03;
  playTone({
    frequency: secondsLeft <= 2 ? 920 : 760,
    durationSec: 0.035,
    peakGain,
    type: "square"
  });
}

export function playClockTimeoutSound(): void {
  playToneSequence([
    { frequency: 280, durationSec: 0.1, peakGain: 0.05, type: "sine", delaySec: 0 },
    { frequency: 200, durationSec: 0.14, peakGain: 0.048, type: "triangle", delaySec: 0.11 }
  ]);
}

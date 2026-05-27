export interface ToneOptions {
  frequency: number;
  frequencyEnd?: number;
  durationSec: number;
  peakGain: number;
  type?: OscillatorType;
  delaySec?: number;
}

let sharedCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      sharedCtx = new AudioContext();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function playTone(options: ToneOptions): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => {});

  const delay = options.delaySec ?? 0;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.frequency, t0);
  if (options.frequencyEnd !== undefined && options.frequencyEnd !== options.frequency) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, options.frequencyEnd),
      t0 + options.durationSec
    );
  }

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(options.peakGain, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0009, t0 + options.durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + options.durationSec + 0.03);
}

export function playToneSequence(notes: ToneOptions[]): void {
  for (const note of notes) {
    playTone(note);
  }
}

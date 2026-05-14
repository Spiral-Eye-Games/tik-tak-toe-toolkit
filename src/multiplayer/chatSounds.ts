let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
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

function playTone(options: {
  frequency: number;
  durationSec: number;
  peakGain: number;
  type?: OscillatorType;
}): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => {});

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.frequency, t0);

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(options.peakGain, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0009, t0 + options.durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + options.durationSec + 0.03);
}

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

import { sanitizeConfig } from "./config";
import type { GameConfig } from "./types";

const STORAGE_KEY = "tateti-toolkit-last-settings-v1";

interface StoredPayload {
  version: 1;
  config: GameConfig;
}

export function loadLastSettings(): GameConfig | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const payload = data as Partial<StoredPayload>;
    if (payload.version !== 1 || !payload.config || typeof payload.config !== "object") return null;
    return sanitizeConfig(payload.config as GameConfig);
  } catch {
    return null;
  }
}

export function saveLastSettings(config: GameConfig): void {
  if (typeof localStorage === "undefined") return;
  try {
    const sanitized = sanitizeConfig(config);
    const payload: StoredPayload = {
      version: 1,
      config: { ...sanitized, roster: sanitized.roster.map((p) => ({ ...p })) }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

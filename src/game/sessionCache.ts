import { DEFAULT_ROSTER } from "./defaults";
import { sanitizeConfig } from "./config";
import type { GameConfig, PlayerId as GamePlayerId } from "./types";

const STORAGE_KEY = "tateti-toolkit-last-settings-v1";
const NICKNAME_STORAGE_KEY = "tateti-toolkit-multiplayer-nickname-v1";
const PREFERRED_SYMBOL_STORAGE_KEY = "tateti-toolkit-multiplayer-preferred-symbol-v1";

const VALID_MULTIPLAYER_SYMBOLS = new Set(DEFAULT_ROSTER.map((player) => player.id));

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

export function loadMultiplayerNickname(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    const raw = localStorage.getItem(NICKNAME_STORAGE_KEY);
    return typeof raw === "string" ? raw : "";
  } catch {
    return "";
  }
}

export function saveMultiplayerNickname(name: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, name);
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadMultiplayerPreferredSymbol(): GamePlayerId | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFERRED_SYMBOL_STORAGE_KEY);
    if (raw === null || raw === "") return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null) return null;
    if (typeof parsed !== "string" || !VALID_MULTIPLAYER_SYMBOLS.has(parsed as GamePlayerId)) {
      return null;
    }
    return parsed as GamePlayerId;
  } catch {
    return null;
  }
}

export function saveMultiplayerPreferredSymbol(symbol: GamePlayerId | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFERRED_SYMBOL_STORAGE_KEY, JSON.stringify(symbol));
  } catch {
    /* ignore quota / private mode */
  }
}

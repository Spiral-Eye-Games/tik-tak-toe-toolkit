import { sanitizeConfig } from "./config";
import { DEFAULT_CONFIG, DEFAULT_ROSTER } from "./defaults";
import type { GameConfig } from "./types";

const STORAGE_KEY = "tateti-toolkit-user-presets-v1";

export type BuiltinPresetId = "tateti" | "titeta" | "bullet" | "quebrantasuelos" | "geocentrismo";

export const BUILTIN_PRESET_ORDER: BuiltinPresetId[] = ["tateti", "titeta", "bullet", "quebrantasuelos", "geocentrismo"];

function cloneRoster(): GameConfig["roster"] {
  return DEFAULT_ROSTER.map((p) => ({ ...p }));
}

function buildBuiltinConfig(id: BuiltinPresetId): GameConfig {
  const roster = cloneRoster();
  const base = DEFAULT_CONFIG;

  switch (id) {
    case "tateti":
      return sanitizeConfig({ ...base, roster });
    case "titeta":
      return sanitizeConfig({
        ...base,
        roster,
        columns: 3,
        rows: 3,
        lineRule: "lose",
        lineLength: 3,
        pieceLimitType: "limited",
        maxPiecesPerPlayer: 3,
        pieceMoveMode: "forcedOldest",
        brokenEnabled: true,
        brokenHoleTurns: 1,
        brokenHoleUnlimited: true,
        brokenHoleTurnsPerPlayer: false,
        gravityEnabled: false,
        gravityRotateEnabled: false,
        clockEnabled: false
      });
    case "bullet":
      return sanitizeConfig({
        ...base,
        roster,
        clockEnabled: true,
        clockMode: "bank",
        clockBankSeconds: 60,
        clockRecoverSeconds: 0
      });
    case "quebrantasuelos":
      return sanitizeConfig({
        ...base,
        roster,
        columns: 4,
        rows: 4,
        brokenEnabled: true,
        brokenHoleTurns: 3,
        brokenHoleDurationUnit: "rounds",
        brokenHoleUnlimited: false,
        brokenHoleTurnsPerPlayer: false,
        gravityEnabled: false,
        gravityRotateEnabled: false
      });
    case "geocentrismo":
      return sanitizeConfig({
        ...base,
        roster,
        columns: 4,
        rows: 4,
        gravityEnabled: true,
        gravityInitialDirection: "down",
        gravityRotateEnabled: true,
        gravityRotateAngle: "90",
        gravityRotateSpin: "cw",
        gravityRotateEveryTurns: 1,
        gravityRotateEveryUnit: "rounds"
      });
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

const builtinCache = new Map<BuiltinPresetId, GameConfig>();

export function getBuiltinPresetConfig(id: BuiltinPresetId): GameConfig {
  let cached = builtinCache.get(id);
  if (!cached) {
    cached = buildBuiltinConfig(id);
    builtinCache.set(id, cached);
  }
  return {
    ...cached,
    roster: cached.roster.map((p) => ({ ...p }))
  };
}

export interface UserPresetRecord {
  id: string;
  name: string;
  savedAt: number;
  config: GameConfig;
}

interface StoredPayload {
  version: 1;
  items: UserPresetRecord[];
}

function emptyPayload(): StoredPayload {
  return { version: 1, items: [] };
}

function parseStored(raw: string | null): StoredPayload {
  if (!raw) return emptyPayload();
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return emptyPayload();
    const items = (data as StoredPayload).items;
    if (!Array.isArray(items)) return emptyPayload();
    return {
      version: 1,
      items: items
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const e = entry as unknown as Record<string, unknown>;
          const id = typeof e.id === "string" ? e.id : "";
          const name = typeof e.name === "string" ? e.name.trim() : "";
          const savedAt = typeof e.savedAt === "number" ? e.savedAt : 0;
          const config = e.config as GameConfig | undefined;
          if (!id || !name || !config) return null;
          return { id, name, savedAt, config: sanitizeConfig(config) };
        })
        .filter((x): x is UserPresetRecord => x !== null)
    };
  } catch {
    return emptyPayload();
  }
}

export function loadUserPresets(): UserPresetRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return parseStored(localStorage.getItem(STORAGE_KEY)).items;
  } catch {
    return [];
  }
}

function writeUserPresets(items: UserPresetRecord[]) {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: StoredPayload = { version: 1, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function saveUserPreset(name: string, config: GameConfig): UserPresetRecord {
  const trimmed = name.trim() || "—";
  const sanitized = sanitizeConfig(config);
  const record: UserPresetRecord = {
    id: `u:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 9)}`,
    name: trimmed.slice(0, 80),
    savedAt: Date.now(),
    config: { ...sanitized, roster: sanitized.roster.map((p) => ({ ...p })) }
  };
  const next = [record, ...loadUserPresets()];
  writeUserPresets(next);
  return record;
}

export function deleteUserPreset(id: string) {
  writeUserPresets(loadUserPresets().filter((p) => p.id !== id));
}

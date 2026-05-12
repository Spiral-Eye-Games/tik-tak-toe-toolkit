import {
  DEFAULT_CLOCK_BANK_SECONDS,
  DEFAULT_CLOCK_PER_TURN_SECONDS,
  DEFAULT_CLOCK_RECOVER_SECONDS,
  DEFAULT_ELIMINATE_WINNERS,
  DEFAULT_BROKEN_HOLE_TURNS,
  DEFAULT_GRAVITY_INITIAL_DIRECTION,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS_PER_PLAYER,
  DEFAULT_LIMITED_PIECE_MOVE_MODE,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COLORS,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_ROSTER,
  DEFAULT_UNLIMITED_PIECE_MOVE_MODE
} from "./defaults";
import type { ClockMode, GameConfig, GravityDirection, GravityRotateAngle, GravityRotateSpin, PieceMoveMode, RosterPlayer } from "./types";
import { t } from "../i18n";

type LegacyRosterRow = Partial<RosterPlayer> & { emoji?: string };

function isValidHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/** Normaliza #rgb a #rrggbb para coincidir con `<input type="color">`. */
function normalizeHexColor(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const r = v[1]!;
    const g = v[2]!;
    const b = v[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return v.toLowerCase();
}

export function normalizeRoster(roster: RosterPlayer[] | undefined): RosterPlayer[] {
  if (!Array.isArray(roster) || roster.length < 2) {
    return DEFAULT_ROSTER.map((r) => ({ ...r }));
  }

  const seen = new Set<string>();
  return roster.map((raw, index) => {
    const entry = raw as LegacyRosterRow;
    const fromSymbol = typeof entry.symbol === "string" ? entry.symbol.trim() : "";
    const fromEmoji = typeof entry.emoji === "string" ? entry.emoji.trim() : "";
    const symbolRaw = (fromSymbol || fromEmoji).slice(0, 8);
    const fallback = DEFAULT_ROSTER[index % DEFAULT_ROSTER.length];
    const symbol = symbolRaw || fallback.symbol;
    const colorRaw = typeof entry.color === "string" ? entry.color.trim() : "";
    const color = isValidHexColor(colorRaw)
      ? normalizeHexColor(colorRaw)
      : DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];

    let id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `p${index}`;
    while (seen.has(id)) id = `${id}_${index}`;
    seen.add(id);
    return { id, symbol, color };
  });
}

export function clampInt(value: number, min: number, max: number, fallback: number): number {
  const number = Number.parseInt(String(value), 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function getResolvedBrokenHoleTurns(config: GameConfig): number {
  if (config.brokenHoleUnlimited) return 0;
  let n = config.brokenHoleTurns;
  if (config.brokenHoleTurnsPerPlayer) n *= config.playerCount;
  return Math.min(Math.max(0, n), 9999);
}

const GRAVITY_DIRECTIONS: GravityDirection[] = ["down", "up", "left", "right"];
const GRAVITY_ROTATE_ANGLES: GravityRotateAngle[] = ["90", "180", "270", "random"];
const GRAVITY_ROTATE_SPINS: GravityRotateSpin[] = ["cw", "ccw", "random"];

export function normalizeGravityDirection(value: unknown): GravityDirection {
  return GRAVITY_DIRECTIONS.includes(value as GravityDirection) ? (value as GravityDirection) : DEFAULT_GRAVITY_INITIAL_DIRECTION;
}

export function normalizeGravityRotateAngle(value: unknown): GravityRotateAngle {
  return GRAVITY_ROTATE_ANGLES.includes(value as GravityRotateAngle) ? (value as GravityRotateAngle) : "90";
}

export function normalizeGravityRotateSpin(value: unknown): GravityRotateSpin {
  return GRAVITY_ROTATE_SPINS.includes(value as GravityRotateSpin) ? (value as GravityRotateSpin) : "cw";
}

/** Modo de conteo cuando el cronómetro está activo (solo `bank` | `perTurn`). */
export function normalizeClockStrategy(value: unknown): ClockMode {
  return value === "perTurn" ? "perTurn" : "bank";
}

function resolveClockEnabledAndMode(config: GameConfig): { clockEnabled: boolean; clockMode: ClockMode } {
  const loose = config as { clockEnabled?: boolean; clockMode?: unknown };
  const legacyModeRaw = loose.clockMode;
  const wasLegacyOff = legacyModeRaw === "off";
  const clockMode = normalizeClockStrategy(wasLegacyOff ? "bank" : legacyModeRaw);

  const clockEnabled =
    typeof loose.clockEnabled === "boolean"
      ? loose.clockEnabled
      : !wasLegacyOff && (legacyModeRaw === "bank" || legacyModeRaw === "perTurn");

  return { clockEnabled, clockMode };
}

/** Effective turn interval for gravity rotation (0 if rotation disabled). */
export function getResolvedGravityRotateInterval(config: GameConfig): number {
  if (!config.gravityEnabled || !config.gravityRotateEnabled) return 0;
  const base = clampInt(config.gravityRotateEveryTurns, 1, 99, DEFAULT_GRAVITY_ROTATE_EVERY_TURNS);
  return config.gravityRotateEveryTurnsPerPlayer ? base * config.playerCount : base;
}

export function sanitizeConfig(config: GameConfig): GameConfig {
  const columns = clampInt(config.columns, 3, 12, 4);
  const rows = clampInt(config.rows, 3, 12, 4);
  const lineMax = Math.max(columns, rows);
  const pieceLimitType = config.pieceLimitType;
  const pieceMoveMode = normalizeMoveMode(pieceLimitType, config.pieceMoveMode);

  const roster = normalizeRoster(config.roster);
  const maxPlayers = roster.length;
  const playerCount = clampInt(config.playerCount, 2, maxPlayers, Math.min(DEFAULT_PLAYER_COUNT, maxPlayers));

  const explicitBrokenUnlimited = typeof config.brokenHoleUnlimited === "boolean";
  const brokenHoleUnlimited = explicitBrokenUnlimited
    ? config.brokenHoleUnlimited
    : config.brokenHoleTurns === 0;
  const brokenHoleTurnsPerPlayer = Boolean(config.brokenHoleTurnsPerPlayer);
  const baseBrokenTurnsRaw = !explicitBrokenUnlimited && config.brokenHoleTurns === 0
    ? DEFAULT_BROKEN_HOLE_TURNS
    : config.brokenHoleTurns;
  const brokenHoleTurns = clampInt(baseBrokenTurnsRaw, 1, 99, DEFAULT_BROKEN_HOLE_TURNS);

  const { clockEnabled, clockMode } = resolveClockEnabledAndMode(config);

  return {
    columns,
    rows,
    lineRule: config.lineRule === "win" ? "win" : "lose",
    lineLength: clampInt(config.lineLength, 2, lineMax, 3),
    pieceLimitType,
    maxPiecesPerPlayer: pieceLimitType === "unlimited"
      ? 0
      : clampInt(config.maxPiecesPerPlayer, 1, 99, DEFAULT_MAX_PIECES_PER_PLAYER),
    pieceMoveMode,
    brokenEnabled: config.brokenEnabled,
    brokenHoleTurns,
    brokenHoleUnlimited,
    brokenHoleTurnsPerPlayer,
    gravityEnabled: config.gravityEnabled,
    gravityInitialDirection: normalizeGravityDirection(config.gravityInitialDirection),
    gravityRotateEnabled: Boolean(config.gravityRotateEnabled),
    gravityRotateAngle: normalizeGravityRotateAngle(config.gravityRotateAngle),
    gravityRotateSpin: normalizeGravityRotateSpin(config.gravityRotateSpin),
    gravityRotateEveryTurns: clampInt(config.gravityRotateEveryTurns, 1, 99, DEFAULT_GRAVITY_ROTATE_EVERY_TURNS),
    gravityRotateEveryTurnsPerPlayer: Boolean(config.gravityRotateEveryTurnsPerPlayer),
    roster,
    playerCount,
    eliminateLosers: Boolean(config.eliminateLosers),
    continueRanking: Boolean(config.continueRanking),
    eliminateWinners: typeof config.eliminateWinners === "boolean" ? config.eliminateWinners : DEFAULT_ELIMINATE_WINNERS,
    clockEnabled,
    clockMode,
    clockBankSeconds: clampInt(config.clockBankSeconds, 10, 7200, DEFAULT_CLOCK_BANK_SECONDS),
    clockRecoverSeconds: clampInt(config.clockRecoverSeconds, 0, 600, DEFAULT_CLOCK_RECOVER_SECONDS),
    clockPerTurnSeconds: clampInt(config.clockPerTurnSeconds, 3, 600, DEFAULT_CLOCK_PER_TURN_SECONDS)
  };
}

export function normalizeMoveMode(pieceLimitType: GameConfig["pieceLimitType"], value: PieceMoveMode): PieceMoveMode {
  if (pieceLimitType === "limited") {
    return ["forcedOldest", "limitMoveAny", "limitedFree"].includes(value)
      ? value
      : DEFAULT_LIMITED_PIECE_MOVE_MODE;
  }

  return value === "free" ? value : DEFAULT_UNLIMITED_PIECE_MOVE_MODE;
}

export function getMoveModeOptions(pieceLimitType: GameConfig["pieceLimitType"]): Array<{ value: PieceMoveMode; label: string }> {
  if (pieceLimitType === "limited") {
    return [
      { value: "forcedOldest", label: t("moveModes.limited.forcedOldest") },
      { value: "limitMoveAny", label: t("moveModes.limited.limitMoveAny") },
      { value: "limitedFree", label: t("moveModes.limited.limitedFree") }
    ];
  }

  return [
    { value: "blocked", label: t("moveModes.unlimited.blocked") },
    { value: "free", label: t("moveModes.unlimited.free") }
  ];
}

export function getMoveModeHelp(pieceLimitType: GameConfig["pieceLimitType"]): string {
  if (pieceLimitType === "limited") {
    return t("moveModes.help.limited");
  }

  return t("moveModes.help.unlimited");
}

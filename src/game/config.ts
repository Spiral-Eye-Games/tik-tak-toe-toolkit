import {
  DEFAULT_COLLAPSE_EVERY_TURNS,
  DEFAULT_COLLAPSE_EVERY_UNIT,
  DEFAULT_COLLAPSE_TIMES,
  DEFAULT_COLLAPSE_TYPE,
  DEFAULT_CLOCK_BANK_SECONDS,
  DEFAULT_CLOCK_PER_TURN_SECONDS,
  DEFAULT_CLOCK_RECOVER_SECONDS,
  DEFAULT_BROKEN_HOLE_DURATION_UNIT,
  DEFAULT_BROKEN_HOLE_TURNS,
  DEFAULT_BROKEN_RUPTURE_GRAVITY_COLLISION,
  DEFAULT_GRAVITY_INITIAL_DIRECTION,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  DEFAULT_GRAVITY_ROTATE_EVERY_UNIT,
  DEFAULT_LIMITED_PIECE_MOVE_MODE,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_REMOVE_OUT_OF_GAME_PIECES,
  DEFAULT_RESTRICTION_START_TURNS,
  DEFAULT_RESTRICTION_START_UNIT,
  DEFAULT_ROSTER,
  DEFAULT_SINGLE_WINNER,
  DEFAULT_UNLIMITED_PIECE_MOVE_MODE
} from "./defaults";
import type { ClockMode, CollapseType, GameConfig, GravityDirection, GravityRotateAngle, GravityRotateSpin, IntervalUnit, PieceMoveMode, RosterPlayer } from "./types";
import { t } from "../i18n";
import {
  buildLegacyRestrictionStartBlockedCells,
  movementSupportsConversion,
  normalizeRestrictionMovementMode,
  normalizeRestrictionStartBlockedCells
} from "./restrictions";

export function getDefaultRoster(): RosterPlayer[] {
  return DEFAULT_ROSTER.map((player) => ({ ...player }));
}

function normalizeRoster(rosterInput: RosterPlayer[]): RosterPlayer[] {
  const defaults = getDefaultRoster();
  const byId = new Map(defaults.map((player) => [player.id, player]));
  const seen = new Set<string>();
  const roster = rosterInput
    .map((player) => {
      const fallback = byId.get(player.id);
      if (!fallback || seen.has(player.id)) return null;
      seen.add(player.id);
      return {
        id: fallback.id,
        color: typeof player.color === "string" && player.color.trim().length > 0 ? player.color : fallback.color
      };
    })
    .filter((player): player is RosterPlayer => player !== null);

  for (const fallback of defaults) {
    if (!seen.has(fallback.id)) roster.push(fallback);
  }

  return roster;
}

export function clampInt(value: number, min: number, max: number, fallback: number): number {
  const number = Number.parseInt(String(value), 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function getResolvedBrokenHoleTurns(config: GameConfig): number {
  if (config.brokenHoleUnlimited) return 0;
  let n = config.brokenHoleTurns;
  const durationUnit = normalizeIntervalUnit(config.brokenHoleDurationUnit, DEFAULT_BROKEN_HOLE_DURATION_UNIT);
  if (durationUnit === "rounds") n *= config.playerCount;
  return Math.min(Math.max(0, n), 9999);
}

const GRAVITY_DIRECTIONS: GravityDirection[] = ["down", "up", "left", "right"];
const GRAVITY_ROTATE_ANGLES: GravityRotateAngle[] = ["90", "180", "270", "random"];
const GRAVITY_ROTATE_SPINS: GravityRotateSpin[] = ["cw", "ccw", "random"];
const COLLAPSE_TYPES: CollapseType[] = ["left", "right", "up", "down", "horizontal", "vertical", "circular"];
const INTERVAL_UNITS: IntervalUnit[] = ["turns", "rounds"];

export function normalizeGravityDirection(value: unknown): GravityDirection {
  return GRAVITY_DIRECTIONS.includes(value as GravityDirection) ? (value as GravityDirection) : DEFAULT_GRAVITY_INITIAL_DIRECTION;
}

export function normalizeGravityRotateAngle(value: unknown): GravityRotateAngle {
  return GRAVITY_ROTATE_ANGLES.includes(value as GravityRotateAngle) ? (value as GravityRotateAngle) : "90";
}

export function normalizeGravityRotateSpin(value: unknown): GravityRotateSpin {
  return GRAVITY_ROTATE_SPINS.includes(value as GravityRotateSpin) ? (value as GravityRotateSpin) : "cw";
}

export function normalizeCollapseType(value: unknown): CollapseType {
  return COLLAPSE_TYPES.includes(value as CollapseType) ? (value as CollapseType) : DEFAULT_COLLAPSE_TYPE;
}

export function normalizeIntervalUnit(value: unknown, fallback: IntervalUnit = "turns"): IntervalUnit {
  return INTERVAL_UNITS.includes(value as IntervalUnit) ? (value as IntervalUnit) : fallback;
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
  return config.gravityRotateEveryUnit === "rounds" ? base * config.playerCount : base;
}

/** Effective turn interval for board collapse (0 if disabled or exhausted). */
export function getResolvedCollapseInterval(config: GameConfig): number {
  if (!config.collapseEnabled) return 0;
  const base = clampInt(config.collapseEveryTurns, 1, 99, DEFAULT_COLLAPSE_EVERY_TURNS);
  return config.collapseEveryUnit === "rounds" ? base * config.playerCount : base;
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
  const canUseRankingOptions = playerCount > 2;

  const explicitBrokenUnlimited = typeof config.brokenHoleUnlimited === "boolean";
  const brokenHoleUnlimited = explicitBrokenUnlimited
    ? config.brokenHoleUnlimited
    : config.brokenHoleTurns === 0;
  const brokenHoleTurnsPerPlayer = false;
  const baseBrokenTurnsRaw = !explicitBrokenUnlimited && config.brokenHoleTurns === 0
    ? DEFAULT_BROKEN_HOLE_TURNS
    : config.brokenHoleTurns;
  const brokenHoleTurns = clampInt(baseBrokenTurnsRaw, 1, 99, DEFAULT_BROKEN_HOLE_TURNS);
  const brokenHoleDurationUnit = normalizeIntervalUnit(
    (config as GameConfig & { brokenHoleDurationUnit?: IntervalUnit }).brokenHoleDurationUnit,
    DEFAULT_BROKEN_HOLE_DURATION_UNIT
  );

  const { clockEnabled, clockMode } = resolveClockEnabledAndMode(config);
  const looseConfig = config as GameConfig & {
    gravityRotateEveryTurnsPerPlayer?: boolean;
    collapseEveryTurnsPerPlayer?: boolean;
  };
  const gravityRotateEveryUnit = normalizeIntervalUnit(
    looseConfig.gravityRotateEveryUnit,
    looseConfig.gravityRotateEveryTurnsPerPlayer ? "rounds" : DEFAULT_GRAVITY_ROTATE_EVERY_UNIT
  );
  const collapseEveryUnit = normalizeIntervalUnit(
    looseConfig.collapseEveryUnit,
    looseConfig.collapseEveryTurnsPerPlayer ? "rounds" : DEFAULT_COLLAPSE_EVERY_UNIT
  );
  const restrictionStartUnit = normalizeIntervalUnit(
    config.restrictionStartUnit,
    DEFAULT_RESTRICTION_START_UNIT
  );
  const looseRestrictionConfig = config as GameConfig & {
    restrictionStartZones?: unknown;
    restrictionStartThickness?: unknown;
  };
  const normalizedBlockedCells = normalizeRestrictionStartBlockedCells(
    config.restrictionStartBlockedCells,
    rows,
    columns
  );
  const restrictionStartBlockedCells = normalizedBlockedCells.length > 0
    ? normalizedBlockedCells
    : buildLegacyRestrictionStartBlockedCells(
      rows,
      columns,
      looseRestrictionConfig.restrictionStartZones,
      looseRestrictionConfig.restrictionStartThickness
    );
  const restrictionMovementMode = normalizeRestrictionMovementMode(config.restrictionMovementMode);
  const restrictionMovementConvertEnabled =
    movementSupportsConversion(restrictionMovementMode) && Boolean(config.restrictionMovementConvertEnabled);
  const restrictionMovementEatEnabled =
    !restrictionMovementConvertEnabled && restrictionMovementMode !== "normal" && Boolean(config.restrictionMovementEatEnabled);

  const looseRanking = config as GameConfig & {
    eliminateLosers?: boolean;
    eliminateWinners?: boolean;
    continueRanking?: boolean;
  };

  let removeOutOfGamePieces: boolean;
  if (typeof config.removeOutOfGamePieces === "boolean") {
    removeOutOfGamePieces = config.removeOutOfGamePieces;
  } else {
    const el = looseRanking.eliminateLosers;
    const ew = looseRanking.eliminateWinners;
    if (typeof el === "boolean" || typeof ew === "boolean") {
      removeOutOfGamePieces = Boolean(el || ew);
    } else {
      removeOutOfGamePieces = DEFAULT_REMOVE_OUT_OF_GAME_PIECES;
    }
  }

  let singleWinner: boolean;
  if (typeof config.singleWinner === "boolean") {
    singleWinner = config.singleWinner;
  } else if (typeof looseRanking.continueRanking === "boolean") {
    singleWinner = !looseRanking.continueRanking;
  } else {
    singleWinner = DEFAULT_SINGLE_WINNER;
  }

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
    brokenHoleDurationUnit,
    brokenHoleUnlimited,
    brokenHoleTurnsPerPlayer,
    brokenRuptureGravityCollision: Boolean((config as GameConfig & { brokenRuptureGravityCollision?: boolean }).brokenRuptureGravityCollision ?? DEFAULT_BROKEN_RUPTURE_GRAVITY_COLLISION),
    gravityEnabled: config.gravityEnabled,
    gravityInitialDirection: normalizeGravityDirection(config.gravityInitialDirection),
    gravityRotateEnabled: Boolean(config.gravityRotateEnabled),
    gravityRotateAngle: normalizeGravityRotateAngle(config.gravityRotateAngle),
    gravityRotateSpin: normalizeGravityRotateSpin(config.gravityRotateSpin),
    gravityRotateEveryTurns: clampInt(config.gravityRotateEveryTurns, 1, 99, DEFAULT_GRAVITY_ROTATE_EVERY_TURNS),
    gravityRotateEveryUnit,
    collapseEnabled: Boolean(config.collapseEnabled),
    collapseType: normalizeCollapseType(config.collapseType),
    collapseEveryTurns: clampInt(config.collapseEveryTurns, 1, 99, DEFAULT_COLLAPSE_EVERY_TURNS),
    collapseEveryUnit,
    collapseTimes: clampInt(config.collapseTimes, 1, 99, DEFAULT_COLLAPSE_TIMES),
    collapseKillsPlayers: Boolean(config.collapseKillsPlayers),
    roster,
    playerCount,
    removeOutOfGamePieces: canUseRankingOptions && Boolean(removeOutOfGamePieces),
    singleWinner: canUseRankingOptions && Boolean(singleWinner),
    clockEnabled,
    clockMode,
    clockBankSeconds: clampInt(config.clockBankSeconds, 10, 7200, DEFAULT_CLOCK_BANK_SECONDS),
    clockRecoverSeconds: clampInt(config.clockRecoverSeconds, 0, 600, DEFAULT_CLOCK_RECOVER_SECONDS),
    clockPerTurnSeconds: clampInt(config.clockPerTurnSeconds, 3, 600, DEFAULT_CLOCK_PER_TURN_SECONDS),
    restrictionsEnabled: Boolean(config.restrictionsEnabled),
    restrictionStartTurns: clampInt(config.restrictionStartTurns, 1, 99, DEFAULT_RESTRICTION_START_TURNS),
    restrictionStartUnit,
    restrictionStartBlockedCells,
    restrictionMovementMode,
    restrictionMovementEatEnabled,
    restrictionMovementConvertEnabled,
    skipTurnEnabled: Boolean(config.skipTurnEnabled)
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

export function getMoveModeOptions(
  pieceLimitType: GameConfig["pieceLimitType"]
): Array<{ value: PieceMoveMode; name: string; description: string }> {
  if (pieceLimitType === "limited") {
    return (["forcedOldest", "limitMoveAny", "limitedFree"] as const).map((key) => ({
      value: key,
      name: t(`moveModes.limited.${key}.name`),
      description: t(`moveModes.limited.${key}.description`)
    }));
  }

  return (["blocked", "free"] as const).map((key) => ({
    value: key,
    name: t(`moveModes.unlimited.${key}.name`),
    description: t(`moveModes.unlimited.${key}.description`)
  }));
}

export function getMoveModeHelp(pieceLimitType: GameConfig["pieceLimitType"]): string {
  if (pieceLimitType === "limited") {
    return t("moveModes.help.limited");
  }

  return t("moveModes.help.unlimited");
}

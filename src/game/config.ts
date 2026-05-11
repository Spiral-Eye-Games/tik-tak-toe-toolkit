import {
  DEFAULT_ELIMINATE_WINNERS,
  DEFAULT_LIMITED_PIECE_MOVE_MODE,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_ROSTER,
  DEFAULT_UNLIMITED_PIECE_MOVE_MODE
} from "./defaults";
import type { GameConfig, PieceMoveMode, RosterPlayer } from "./types";
import { t } from "../i18n";

export function normalizeRoster(roster: RosterPlayer[] | undefined): RosterPlayer[] {
  if (!Array.isArray(roster) || roster.length < 2) {
    return DEFAULT_ROSTER.map((r) => ({ ...r }));
  }

  const seen = new Set<string>();
  return roster.map((entry, index) => {
    const emoji = typeof entry.emoji === "string" && entry.emoji.trim() ? entry.emoji.trim() : "🙂";
    let id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `p${index}`;
    while (seen.has(id)) id = `${id}_${index}`;
    seen.add(id);
    return { id, emoji };
  });
}

export function clampInt(value: number, min: number, max: number, fallback: number): number {
  const number = Number.parseInt(String(value), 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
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
    brokenHoleTurns: clampInt(config.brokenHoleTurns, 0, 99, 0),
    gravityEnabled: config.gravityEnabled,
    roster,
    playerCount,
    eliminateLosers: Boolean(config.eliminateLosers),
    continueRanking: Boolean(config.continueRanking),
    eliminateWinners: typeof config.eliminateWinners === "boolean" ? config.eliminateWinners : DEFAULT_ELIMINATE_WINNERS
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

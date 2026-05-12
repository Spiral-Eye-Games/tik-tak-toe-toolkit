import { useEffect, useState } from "react";
import {
  DEFAULT_BROKEN_HOLE_TURNS,
  DEFAULT_CONFIG,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COUNT
} from "../game/defaults";
import { clampInt, normalizeClockStrategy, normalizeMoveMode, normalizeRoster, sanitizeConfig } from "../game/config";
import { loadLastSettings, saveLastSettings } from "../game/sessionCache";
import type { GameConfig, RosterPlayer } from "../game/types";

export function useDraftConfig() {
  const [draftConfig, setDraftConfig] = useState<GameConfig>(
    () => loadLastSettings() ?? sanitizeConfig(DEFAULT_CONFIG)
  );

  useEffect(() => {
    saveLastSettings(draftConfig);
  }, [draftConfig]);

  function updateDraftConfig(patch: Partial<GameConfig>) {
    setDraftConfig((previous) => {
      const next: GameConfig = { ...previous, ...patch };

      if (patch.roster !== undefined) {
        next.roster = normalizeRoster(patch.roster);
        if (next.playerCount > next.roster.length) {
          next.playerCount = next.roster.length;
        }
      }

      if (patch.playerCount !== undefined) {
        next.playerCount = clampInt(
          next.playerCount,
          2,
          Math.max(2, next.roster.length),
          Math.min(DEFAULT_PLAYER_COUNT, next.roster.length)
        );
      }

      if (patch.pieceLimitType !== undefined || patch.pieceMoveMode !== undefined) {
        next.pieceMoveMode = normalizeMoveMode(next.pieceLimitType, next.pieceMoveMode);
      }

      if (next.pieceLimitType === "limited" && next.maxPiecesPerPlayer <= 0) {
        next.maxPiecesPerPlayer = DEFAULT_MAX_PIECES_PER_PLAYER;
      }

      next.columns = clampInt(next.columns, 3, 12, DEFAULT_CONFIG.columns);
      next.rows = clampInt(next.rows, 3, 12, DEFAULT_CONFIG.rows);
      next.lineLength = clampInt(next.lineLength, 2, Math.max(next.columns, next.rows), DEFAULT_CONFIG.lineLength);
      next.maxPiecesPerPlayer = next.pieceLimitType === "unlimited"
        ? next.maxPiecesPerPlayer
        : clampInt(next.maxPiecesPerPlayer, 1, 99, DEFAULT_MAX_PIECES_PER_PLAYER);
      next.brokenHoleTurns = clampInt(next.brokenHoleTurns, 1, 99, DEFAULT_BROKEN_HOLE_TURNS);
      next.gravityRotateEveryTurns = clampInt(
        next.gravityRotateEveryTurns,
        1,
        99,
        DEFAULT_GRAVITY_ROTATE_EVERY_TURNS
      );

      next.clockEnabled = Boolean(next.clockEnabled);
      next.clockMode = normalizeClockStrategy(next.clockMode);

      return next;
    });
  }

  function applyRoster(nextRoster: RosterPlayer[]) {
    updateDraftConfig({ roster: nextRoster });
  }

  function sanitizeDraftConfig() {
    const nextConfig = sanitizeConfig(draftConfig);
    setDraftConfig(nextConfig);
    return nextConfig;
  }

  function replaceDraftConfig(config: GameConfig) {
    const nextConfig = sanitizeConfig(config);
    setDraftConfig(nextConfig);
    return nextConfig;
  }

  return {
    draftConfig,
    updateDraftConfig,
    applyRoster,
    sanitizeDraftConfig,
    replaceDraftConfig
  };
}

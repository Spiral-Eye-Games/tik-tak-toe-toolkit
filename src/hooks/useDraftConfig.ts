import { useEffect, useState } from "react";
import {
  DEFAULT_CONFIG,
  DEFAULT_BROKEN_HOLE_TURNS,
  DEFAULT_COLLAPSE_EVERY_TURNS,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_RESTRICTION_START_TURNS
} from "../game/defaults";
import { clampInt, getDefaultRoster, normalizeClockStrategy, normalizeCollapseType, normalizeIntervalUnit, normalizeMoveMode, sanitizeConfig } from "../game/config";
import { movementSupportsConversion, normalizeRestrictionMovementMode, normalizeRestrictionStartBlockedCells } from "../game/restrictions";
import { loadLastSettings, saveLastSettings } from "../game/sessionCache";
import type { GameConfig } from "../game/types";

export function useDraftConfig() {
  const [draftConfig, setDraftConfig] = useState<GameConfig>(
    () => sanitizeConfig(loadLastSettings() ?? DEFAULT_CONFIG)
  );

  useEffect(() => {
    saveLastSettings(draftConfig);
  }, [draftConfig]);

  function updateDraftConfig(patch: Partial<GameConfig>) {
    setDraftConfig((previous) => {
      const next: GameConfig = { ...previous, ...patch };

      if (patch.roster !== undefined) {
        next.roster = getDefaultRoster();
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

      if (next.playerCount <= 2) {
        next.eliminateLosers = false;
        next.continueRanking = false;
        next.eliminateWinners = false;
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
      next.gravityRotateEveryUnit = normalizeIntervalUnit(next.gravityRotateEveryUnit, DEFAULT_CONFIG.gravityRotateEveryUnit);
      next.collapseEnabled = Boolean(next.collapseEnabled);
      next.collapseType = normalizeCollapseType(next.collapseType);
      next.collapseEveryTurns = clampInt(next.collapseEveryTurns, 1, 99, DEFAULT_COLLAPSE_EVERY_TURNS);
      next.collapseEveryUnit = normalizeIntervalUnit(next.collapseEveryUnit, DEFAULT_CONFIG.collapseEveryUnit);
      next.collapseTimes = clampInt(next.collapseTimes, 1, 99, DEFAULT_CONFIG.collapseTimes);
      next.clockBankSeconds = clampInt(next.clockBankSeconds, 10, 7200, DEFAULT_CONFIG.clockBankSeconds);
      next.clockRecoverSeconds = clampInt(next.clockRecoverSeconds, 0, 600, DEFAULT_CONFIG.clockRecoverSeconds);
      next.clockPerTurnSeconds = clampInt(next.clockPerTurnSeconds, 3, 600, DEFAULT_CONFIG.clockPerTurnSeconds);
      next.restrictionsEnabled = Boolean(next.restrictionsEnabled);
      next.restrictionStartTurns = clampInt(
        next.restrictionStartTurns,
        1,
        99,
        DEFAULT_RESTRICTION_START_TURNS
      );
      next.restrictionStartUnit = normalizeIntervalUnit(next.restrictionStartUnit, DEFAULT_CONFIG.restrictionStartUnit);
      next.restrictionStartBlockedCells = normalizeRestrictionStartBlockedCells(
        next.restrictionStartBlockedCells,
        next.rows,
        next.columns
      );
      next.restrictionMovementMode = normalizeRestrictionMovementMode(next.restrictionMovementMode);
      if (next.restrictionMovementMode === "normal") {
        next.restrictionMovementEatEnabled = false;
        next.restrictionMovementConvertEnabled = false;
      }
      if (!movementSupportsConversion(next.restrictionMovementMode)) {
        next.restrictionMovementConvertEnabled = false;
      }
      if (next.restrictionMovementConvertEnabled) {
        next.restrictionMovementEatEnabled = false;
      }

      return next;
    });
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
    sanitizeDraftConfig,
    replaceDraftConfig
  };
}

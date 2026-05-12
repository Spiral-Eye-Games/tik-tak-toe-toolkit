import { getResolvedCollapseInterval, getResolvedGravityRotateInterval } from "./config";
import { getResolvedRestrictionStartTurns, isRestrictionStartActive } from "./restrictions";
import type { GameConfig, GameSnapshot, IntervalUnit } from "./types";

export type BoardEventCountdownKind = "collapse" | "gravity" | "restrictionStart";

export interface BoardEventCountdown {
  kind: BoardEventCountdownKind;
  remainingTurns: number;
  displayAmount: number;
  displayUnit: IntervalUnit;
}

function getRemainingTurnsUntilNextInterval(turnNumber: number, interval: number): number {
  if (interval <= 0) return 0;
  const remainder = turnNumber % interval;
  return remainder === 0 ? interval : interval - remainder;
}

function buildCountdown(kind: BoardEventCountdownKind, remainingTurns: number, unit: IntervalUnit, config: GameConfig): BoardEventCountdown {
  return {
    kind,
    remainingTurns,
    displayAmount: unit === "rounds"
      ? Math.max(1, Math.ceil(remainingTurns / config.playerCount))
      : remainingTurns,
    displayUnit: unit
  };
}

export function getBoardEventCountdowns(snapshot: GameSnapshot, config: GameConfig): BoardEventCountdown[] {
  if (snapshot.gameOver) return [];

  const countdowns: BoardEventCountdown[] = [];

  if (config.collapseEnabled && snapshot.collapseCount < config.collapseTimes) {
    const interval = getResolvedCollapseInterval(config);
    if (interval > 0) {
      countdowns.push(buildCountdown(
        "collapse",
        getRemainingTurnsUntilNextInterval(snapshot.turnNumber, interval),
        config.collapseEveryUnit,
        config
      ));
    }
  }

  if (config.gravityEnabled && config.gravityRotateEnabled) {
    const interval = getResolvedGravityRotateInterval(config);
    if (interval > 0) {
      countdowns.push(buildCountdown(
        "gravity",
        snapshot.pendingGravityRotationTarget === null
          ? getRemainingTurnsUntilNextInterval(snapshot.turnNumber, interval)
          : 0,
        config.gravityRotateEveryUnit,
        config
      ));
    }
  }

  if (isRestrictionStartActive(snapshot, config)) {
    const releaseInTurns = getResolvedRestrictionStartTurns(config) - snapshot.turnNumber;
    if (releaseInTurns > 0) {
      countdowns.push(buildCountdown(
        "restrictionStart",
        releaseInTurns,
        config.restrictionStartUnit,
        config
      ));
    }
  }

  return countdowns;
}

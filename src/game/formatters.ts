import { getResolvedBrokenHoleTurns, getResolvedCollapseInterval, getResolvedGravityRotateInterval } from "./config";
import { findPiecePosition } from "./board";
import { getResolvedRestrictionStartTurns } from "./restrictions";
import { t } from "../i18n";
import type { GameConfig, GameEndSummary, GameSnapshot, GravityDirection, Piece, PlayerIconId, PlayerId } from "./types";

export { findPiecePosition };

export function getGravityArrowSymbol(direction: GravityDirection): string {
  switch (direction) {
    case "down":
      return t("ui.gravityArrows.down");
    case "up":
      return t("ui.gravityArrows.up");
    case "left":
      return t("ui.gravityArrows.left");
    case "right":
      return t("ui.gravityArrows.right");
    default:
      return t("ui.gravityArrows.down");
  }
}

export function getPlayerMark(config: GameConfig, id: PlayerId): { icon: PlayerIconId; color: string } {
  const found = config.roster.find((player) => player.id === id);
  if (!found) return { icon: "circle", color: "var(--text)" };
  return { icon: found.id, color: found.color };
}

export function getPlayerLabel(config: GameConfig, id: PlayerId): string {
  const index = config.roster.findIndex((player) => player.id === id);
  if (index < 0) return t("players.unknown");
  return t("players.label", { number: index + 1 });
}

export function getColumnLetter(col: number): string {
  let label = "";
  let n = col;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function getPieceOrder(snapshot: GameSnapshot, piece: Piece): string {
  const history = snapshot.pieceHistory[piece.owner];
  const index = history ? history.indexOf(piece.id) : -1;
  return index >= 0 ? String(index + 1) : "?";
}

export function getPieceMoveModeText(config: GameConfig): string {
  switch (config.pieceMoveMode) {
    case "forcedOldest": return t("rules.moveModeText.forcedOldest");
    case "limitMoveAny": return t("rules.moveModeText.limitMoveAny");
    case "limitedFree": return t("rules.moveModeText.limitedFree");
    case "blocked": return t("rules.moveModeText.blocked");
    case "free": return t("rules.moveModeText.free");
    default: return t("rules.moveModeText.unknown");
  }
}

export function getRestrictionMovementModeText(config: GameConfig): string {
  return t(`rules.restrictions.movement.${config.restrictionMovementMode}`);
}

function buildList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function buildRulesSection(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `<section class="rules-current-section"><h3>${title}</h3>${buildList(items)}</section>`;
}

function getIntervalText(amount: number, unit: "turns" | "rounds", turns: number): string {
  return unit === "rounds"
    ? t("rules.interval.rounds", { amount, turns })
    : t("rules.interval.turns", { amount });
}

export function buildRulesHtml(config: GameConfig): string {
  const boardItems = [
    t("rules.current.boardSize", { columns: config.columns, rows: config.rows }),
    config.lineRule === "lose"
      ? t("rules.current.objectiveLose", { lineLength: config.lineLength })
      : t("rules.current.objectiveWin", { lineLength: config.lineLength })
  ];

  const pieceItems = [
    config.pieceLimitType === "unlimited"
      ? t("rules.current.piecesUnlimited")
      : t("rules.current.piecesLimited", { maxPieces: config.maxPiecesPerPlayer })
  ];

  if (config.pieceMoveMode !== "blocked") {
    pieceItems.push(t(`rules.current.moveMode.${config.pieceMoveMode}`));
  }

  if (config.pieceMoveMode !== "blocked" && config.restrictionMovementMode !== "normal") {
    pieceItems.push(t("rules.current.movementPattern", {
      movement: getRestrictionMovementModeText(config)
    }));

    if (config.restrictionMovementEatEnabled) {
      pieceItems.push(t("rules.current.movementEat"));
    } else if (config.restrictionMovementConvertEnabled) {
      pieceItems.push(t("rules.current.movementConvert"));
    }
  }

  const playerItems = [
    t("rules.current.playerCount", { players: config.playerCount })
  ];

  if (config.playerCount > 2 && config.lineRule === "lose" && config.eliminateLosers) {
    playerItems.push(t("rules.current.eliminateLosers"));
  }

  if (config.playerCount > 2 && config.lineRule === "win" && config.continueRanking) {
    playerItems.push(t("rules.current.continueRanking"));
    if (config.eliminateWinners) {
      playerItems.push(t("rules.current.eliminateWinners"));
    }
  }

  const mechanicItems: string[] = [];

  if (config.brokenEnabled) {
    const resolvedBrokenTurns = getResolvedBrokenHoleTurns(config);
    mechanicItems.push(resolvedBrokenTurns === 0
      ? t("rules.current.brokenUntilEnd")
      : t("rules.current.brokenForTurns", { turns: resolvedBrokenTurns }));
  }

  if (config.gravityEnabled) {
    mechanicItems.push(t("rules.current.gravityDirection", {
      direction: t(`rules.gravity.direction.${config.gravityInitialDirection}`)
    }));

    if (config.gravityRotateEnabled) {
      const gravityIntervalText = getIntervalText(
        config.gravityRotateEveryTurns,
        config.gravityRotateEveryUnit,
        getResolvedGravityRotateInterval(config)
      );
      mechanicItems.push(t("rules.current.gravityRotation", {
        intervalText: gravityIntervalText,
        angle: t(`rules.gravity.rotateAngle.${config.gravityRotateAngle}`),
        spin: t(`rules.gravity.rotateSpin.${config.gravityRotateSpin}`)
      }));
    }
  }

  if (config.clockEnabled) {
    mechanicItems.push(config.clockMode === "bank"
      ? config.clockRecoverSeconds > 0
        ? t("rules.current.clockBankWithRecover", {
          total: config.clockBankSeconds,
          recover: config.clockRecoverSeconds
        })
        : t("rules.current.clockBank", { total: config.clockBankSeconds })
      : t("rules.current.clockPerTurn", { seconds: config.clockPerTurnSeconds }));
  }

  if (config.restrictionsEnabled && config.restrictionStartBlockedCells.length > 0) {
    mechanicItems.push(t("rules.current.restrictionStart", {
      cells: config.restrictionStartBlockedCells.length,
      turns: getResolvedRestrictionStartTurns(config)
    }));
  }

  if (config.collapseEnabled) {
    const collapseIntervalText = getIntervalText(
      config.collapseEveryTurns,
      config.collapseEveryUnit,
      getResolvedCollapseInterval(config)
    );
    mechanicItems.push(t("rules.current.collapse", {
      type: t(`rules.collapse.type.${config.collapseType}`),
      intervalText: collapseIntervalText,
      times: config.collapseTimes
    }));

    if (config.collapseKillsPlayers) {
      mechanicItems.push(t("rules.current.collapseKills"));
    }
  }

  return `<div class="rules-current"><p>${t("rules.current.intro")}</p>${
    buildRulesSection(t("rules.current.boardTitle"), boardItems)
  }${
    buildRulesSection(t("rules.current.piecesTitle"), pieceItems)
  }${
    buildRulesSection(t("rules.current.playersTitle"), playerItems)
  }${
    buildRulesSection(t("rules.current.mechanicsTitle"), mechanicItems)
  }</div>`;
}

export function buildRulesText(config: GameConfig): string {
  const lineText = config.lineRule === "lose" ? t("rules.lineRule.lose") : t("rules.lineRule.win");

  const piecesText = config.pieceLimitType === "unlimited"
    ? t("rules.pieces.unlimited")
    : t("rules.pieces.limited", { maxPieces: config.maxPiecesPerPlayer });

  const moveText = getPieceMoveModeText(config);

  const resolvedBrokenTurns = getResolvedBrokenHoleTurns(config);
  const brokenText = !config.brokenEnabled
    ? t("rules.broken.disabled")
    : resolvedBrokenTurns === 0
      ? t("rules.broken.untilEnd")
      : t("rules.broken.forTurns", { turns: resolvedBrokenTurns });

  const gravityIntervalText = config.gravityRotateEveryUnit === "rounds"
    ? t("rules.interval.rounds", {
      amount: config.gravityRotateEveryTurns,
      turns: getResolvedGravityRotateInterval(config)
    })
    : t("rules.interval.turns", { amount: config.gravityRotateEveryTurns });

  const gravityText = !config.gravityEnabled
    ? t("rules.gravity.disabled")
    : config.gravityRotateEnabled
      ? t("rules.gravity.enabledWithRotation", {
        direction: t(`rules.gravity.direction.${config.gravityInitialDirection}`),
        intervalText: gravityIntervalText,
        angle: t(`rules.gravity.rotateAngle.${config.gravityRotateAngle}`),
        spin: t(`rules.gravity.rotateSpin.${config.gravityRotateSpin}`)
      })
      : t("rules.gravity.enabledDirected", {
        direction: t(`rules.gravity.direction.${config.gravityInitialDirection}`)
      });

  const clockText =
    !config.clockEnabled
      ? t("rules.clock.disabled")
      : config.clockMode === "bank"
        ? config.clockRecoverSeconds > 0
          ? t("rules.clock.bankWithRecover", {
            total: config.clockBankSeconds,
            recover: config.clockRecoverSeconds
          })
          : t("rules.clock.bankNoRecover", { total: config.clockBankSeconds })
        : t("rules.clock.perTurn", { seconds: config.clockPerTurnSeconds });

  const hasStartRestriction = config.restrictionStartBlockedCells.length > 0;
  const restrictionsText = !config.restrictionsEnabled
    ? t("rules.restrictions.disabled")
    : t("rules.restrictions.enabled", {
      startText: hasStartRestriction
        ? t("rules.restrictions.startEnabled", {
          turns: getResolvedRestrictionStartTurns(config),
          cells: config.restrictionStartBlockedCells.length
        })
        : t("rules.restrictions.startDisabled")
    });
  const movementLimitText = config.pieceMoveMode === "blocked" || config.restrictionMovementMode === "normal"
    ? t("rules.movementLimit.normal")
    : t("rules.movementLimit.enabled", {
      movementText: getRestrictionMovementModeText(config)
    });

  const collapseIntervalText = config.collapseEveryUnit === "rounds"
    ? t("rules.interval.rounds", {
      amount: config.collapseEveryTurns,
      turns: getResolvedCollapseInterval(config)
    })
    : t("rules.interval.turns", { amount: config.collapseEveryTurns });

  const collapseText = !config.collapseEnabled
    ? t("rules.collapse.disabled")
    : t("rules.collapse.enabled", {
      type: t(`rules.collapse.type.${config.collapseType}`),
      intervalText: collapseIntervalText,
      times: config.collapseTimes,
      killsText: config.collapseKillsPlayers ? t("rules.collapse.kills") : t("rules.collapse.noKills")
    });

  return t("rules.summary", {
    columns: config.columns,
    rows: config.rows,
    lineText,
    lineLength: config.lineLength,
    piecesText,
    moveText,
    movementLimitText,
    brokenText,
    gravityText,
    clockText,
    restrictionsText,
    collapseText
  });
}

export function getStatusText(snapshot: GameSnapshot, config: GameConfig, mustMovePiece: (snapshot: GameSnapshot, config: GameConfig) => boolean): string {
  if (snapshot.statusMessage) return snapshot.statusMessage;

  if (snapshot.pendingGravityRotationTarget !== null && config.gravityEnabled && config.gravityRotateEnabled) {
    return t("status.gravityRotationPause");
  }

  const currentLabel = getPlayerLabel(config, snapshot.currentPlayer);

  if (snapshot.selectedPieceId !== null) {
    const selectedPosition = findPiecePosition(snapshot.board, snapshot.selectedPieceId);
    const selectedPiece = selectedPosition ? snapshot.board[selectedPosition.row][selectedPosition.col].piece : null;
    const order = selectedPiece ? getPieceOrder(snapshot, selectedPiece) : "?";

    return t("status.moving", {
      currentPlayer: currentLabel,
      order
    });
  }

  if (mustMovePiece(snapshot, config)) {
    if (config.pieceMoveMode === "forcedOldest") {
      return t("status.turnForcedFirst", { currentPlayer: currentLabel });
    }
    return t("status.turnMustMove", { currentPlayer: currentLabel });
  }

  return t("status.turn", { currentPlayer: currentLabel });
}

export function victoryModalShowsRanking(config: GameConfig, summary: GameEndSummary): boolean {
  if (summary.type !== "ranking" || summary.orderedIds.length <= 1) return false;
  if (config.lineRule === "lose") {
    return config.playerCount > 2;
  }
  return config.continueRanking;
}

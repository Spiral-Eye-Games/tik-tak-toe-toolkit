import { getResolvedCollapseInterval } from "./config";
import { getPlayerLabel } from "./formatters";
import { getNextTurnAfterPlayerRemoved } from "./turns";
import { t } from "../i18n";
import type { BoardPosition, GameConfig, GameSnapshot, PlayerId } from "./types";

export function shouldApplyCollapse(snapshot: GameSnapshot, config: GameConfig): boolean {
  const interval = getResolvedCollapseInterval(config);
  return interval > 0 && snapshot.collapseCount < config.collapseTimes && snapshot.turnNumber % interval === 0;
}

export function applyCollapseIfDue(snapshot: GameSnapshot, config: GameConfig): void {
  if (!shouldApplyCollapse(snapshot, config)) return;

  const beforeCounts = countPiecesByActivePlayer(snapshot, config);
  const positions = getCollapsePositions(config, snapshot.collapseCount);

  for (const position of positions) {
    const cell = snapshot.board[position.row]?.[position.col];
    if (!cell) continue;
    cell.piece = null;
    cell.brokenTurns = 0;
    cell.brokenCreatedOnTurn = snapshot.turnNumber;
  }

  rebuildPieceHistoryFromBoard(snapshot);
  snapshot.selectedPieceId = null;
  snapshot.collapseCount++;

  if (config.collapseKillsPlayers) {
    eliminatePlayersLeftWithoutPieces(snapshot, config, beforeCounts);
  }
}

export function getNextCollapsePositions(snapshot: GameSnapshot, config: GameConfig): BoardPosition[] {
  if (!config.collapseEnabled || snapshot.gameOver || snapshot.collapseCount >= config.collapseTimes) return [];
  return getCollapsePositions(config, snapshot.collapseCount);
}

export function isNextCollapsePosition(snapshot: GameSnapshot, config: GameConfig, row: number, col: number): boolean {
  return getNextCollapsePositions(snapshot, config).some((position) => position.row === row && position.col === col);
}

function getCollapsePositions(config: GameConfig, layer: number): BoardPosition[] {
  const positions: BoardPosition[] = [];
  const add = (row: number, col: number) => {
    if (row < 0 || row >= config.rows || col < 0 || col >= config.columns) return;
    if (positions.some((position) => position.row === row && position.col === col)) return;
    positions.push({ row, col });
  };

  const left = layer;
  const right = config.columns - 1 - layer;
  const top = layer;
  const bottom = config.rows - 1 - layer;

  switch (config.collapseType) {
    case "left":
      for (let row = 0; row < config.rows; row++) add(row, left);
      break;
    case "right":
      for (let row = 0; row < config.rows; row++) add(row, right);
      break;
    case "up":
      for (let col = 0; col < config.columns; col++) add(top, col);
      break;
    case "down":
      for (let col = 0; col < config.columns; col++) add(bottom, col);
      break;
    case "horizontal":
      for (let row = 0; row < config.rows; row++) {
        add(row, left);
        add(row, right);
      }
      break;
    case "vertical":
      for (let col = 0; col < config.columns; col++) {
        add(top, col);
        add(bottom, col);
      }
      break;
    case "circular":
      for (let col = left; col <= right; col++) {
        add(top, col);
        add(bottom, col);
      }
      for (let row = top + 1; row < bottom; row++) {
        add(row, left);
        add(row, right);
      }
      break;
    default:
      break;
  }

  return positions;
}

function countPiecesByActivePlayer(snapshot: GameSnapshot, config: GameConfig): Record<PlayerId, number> {
  const counts = Object.fromEntries(snapshot.activePlayerIds.map((id) => [id, 0])) as Record<PlayerId, number>;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.columns; col++) {
      const owner = snapshot.board[row][col].piece?.owner;
      if (owner !== undefined && counts[owner] !== undefined) counts[owner]++;
    }
  }

  return counts;
}

function rebuildPieceHistoryFromBoard(snapshot: GameSnapshot): void {
  const livingIdsByPlayer = new Map<PlayerId, Set<number>>();

  for (const row of snapshot.board) {
    for (const cell of row) {
      if (!cell.piece) continue;
      const ids = livingIdsByPlayer.get(cell.piece.owner) ?? new Set<number>();
      ids.add(cell.piece.id);
      livingIdsByPlayer.set(cell.piece.owner, ids);
    }
  }

  for (const playerId of Object.keys(snapshot.pieceHistory)) {
    const livingIds = livingIdsByPlayer.get(playerId) ?? new Set<number>();
    snapshot.pieceHistory[playerId] = snapshot.pieceHistory[playerId].filter((pieceId) => livingIds.has(pieceId));
  }
}

function eliminatePlayersLeftWithoutPieces(
  snapshot: GameSnapshot,
  config: GameConfig,
  beforeCounts: Record<PlayerId, number>
): void {
  const afterCounts = countPiecesByActivePlayer(snapshot, config);
  const eliminatedIds = snapshot.activePlayerIds.filter((id) => beforeCounts[id] > 0 && afterCounts[id] === 0);
  if (eliminatedIds.length === 0) return;

  const oldActive = [...snapshot.activePlayerIds];
  snapshot.eliminationOrderLose.push(...eliminatedIds);
  snapshot.activePlayerIds = oldActive.filter((id) => !eliminatedIds.includes(id));
  snapshot.lineCells = [];

  if (snapshot.activePlayerIds.length === 0) {
    snapshot.gameOver = true;
    if (snapshot.placementOrderWin.length > 0) {
      snapshot.gameEndSummary = {
        type: "ranking",
        orderedIds: buildCollapseRanking(snapshot)
      };
      snapshot.statusMessage = t("gameOver.rankingComplete");
    } else {
      snapshot.gameEndSummary = { type: "draw" };
      snapshot.statusMessage = t("gameOver.draw");
    }
    return;
  }

  if (snapshot.activePlayerIds.length === 1) {
    const champ = snapshot.activePlayerIds[0];
    snapshot.gameOver = true;
    if (config.playerCount > 2) {
      snapshot.gameEndSummary = {
        type: "ranking",
        orderedIds: buildCollapseRanking(snapshot)
      };
      snapshot.statusMessage = snapshot.placementOrderWin.length > 0
        ? t("gameOver.rankingComplete")
        : t("gameOver.survivorWin", { player: getPlayerLabel(config, champ) });
    } else {
      const loserId = eliminatedIds[0];
      snapshot.gameEndSummary = { type: "winner", winnerId: champ, loserId, endKind: "collapse" };
      snapshot.statusMessage = t("gameOver.collapseOut", {
        loser: getPlayerLabel(config, loserId),
        winner: getPlayerLabel(config, champ)
      });
    }
    return;
  }

  if (eliminatedIds.includes(snapshot.currentPlayer)) {
    snapshot.currentPlayer = getNextTurnAfterPlayerRemoved(oldActive, snapshot.currentPlayer);
  }
}

function buildCollapseRanking(snapshot: GameSnapshot): PlayerId[] {
  const orderedIds = [
    ...snapshot.placementOrderWin,
    ...snapshot.activePlayerIds,
    ...[...snapshot.eliminationOrderLose].reverse()
  ];
  return orderedIds.filter((id, index) => orderedIds.indexOf(id) === index);
}

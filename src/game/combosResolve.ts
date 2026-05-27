import { isBroken } from "./brokenHoles";
import {
  buildCombosClusters,
  choosePivotForCluster,
  findCombosSegments,
  specialKindForTier
} from "./combosDetect";
import { applyGravity } from "./gravity";
import type { BoardPosition, GameConfig, GameSnapshot, PlayerId } from "./types";

function expandBombArea(config: GameConfig, pivot: BoardPosition): BoardPosition[] {
  const out: BoardPosition[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = pivot.row + dr;
      const col = pivot.col + dc;
      if (row >= 0 && row < config.rows && col >= 0 && col < config.columns) {
        out.push({ row, col });
      }
    }
  }
  return out;
}

function expandStarCross(config: GameConfig, pivot: BoardPosition): BoardPosition[] {
  const out: BoardPosition[] = [];
  for (let col = 0; col < config.columns; col++) out.push({ row: pivot.row, col });
  for (let row = 0; row < config.rows; row++) {
    if (row !== pivot.row) out.push({ row, col: pivot.col });
  }
  return out;
}

function removePieceAt(snapshot: GameSnapshot, pos: BoardPosition): boolean {
  const cell = snapshot.board[pos.row][pos.col];
  const piece = cell.piece;
  if (!piece || isBroken(cell)) return false;
  cell.piece = null;
  const hist = snapshot.pieceHistory[piece.owner];
  const ix = hist?.indexOf(piece.id) ?? -1;
  if (ix >= 0) hist.splice(ix, 1);
  return true;
}

export function awardCombosPoints(snapshot: GameSnapshot, playerId: PlayerId, points: number): void {
  if (points <= 0) return;
  snapshot.combosScores[playerId] = (snapshot.combosScores[playerId] ?? 0) + points;
}

/**
 * Resuelve olas de matches HV hasta estabilizar: borrado simultáneo por ola, puntos al iniciador de la cascada y gravedad entre olas.
 */
export function runCombosCascadeUntilStable(
  snapshot: GameSnapshot,
  config: GameConfig,
  placementHint: BoardPosition | null,
  creditPlayer: PlayerId
): void {
  let hint = placementHint;
  const maxIterations = config.rows * config.columns * 24;
  for (let iter = 0; iter < maxIterations; iter++) {
    const segments = findCombosSegments(snapshot.board, config);
    if (segments.length === 0) break;

    const clusters = buildCombosClusters(segments);
    const clearKeys = new Set<string>();

    for (const cluster of clusters) {
      const pivot = choosePivotForCluster(cluster, hint);
      const special = specialKindForTier(cluster.tier, config.combosSpecials);
      for (const cell of cluster.cells) clearKeys.add(`${cell.row},${cell.col}`);
      if (special === "bomb") {
        for (const p of expandBombArea(config, pivot)) clearKeys.add(`${p.row},${p.col}`);
      } else if (special === "star") {
        for (const p of expandStarCross(config, pivot)) clearKeys.add(`${p.row},${p.col}`);
      }
    }

    hint = null;

    let clearedPieces = 0;
    for (const key of clearKeys) {
      const [rs, cs] = key.split(",");
      const row = Number(rs);
      const col = Number(cs);
      if (!Number.isFinite(row) || !Number.isFinite(col)) continue;
      if (removePieceAt(snapshot, { row, col })) clearedPieces++;
    }

    awardCombosPoints(snapshot, creditPlayer, clearedPieces);

    if (config.gravityEnabled) {
      applyGravity(snapshot.board, config, snapshot.gravityDirection, snapshot);
    }
  }
}

import { isBroken } from "./brokenHoles";
import type { Board, BoardPosition, GameConfig, PlayerId } from "./types";

export interface CombosSegment {
  cells: BoardPosition[];
  owner: PlayerId;
  orientation: "h" | "v";
}

export interface CombosCluster {
  segments: CombosSegment[];
  cells: BoardPosition[];
  owner: PlayerId;
  maxSegmentLength: number;
  hasHorizontal: boolean;
  hasVertical: boolean;
  tier: 3 | 4 | 5;
}

function pieceOwner(board: Board, row: number, col: number): PlayerId | null {
  const cell = board[row]?.[col];
  if (!cell || isBroken(cell) || cell.piece === null) return null;
  return cell.piece.owner;
}

export function findCombosSegments(board: Board, config: GameConfig): CombosSegment[] {
  const { rows, columns } = config;
  const segments: CombosSegment[] = [];

  for (let row = 0; row < rows; row++) {
    let col = 0;
    while (col < columns) {
      const owner = pieceOwner(board, row, col);
      if (owner === null) {
        col++;
        continue;
      }
      const start = col;
      while (col < columns && pieceOwner(board, row, col) === owner) col++;
      const len = col - start;
      if (len >= 3) {
        const cells: BoardPosition[] = [];
        for (let k = start; k < start + len; k++) cells.push({ row, col: k });
        segments.push({ cells, owner, orientation: "h" });
      }
    }
  }

  for (let col = 0; col < columns; col++) {
    let row = 0;
    while (row < rows) {
      const owner = pieceOwner(board, row, col);
      if (owner === null) {
        row++;
        continue;
      }
      const start = row;
      while (row < rows && pieceOwner(board, row, col) === owner) row++;
      const len = row - start;
      if (len >= 3) {
        const cells: BoardPosition[] = [];
        for (let k = start; k < start + len; k++) cells.push({ row: k, col });
        segments.push({ cells, owner, orientation: "v" });
      }
    }
  }

  return segments;
}

function cellKey(p: BoardPosition): string {
  return `${p.row},${p.col}`;
}

export function buildCombosClusters(segments: CombosSegment[]): CombosCluster[] {
  const n = segments.length;
  if (n === 0) return [];

  const parent = segments.map((_, i) => i);
  function find(i: number): number {
    return parent[i] === i ? i : (parent[i] = find(parent[i]));
  }
  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }

  const cellToSegIndices = new Map<string, number[]>();
  segments.forEach((seg, si) => {
    for (const cell of seg.cells) {
      const k = cellKey(cell);
      const arr = cellToSegIndices.get(k) ?? [];
      arr.push(si);
      cellToSegIndices.set(k, arr);
    }
  });

  for (const indices of cellToSegIndices.values()) {
    for (let i = 1; i < indices.length; i++) union(indices[0], indices[i]);
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const arr = groups.get(root) ?? [];
    arr.push(i);
    groups.set(root, arr);
  }

  const clusters: CombosCluster[] = [];
  for (const idxs of groups.values()) {
    const segs = idxs.map((i) => segments[i]);
    const owner = segs[0].owner;
    const cellMap = new Map<string, BoardPosition>();
    for (const seg of segs) {
      for (const cell of seg.cells) cellMap.set(cellKey(cell), cell);
    }
    const cells = [...cellMap.values()].sort((a, b) => a.row - b.row || a.col - b.col);

    let maxSegmentLength = 0;
    let hasHorizontal = false;
    let hasVertical = false;
    for (const seg of segs) {
      maxSegmentLength = Math.max(maxSegmentLength, seg.cells.length);
      if (seg.orientation === "h") hasHorizontal = true;
      if (seg.orientation === "v") hasVertical = true;
    }

    const uniqSize = cells.length;
    const tier5 = maxSegmentLength >= 5 || (hasHorizontal && hasVertical && uniqSize >= 5);
    let tier: 3 | 4 | 5 = 3;
    if (tier5) tier = 5;
    else if (maxSegmentLength >= 4) tier = 4;

    clusters.push({
      segments: segs,
      cells,
      owner,
      maxSegmentLength,
      hasHorizontal,
      hasVertical,
      tier
    });
  }

  return clusters;
}

export function choosePivotForCluster(cluster: CombosCluster, placementHint: BoardPosition | null): BoardPosition {
  const contains = (p: BoardPosition) => cluster.cells.some((c) => c.row === p.row && c.col === p.col);
  if (placementHint && contains(placementHint)) return placementHint;

  const intersectionCells = cluster.cells.filter((cell) => {
    const k = cellKey(cell);
    const touchesH = cluster.segments.some((s) => s.orientation === "h" && s.cells.some((x) => cellKey(x) === k));
    const touchesV = cluster.segments.some((s) => s.orientation === "v" && s.cells.some((x) => cellKey(x) === k));
    return touchesH && touchesV;
  });

  const candidates =
    intersectionCells.length > 0
      ? [...intersectionCells].sort((a, b) => a.row - b.row || a.col - b.col)
      : [...cluster.cells].sort((a, b) => a.row - b.row || a.col - b.col);

  return candidates[0];
}

export function specialKindForTier(
  tier: 3 | 4 | 5,
  specials: GameConfig["combosSpecials"]
): "none" | "bomb" | "star" {
  if (tier >= 5) {
    if (specials.includes("star")) return "star";
    if (specials.includes("bomb")) return "bomb";
    return "none";
  }
  if (tier === 4) {
    if (specials.includes("bomb")) return "bomb";
    if (specials.includes("star")) return "star";
    return "none";
  }
  return "none";
}

import { describe, expect, it } from "vitest";
import { createEmptyCell } from "./board";
import { buildCombosClusters, findCombosSegments } from "./combosDetect";
import { sanitizeConfig } from "./config";
import { DEFAULT_CONFIG } from "./defaults";
import type { Board, Piece } from "./types";

function cfg(overrides: Partial<typeof DEFAULT_CONFIG> = {}) {
  return sanitizeConfig({ ...DEFAULT_CONFIG, ...overrides });
}

function place(board: Board, row: number, col: number, piece: Piece): void {
  board[row][col] = { ...createEmptyCell(), piece };
}

function createBoardStub(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => createEmptyCell()));
}

describe("combosDetect", () => {
  it("detecta segmento horizontal de 3", () => {
    const config = cfg({ columns: 5, rows: 3, lineRule: "combos" });
    const board = createBoardStub(config.rows, config.columns);
    place(board, 1, 1, { id: 1, owner: "cross", kind: "normal" });
    place(board, 1, 2, { id: 2, owner: "cross", kind: "normal" });
    place(board, 1, 3, { id: 3, owner: "cross", kind: "normal" });

    const segments = findCombosSegments(board, config);
    expect(segments.some((s) => s.orientation === "h" && s.cells.length === 3)).toBe(true);
  });

  it("fusiona forma en L en clúster tier 5", () => {
    const config = cfg({ columns: 4, rows: 4, lineRule: "combos" });
    const board = createBoardStub(config.rows, config.columns);
    place(board, 2, 2, { id: 1, owner: "circle", kind: "normal" });
    place(board, 2, 1, { id: 2, owner: "circle", kind: "normal" });
    place(board, 2, 3, { id: 3, owner: "circle", kind: "normal" });
    place(board, 1, 2, { id: 4, owner: "circle", kind: "normal" });
    place(board, 3, 2, { id: 5, owner: "circle", kind: "normal" });

    const clusters = buildCombosClusters(findCombosSegments(board, config));
    expect(clusters).toHaveLength(1);
    expect(clusters[0].tier).toBe(5);
    expect(clusters[0].cells.length).toBe(5);
  });
});

import {
  DEFAULT_LIMITED_PIECE_MOVE_MODE,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_UNLIMITED_PIECE_MOVE_MODE
} from "./defaults";
import type { GameConfig, PieceMoveMode } from "./types";

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
    gravityEnabled: config.gravityEnabled
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
      { value: "forcedOldest", label: "Obligado: mover la primera colocada" },
      { value: "limitMoveAny", label: "Límite: mover cualquier ficha" },
      { value: "limitedFree", label: "Libre: mover cualquier ficha siempre" }
    ];
  }

  return [
    { value: "blocked", label: "Bloqueadas: no se pueden mover" },
    { value: "free", label: "Libre: mover cualquier ficha" }
  ];
}

export function getMoveModeHelp(pieceLimitType: GameConfig["pieceLimitType"]): string {
  if (pieceLimitType === "limited") {
    return "Con máximo de fichas: podés obligar movimiento al llegar al máximo o permitir movimiento libre antes de llenarlas.";
  }

  return "Con fichas ilimitadas: podés bloquear el movimiento o permitir mover fichas en cualquier momento.";
}

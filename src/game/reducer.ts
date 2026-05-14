import { buildClockBankInitial } from "./clock";
import { applyClockBankTimeout, applyClockPerTurnTimeout, completePendingGravityRotation } from "./clockTimeouts";
import { sanitizeConfig } from "./config";
import { createSnapshot, redoMove, undoMove } from "./history";
import { playMove } from "./moves";
import { forfeitPlayer } from "./outcomes";
import { applySkipTurn } from "./skipTurn";
import { createBoard } from "./rules";
import type { GameAction, GameConfig, GameState, PlayerId } from "./types";

export function createInitialGameState(configInput: GameConfig): GameState {
  const config = sanitizeConfig(configInput);
  const rosterSlice = config.roster.slice(0, config.playerCount);
  const activePlayerIds = rosterSlice.map((player) => player.id);
  const pieceHistory = Object.fromEntries(activePlayerIds.map((id) => [id, [] as number[]])) as Record<PlayerId, number[]>;

  const nowMs = Date.now();
  const clockBankRemaining =
    config.clockEnabled && config.clockMode === "bank"
      ? buildClockBankInitial(activePlayerIds, config.clockBankSeconds)
      : null;

  return {
    config,
    board: createBoard(config),
    pieceHistory,
    currentPlayer: activePlayerIds[0],
    activePlayerIds,
    placementOrderWin: [],
    eliminationOrderLose: [],
    gameOver: false,
    gameEndSummary: null,
    lineCells: [],
    nextPieceId: 1,
    turnNumber: 0,
    statusMessage: "",
    selectedPieceId: null,
    gravityDirection: config.gravityInitialDirection,
    pendingGravityRotationTarget: null,
    collapseCount: 0,
    clockTurnStartedAtMs: nowMs,
    clockBankRemaining,
    clockPauseStartedAtMs: null,
    undoStack: [],
    redoStack: []
  };
}

export function reduceGameState(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "newGame":
      return createInitialGameState(action.config);
    case "replaceState":
      return action.state;
    case "playMove":
      return playMove(state, action.row, action.col);
    case "forfeitPlayer":
      return forfeitPlayer(state, action.playerId);
    case "undo":
      return undoMove(state);
    case "redo":
      return redoMove(state);
    case "completePendingGravityRotation":
      return completePendingGravityRotation(state);
    case "clockBankTimeout":
      return applyClockBankTimeout(state);
    case "clockPerTurnTimeout":
      return applyClockPerTurnTimeout(state);
    case "skipTurn":
      return applySkipTurn(state);
    default:
      return state;
  }
}

export const gameReducer = reduceGameState;

export { createSnapshot };
import type { GameAction, GameState, PlayerId as GamePlayerId } from "../game/types";

export type PlayerId = string;

export type NetworkRole = "offline" | "host" | "client";

export type ConnectionStatus =
  | "offline"
  | "creating-room"
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface NetworkPlayer {
  id: PlayerId;
  name: string;
  symbol: GamePlayerId | null;
  connected: boolean;
}

export type NetworkMessage =
  | { type: "HELLO"; playerId: PlayerId; playerName: string }
  | { type: "WELCOME"; playerId: PlayerId; assignedSymbol: GamePlayerId; state: GameState | null }
  | { type: "PLAYER_JOINED"; player: NetworkPlayer }
  | { type: "GAME_ACTION_REQUEST"; playerId: PlayerId; action: GameAction }
  | { type: "GAME_STATE_SYNC"; state: GameState }
  | { type: "NEW_GAME_REQUEST"; playerId: PlayerId }
  | { type: "ERROR"; message: string }
  | { type: "DEBUG_MESSAGE"; message: string; fromPlayerId: PlayerId; sentAtMs: number };

export function isNetworkMessage(value: unknown): value is NetworkMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown };
  return typeof candidate.type === "string";
}

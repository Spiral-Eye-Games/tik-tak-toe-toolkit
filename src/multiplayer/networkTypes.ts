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

export interface ChatMessage {
  id: string;
  kind: "system" | "player";
  playerId: PlayerId | null;
  playerName: string | null;
  text: string;
  sentAtMs: number;
}

export type NetworkMessage =
  | { type: "HELLO"; playerId: PlayerId; playerName: string; preferredSymbol: GamePlayerId | null }
  | { type: "WELCOME"; playerId: PlayerId; assignedSymbol: GamePlayerId; players: NetworkPlayer[]; state: GameState }
  | { type: "PLAYER_JOINED"; player: NetworkPlayer }
  | { type: "PLAYER_PROFILE_UPDATED"; player: NetworkPlayer }
  | { type: "SYMBOL_CHANGE_REQUEST"; playerId: PlayerId; symbol: GamePlayerId }
  | { type: "GAME_ACTION_REQUEST"; playerId: PlayerId; action: GameAction }
  | { type: "GAME_STATE_SYNC"; state: GameState }
  | { type: "CLOCK_TIMEOUT_CLAIM"; playerId: PlayerId; mode: "bank" | "perTurn" }
  | { type: "CHAT_MESSAGE"; id: string; playerId: PlayerId; playerName: string; text: string; sentAtMs: number }
  | { type: "NEW_GAME_REQUEST"; playerId: PlayerId }
  | { type: "ERROR"; message: string }
  | { type: "DEBUG_MESSAGE"; message: string; fromPlayerId: PlayerId; sentAtMs: number };

export function isNetworkMessage(value: unknown): value is NetworkMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown };
  return typeof candidate.type === "string";
}

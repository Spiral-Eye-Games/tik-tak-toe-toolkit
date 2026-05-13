import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ROSTER } from "../game/defaults";
import type { PlayerId as GamePlayerId } from "../game/types";
import { t } from "../i18n";
import { PeerService } from "./peerService";
import type {
  ConnectionStatus,
  NetworkMessage,
  NetworkPlayer,
  NetworkRole,
  PlayerId
} from "./networkTypes";

const MULTIPLAYER_SYMBOL_ORDER = DEFAULT_ROSTER.map((player) => player.id);
const HOST_SYMBOL: GamePlayerId = "cross";
const MIN_ROOM_PLAYERS = 2;
const MAX_ROOM_PLAYERS = DEFAULT_ROSTER.length;
const DEFAULT_PLAYER_ROOM_SIZE = MIN_ROOM_PLAYERS;

export interface MultiplayerState {
  role: NetworkRole;
  status: ConnectionStatus;
  roomCode: string;
  localPlayerId: PlayerId;
  localPlayerName: string;
  localSymbol: GamePlayerId | null;
  roomMaxPlayers: number;
  minRoomPlayers: number;
  maxRoomPlayers: number;
  players: NetworkPlayer[];
  error: string | null;
  debugMessages: string[];
  isOnline: boolean;
  isHost: boolean;
  isClient: boolean;
  createRoom: () => void;
  setRoomMaxPlayers: (maxPlayers: number) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  sendDebugMessage: () => void;
}

export function useMultiplayer(): MultiplayerState {
  const serviceRef = useRef<PeerService | null>(null);
  const connectionPlayersRef = useRef(new Map<string, PlayerId>());
  const playersRef = useRef<NetworkPlayer[]>([]);
  const localPlayerId = useMemo(() => createPlayerId(), []);
  const localPlayerName = useMemo(() => createPlayerName(), []);
  const localPlayerIdRef = useRef(localPlayerId);
  const localPlayerNameRef = useRef(localPlayerName);

  const [role, setRole] = useState<NetworkRole>("offline");
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [roomCode, setRoomCode] = useState("");
  const [localSymbol, setLocalSymbol] = useState<GamePlayerId | null>(null);
  const [roomMaxPlayers, setRoomMaxPlayersState] = useState(DEFAULT_PLAYER_ROOM_SIZE);
  const [players, setPlayers] = useState<NetworkPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = useCallback((message: string) => {
    setDebugMessages((current) => [message, ...current].slice(0, 5));
  }, []);

  const setRoomMaxPlayers = useCallback((maxPlayers: number) => {
    setRoomMaxPlayersState(clampRoomMaxPlayers(maxPlayers));
  }, []);

  const resetSession = useCallback(() => {
    serviceRef.current?.close();
    serviceRef.current = null;
    connectionPlayersRef.current.clear();
    playersRef.current = [];
    setRole("offline");
    setStatus("offline");
    setRoomCode("");
    setLocalSymbol(null);
    setPlayers([]);
    setError(null);
    setDebugMessages([]);
  }, []);

  const handleHostMessage = useCallback((message: NetworkMessage, connectionId: string) => {
    if (message.type === "HELLO") {
      const assignedSymbol = getNextAvailableSymbol(playersRef.current, roomMaxPlayers);
      if (assignedSymbol === null) {
        serviceRef.current?.sendTo(connectionId, {
          type: "ERROR",
          message: t("multiplayer.roomFull", { maxPlayers: roomMaxPlayers })
        });
        window.setTimeout(() => serviceRef.current?.closeConnection(connectionId), 0);
        addDebugMessage(t("multiplayer.debugRoomFull", { player: message.playerName }));
        return;
      }

      connectionPlayersRef.current.set(connectionId, message.playerId);
      const clientPlayer: NetworkPlayer = {
        id: message.playerId,
        name: message.playerName,
        symbol: assignedSymbol,
        connected: true
      };
      const nextPlayers = upsertPlayer(playersRef.current, clientPlayer);

      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);
      setStatus("connected");
      serviceRef.current?.sendTo(connectionId, {
        type: "WELCOME",
        playerId: message.playerId,
        assignedSymbol,
        players: nextPlayers,
        state: null
      });
      serviceRef.current?.broadcast({ type: "PLAYER_JOINED", player: clientPlayer });
      addDebugMessage(t("multiplayer.debugHello", { player: message.playerName }));
      return;
    }

    if (message.type === "DEBUG_MESSAGE") {
      addDebugMessage(message.message);
    }
  }, [addDebugMessage, roomMaxPlayers]);

  const handleClientMessage = useCallback((message: NetworkMessage) => {
    if (message.type === "WELCOME") {
      setLocalSymbol(message.assignedSymbol);
      playersRef.current = message.players;
      setPlayers(message.players);
      setStatus("connected");
      addDebugMessage(t("multiplayer.debugWelcome"));
      return;
    }

    if (message.type === "PLAYER_JOINED") {
      const nextPlayers = upsertPlayer(playersRef.current, message.player);
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);
      return;
    }

    if (message.type === "DEBUG_MESSAGE") {
      addDebugMessage(message.message);
      return;
    }

    if (message.type === "ERROR") {
      setError(message.message);
      setStatus("error");
      serviceRef.current?.close();
    }
  }, [addDebugMessage]);

  const createRoom = useCallback(() => {
    resetSession();
    setRole("host");
    setStatus("creating-room");
    setLocalSymbol(HOST_SYMBOL);
    const hostPlayers: NetworkPlayer[] = [{
      id: localPlayerIdRef.current,
      name: localPlayerNameRef.current,
      symbol: HOST_SYMBOL,
      connected: true
    }];
    playersRef.current = hostPlayers;
    setPlayers(hostPlayers);

    const service = new PeerService();
    serviceRef.current = service;
    service.createHost({
      onOpen: (peerId) => {
        setRoomCode(peerId);
        setStatus("waiting");
      },
      onConnection: () => {
        setStatus("connected");
      },
      onMessage: handleHostMessage,
      onClose: (connectionId) => {
        const playerId = connectionPlayersRef.current.get(connectionId);
        if (!playerId) return;
        connectionPlayersRef.current.delete(connectionId);
        const nextPlayers = playersRef.current.map((player) => (
          player.id === playerId ? { ...player, connected: false } : player
        ));
        playersRef.current = nextPlayers;
        setPlayers(nextPlayers);
        setStatus(nextPlayers.some((player) => player.id !== localPlayerIdRef.current && player.connected) ? "connected" : "waiting");
      },
      onError: (nextError) => {
        setError(nextError.message);
        setStatus("error");
      }
    });
  }, [handleHostMessage, resetSession]);

  const joinRoom = useCallback((nextRoomCode: string) => {
    const trimmedRoomCode = nextRoomCode.trim();
    if (!trimmedRoomCode) return;

    resetSession();
    setRole("client");
    setStatus("connecting");
    setRoomCode(trimmedRoomCode);
    const clientPlayers: NetworkPlayer[] = [{
      id: localPlayerIdRef.current,
      name: localPlayerNameRef.current,
      symbol: null,
      connected: true
    }];
    playersRef.current = clientPlayers;
    setPlayers(clientPlayers);

    const service = new PeerService();
    serviceRef.current = service;
    service.connectToHost(trimmedRoomCode, {
      onConnection: (connectionId) => {
        service.sendTo(connectionId, {
          type: "HELLO",
          playerId: localPlayerIdRef.current,
          playerName: localPlayerNameRef.current
        });
      },
      onMessage: handleClientMessage,
      onClose: () => {
        setStatus("disconnected");
      },
      onError: (nextError) => {
        setError(nextError.message);
        setStatus("error");
      }
    });
  }, [handleClientMessage, resetSession]);

  const sendDebugMessage = useCallback(() => {
    const message: NetworkMessage = {
      type: "DEBUG_MESSAGE",
      message: t("multiplayer.debugPayload", { player: localPlayerNameRef.current }),
      fromPlayerId: localPlayerIdRef.current,
      sentAtMs: Date.now()
    };
    serviceRef.current?.broadcast(message);
    addDebugMessage(message.message);
  }, [addDebugMessage]);

  useEffect(() => () => {
    serviceRef.current?.close();
  }, []);

  return {
    role,
    status,
    roomCode,
    localPlayerId,
    localPlayerName,
    localSymbol,
    roomMaxPlayers,
    minRoomPlayers: MIN_ROOM_PLAYERS,
    maxRoomPlayers: MAX_ROOM_PLAYERS,
    players,
    error,
    debugMessages,
    isOnline: role !== "offline",
    isHost: role === "host",
    isClient: role === "client",
    createRoom,
    setRoomMaxPlayers,
    joinRoom,
    leaveRoom: resetSession,
    sendDebugMessage
  };
}

function clampRoomMaxPlayers(maxPlayers: number): number {
  if (!Number.isFinite(maxPlayers)) return DEFAULT_PLAYER_ROOM_SIZE;
  return Math.min(MAX_ROOM_PLAYERS, Math.max(MIN_ROOM_PLAYERS, Math.round(maxPlayers)));
}

function getNextAvailableSymbol(players: NetworkPlayer[], maxPlayers: number): GamePlayerId | null {
  if (players.length >= maxPlayers) return null;
  const usedSymbols = new Set(players.map((player) => player.symbol).filter((symbol): symbol is GamePlayerId => symbol !== null));
  return MULTIPLAYER_SYMBOL_ORDER.slice(0, maxPlayers).find((symbol) => !usedSymbols.has(symbol)) ?? null;
}

function upsertPlayer(players: NetworkPlayer[], nextPlayer: NetworkPlayer): NetworkPlayer[] {
  const exists = players.some((player) => player.id === nextPlayer.id);
  if (!exists) return [...players, nextPlayer];
  return players.map((player) => (player.id === nextPlayer.id ? nextPlayer : player));
}

function createPlayerId(): PlayerId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `player-${Math.random().toString(36).slice(2)}`;
}

function createPlayerName(): string {
  return `P-${Math.floor(Math.random() * 900 + 100)}`;
}

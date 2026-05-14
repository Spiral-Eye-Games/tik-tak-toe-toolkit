import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ROSTER } from "../game/defaults";
import type { GameAction, GameConfig, GameState, PlayerId as GamePlayerId } from "../game/types";
import {
  loadMultiplayerNickname,
  loadMultiplayerPreferredSymbol,
  saveMultiplayerNickname,
  saveMultiplayerPreferredSymbol
} from "../game/sessionCache";
import { t } from "../i18n";
import { PeerService } from "./peerService";
import type {
  ChatMessage,
  ConnectionStatus,
  NetworkMessage,
  NetworkPlayer,
  NetworkRole,
  PlayerId
} from "./networkTypes";

const MULTIPLAYER_SYMBOL_ORDER = DEFAULT_ROSTER.map((player) => player.id);
const MIN_ROOM_PLAYERS = 2;
const MAX_ROOM_PLAYERS = DEFAULT_ROSTER.length;
const DEFAULT_PLAYER_ROOM_SIZE = MIN_ROOM_PLAYERS;

interface UseMultiplayerOptions {
  gameState: GameState;
  applyGameActionAsHost: (action: GameAction) => GameState;
  replaceGameState: (state: GameState) => void;
  replaceDraftConfig: (config: GameConfig) => void;
  /** Si es `false`, no se escribe nickname ni ficha preferida en `localStorage` (modo `?dev`). */
  persistNickname?: boolean;
  /** Al salir como cliente, restaurar config local guardada (p. ej. desde `App`). */
  onClientSessionEnd?: () => void;
}

export interface MultiplayerState {
  role: NetworkRole;
  status: ConnectionStatus;
  roomCode: string;
  localPlayerId: PlayerId;
  localPlayerName: string;
  /** Texto del input de nickname (vacío permitido; `localPlayerName` aplica fallback solo para red / títulos). */
  localPlayerNameInput: string;
  localSymbol: GamePlayerId | null;
  roomMaxPlayers: number;
  minRoomPlayers: number;
  maxRoomPlayers: number;
  availableSymbols: GamePlayerId[];
  players: NetworkPlayer[];
  error: string | null;
  debugMessages: string[];
  chatMessages: ChatMessage[];
  isOnline: boolean;
  isHost: boolean;
  isClient: boolean;
  canEditConfig: boolean;
  canStartNewGame: boolean;
  canUseUndoRedo: boolean;
  canPlayLocalTurn: boolean;
  canChangeProfile: boolean;
  createRoom: (maxPlayersOverride?: number) => void;
  setLocalPlayerName: (name: string) => void;
  requestSymbolChange: (symbol: GamePlayerId | null) => void;
  setRoomMaxPlayers: (maxPlayers: number) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  sendDebugMessage: () => void;
  sendChatMessage: (text: string) => void;
  sendGameAction: (action: GameAction) => void;
  sendClockTimeoutClaim: () => void;
  syncGameState: (state: GameState) => void;
}

export function useMultiplayer({
  gameState,
  applyGameActionAsHost,
  replaceGameState,
  replaceDraftConfig,
  persistNickname = false,
  onClientSessionEnd
}: UseMultiplayerOptions): MultiplayerState {
  const serviceRef = useRef<PeerService | null>(null);
  const connectionPlayersRef = useRef(new Map<string, PlayerId>());
  const playersRef = useRef<NetworkPlayer[]>([]);
  const gameStateRef = useRef(gameState);
  const applyGameActionAsHostRef = useRef(applyGameActionAsHost);
  const replaceGameStateRef = useRef(replaceGameState);
  const replaceDraftConfigRef = useRef(replaceDraftConfig);
  const onClientSessionEndRef = useRef(onClientSessionEnd);
  onClientSessionEndRef.current = onClientSessionEnd;
  const localPlayerId = useMemo(() => createPlayerId(), []);
  const fallbackPlayerName = useMemo(() => createPlayerName(), []);
  const [localPlayerNameInput, setLocalPlayerNameInput] = useState(() => loadMultiplayerNickname());
  const initialPreferredSymbol = persistNickname ? loadMultiplayerPreferredSymbol() : null;
  const [preferredSymbol, setPreferredSymbol] = useState<GamePlayerId | null>(initialPreferredSymbol);
  const localPlayerIdRef = useRef(localPlayerId);
  const localPlayerNameRef = useRef(fallbackPlayerName);

  const [role, setRole] = useState<NetworkRole>("offline");
  const roleRef = useRef<NetworkRole>("offline");
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [roomCode, setRoomCode] = useState("");
  const [localSymbol, setLocalSymbol] = useState<GamePlayerId | null>(initialPreferredSymbol);
  const [roomMaxPlayers, setRoomMaxPlayersState] = useState(DEFAULT_PLAYER_ROOM_SIZE);
  const roomMaxPlayersRef = useRef(roomMaxPlayers);
  const [players, setPlayers] = useState<NetworkPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const localPlayerName = normalizePlayerName(localPlayerNameInput, fallbackPlayerName);

  roleRef.current = role;
  roomMaxPlayersRef.current = roomMaxPlayers;
  gameStateRef.current = gameState;
  applyGameActionAsHostRef.current = applyGameActionAsHost;
  replaceGameStateRef.current = replaceGameState;
  replaceDraftConfigRef.current = replaceDraftConfig;
  localPlayerNameRef.current = localPlayerName;

  useEffect(() => {
    if (!persistNickname) return;
    saveMultiplayerNickname(localPlayerNameInput.trim());
  }, [localPlayerNameInput, persistNickname]);

  useEffect(() => {
    if (!persistNickname) return;
    saveMultiplayerPreferredSymbol(preferredSymbol);
  }, [persistNickname, preferredSymbol]);

  const addDebugMessage = useCallback((message: string) => {
    setDebugMessages((current) => [message, ...current].slice(0, 5));
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((current) => {
      if (current.some((entry) => entry.id === message.id)) return current;
      return [...current, message].slice(-80);
    });
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    addChatMessage({
      id: createMessageId(),
      kind: "system",
      playerId: null,
      playerName: null,
      text,
      sentAtMs: Date.now()
    });
  }, [addChatMessage]);

  const setRoomMaxPlayers = useCallback((maxPlayers: number) => {
    setRoomMaxPlayersState(clampRoomMaxPlayers(maxPlayers));
  }, []);

  const setLocalPlayerName = useCallback((name: string) => {
    setLocalPlayerNameInput(name);
  }, []);

  const sendErrorTo = useCallback((connectionId: string, message: string) => {
    serviceRef.current?.sendTo(connectionId, { type: "ERROR", message });
  }, []);

  const handleRemoteGameAction = useCallback((message: Extract<NetworkMessage, { type: "GAME_ACTION_REQUEST" }>, connectionId: string) => {
    const connectionPlayerId = connectionPlayersRef.current.get(connectionId);
    const player = playersRef.current.find((candidate) => candidate.id === message.playerId);

    if (connectionPlayerId !== message.playerId || !player?.connected || player.symbol === null) {
      sendErrorTo(connectionId, t("multiplayer.errors.unknownPlayer"));
      return;
    }

    if (message.action.type !== "playMove") {
      sendErrorTo(connectionId, t("multiplayer.errors.hostOnlyAction"));
      return;
    }

    if (player.symbol !== gameStateRef.current.currentPlayer) {
      sendErrorTo(connectionId, t("multiplayer.errors.notYourTurn"));
      return;
    }

    const nextState = applyGameActionAsHostRef.current(message.action);
    serviceRef.current?.broadcast({ type: "GAME_STATE_SYNC", state: nextState });
  }, [sendErrorTo]);

  const handleRemoteClockTimeout = useCallback((message: Extract<NetworkMessage, { type: "CLOCK_TIMEOUT_CLAIM" }>, connectionId: string) => {
    const connectionPlayerId = connectionPlayersRef.current.get(connectionId);
    const player = playersRef.current.find((candidate) => candidate.id === message.playerId);
    if (connectionPlayerId !== message.playerId || !player?.connected || player.symbol === null) {
      sendErrorTo(connectionId, t("multiplayer.errors.unknownPlayer"));
      return;
    }
    if (player.symbol !== gameStateRef.current.currentPlayer) {
      sendErrorTo(connectionId, t("multiplayer.errors.notYourTurn"));
      return;
    }

    const nextState = applyGameActionAsHostRef.current({
      type: message.mode === "bank" ? "clockBankTimeout" : "clockPerTurnTimeout"
    });
    serviceRef.current?.broadcast({ type: "GAME_STATE_SYNC", state: nextState });
  }, [sendErrorTo]);

  const updatePlayer = useCallback((nextPlayer: NetworkPlayer) => {
    const nextPlayers = upsertPlayer(playersRef.current, nextPlayer);
    playersRef.current = nextPlayers;
    setPlayers(nextPlayers);
    if (nextPlayer.id === localPlayerIdRef.current) {
      setLocalSymbol(nextPlayer.symbol);
    }
    return nextPlayers;
  }, []);

  const requestSymbolChange = useCallback((symbol: GamePlayerId | null) => {
    if (role === "offline") {
      setPreferredSymbol(symbol);
      setLocalSymbol(symbol);
      return;
    }

    if (symbol === null) return;

    if (!canChangeProfileForState(gameStateRef.current)) return;

    if (role === "host") {
      const current = playersRef.current.find((player) => player.id === localPlayerIdRef.current);
      if (!current || isSymbolTaken(playersRef.current, symbol, current.id)) {
        setError(t("multiplayer.errors.symbolTaken"));
        return;
      }
      const updated = { ...current, symbol };
      updatePlayer(updated);
      serviceRef.current?.broadcast({ type: "PLAYER_PROFILE_UPDATED", player: updated });
      return;
    }

    serviceRef.current?.broadcast({
      type: "SYMBOL_CHANGE_REQUEST",
      playerId: localPlayerIdRef.current,
      symbol
    });
  }, [role, updatePlayer]);

  const clearMultiplayerUi = useCallback(() => {
    serviceRef.current?.close();
    serviceRef.current = null;
    connectionPlayersRef.current.clear();
    playersRef.current = [];
    setRole("offline");
    setStatus("offline");
    setRoomCode("");
    setLocalSymbol(preferredSymbol);
    setPlayers([]);
    setError(null);
    setDebugMessages([]);
    setChatMessages([]);
    roleRef.current = "offline";
  }, [preferredSymbol]);

  const resetSession = useCallback(() => {
    if (roleRef.current === "client") {
      onClientSessionEndRef.current?.();
    }
    clearMultiplayerUi();
  }, [clearMultiplayerUi]);

  const handleHostMessage = useCallback((message: NetworkMessage, connectionId: string) => {
    if (message.type === "HELLO") {
      const assignedSymbol = getAssignableSymbol(playersRef.current, message.preferredSymbol);
      if (assignedSymbol === null) {
        serviceRef.current?.sendTo(connectionId, {
          type: "ERROR",
          message: t("multiplayer.roomFull", { maxPlayers: roomMaxPlayersRef.current })
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
        state: gameStateRef.current
      });
      serviceRef.current?.broadcast({ type: "PLAYER_JOINED", player: clientPlayer });
      addSystemMessage(t("multiplayer.system.playerConnected", { player: message.playerName }));
      return;
    }

    if (message.type === "GAME_ACTION_REQUEST") {
      handleRemoteGameAction(message, connectionId);
      return;
    }

    if (message.type === "CLOCK_TIMEOUT_CLAIM") {
      handleRemoteClockTimeout(message, connectionId);
      return;
    }

    if (message.type === "SYMBOL_CHANGE_REQUEST") {
      const connectionPlayerId = connectionPlayersRef.current.get(connectionId);
      const player = playersRef.current.find((candidate) => candidate.id === message.playerId);
      if (
        connectionPlayerId !== message.playerId ||
        !player?.connected ||
        !canChangeProfileForState(gameStateRef.current) ||
        isSymbolTaken(playersRef.current, message.symbol, player.id)
      ) {
        sendErrorTo(connectionId, t("multiplayer.errors.symbolTaken"));
        return;
      }
      const updated = { ...player, symbol: message.symbol };
      updatePlayer(updated);
      serviceRef.current?.broadcast({ type: "PLAYER_PROFILE_UPDATED", player: updated });
      return;
    }

    if (message.type === "DEBUG_MESSAGE") {
      addDebugMessage(message.message);
      return;
    }

    if (message.type === "CHAT_MESSAGE") {
      addChatMessage({
        id: message.id,
        kind: "player",
        playerId: message.playerId,
        playerName: message.playerName,
        text: message.text,
        sentAtMs: message.sentAtMs
      });
      serviceRef.current?.broadcast(message);
    }
  }, [addChatMessage, addDebugMessage, addSystemMessage, handleRemoteClockTimeout, handleRemoteGameAction, sendErrorTo, updatePlayer]);

  const handleClientMessage = useCallback((message: NetworkMessage) => {
    if (message.type === "WELCOME") {
      setLocalSymbol(message.assignedSymbol);
      playersRef.current = message.players;
      setPlayers(message.players);
      replaceDraftConfigRef.current(message.state.config);
      replaceGameStateRef.current(message.state);
      setStatus("connected");
      return;
    }

    if (message.type === "GAME_STATE_SYNC") {
      replaceDraftConfigRef.current(message.state.config);
      replaceGameStateRef.current(message.state);
      return;
    }

    if (message.type === "PLAYER_JOINED") {
      const nextPlayers = upsertPlayer(playersRef.current, message.player);
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);
      addSystemMessage(t("multiplayer.system.playerConnected", { player: message.player.name }));
      return;
    }

    if (message.type === "PLAYER_PROFILE_UPDATED") {
      const previousPlayer = playersRef.current.find((player) => player.id === message.player.id);
      updatePlayer(message.player);
      if (previousPlayer?.connected && !message.player.connected) {
        addSystemMessage(t("multiplayer.system.playerDisconnected", { player: message.player.name }));
      }
      return;
    }

    if (message.type === "DEBUG_MESSAGE") {
      addDebugMessage(message.message);
      return;
    }

    if (message.type === "CHAT_MESSAGE") {
      addChatMessage({
        id: message.id,
        kind: "player",
        playerId: message.playerId,
        playerName: message.playerName,
        text: message.text,
        sentAtMs: message.sentAtMs
      });
      return;
    }

    if (message.type === "ERROR") {
      setError(message.message);
      addSystemMessage(message.message);
      setStatus("error");
    }
  }, [addChatMessage, addDebugMessage, addSystemMessage, updatePlayer]);

  const createRoom = useCallback((maxPlayersOverride?: number) => {
    if (typeof maxPlayersOverride === "number" && Number.isFinite(maxPlayersOverride)) {
      const clamped = clampRoomMaxPlayers(maxPlayersOverride);
      setRoomMaxPlayersState(clamped);
      roomMaxPlayersRef.current = clamped;
    }
    resetSession();
    setRole("host");
    roleRef.current = "host";
    setStatus("creating-room");
    const hostSymbol = getAssignableSymbol([], preferredSymbol) ?? MULTIPLAYER_SYMBOL_ORDER[0]!;
    setLocalSymbol(hostSymbol);
    const hostPlayers: NetworkPlayer[] = [{
      id: localPlayerIdRef.current,
      name: localPlayerNameRef.current,
      symbol: hostSymbol,
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
        addSystemMessage(t("multiplayer.system.roomReady"));
      },
      onConnection: () => {
        setStatus("connected");
      },
      onMessage: handleHostMessage,
      onClose: (connectionId) => {
        const playerId = connectionPlayersRef.current.get(connectionId);
        if (!playerId) return;
        connectionPlayersRef.current.delete(connectionId);
        const disconnectedPlayer = playersRef.current.find((player) => player.id === playerId);
        const nextPlayers = playersRef.current.map((player) => (
          player.id === playerId ? { ...player, connected: false } : player
        ));
        playersRef.current = nextPlayers;
        setPlayers(nextPlayers);
        setStatus(nextPlayers.some((player) => player.id !== localPlayerIdRef.current && player.connected) ? "connected" : "waiting");
        if (disconnectedPlayer) {
          serviceRef.current?.broadcast({ type: "PLAYER_PROFILE_UPDATED", player: { ...disconnectedPlayer, connected: false } });
          addSystemMessage(t("multiplayer.system.playerDisconnected", { player: disconnectedPlayer.name }));
        }
        if (disconnectedPlayer?.symbol && gameStateRef.current.activePlayerIds.includes(disconnectedPlayer.symbol)) {
          const nextState = applyGameActionAsHostRef.current({
            type: "forfeitPlayer",
            playerId: disconnectedPlayer.symbol,
            reason: "disconnect"
          });
          serviceRef.current?.broadcast({ type: "GAME_STATE_SYNC", state: nextState });
        }
      },
      onError: (nextError) => {
        setError(nextError.message);
        addSystemMessage(nextError.message);
        setStatus("error");
      }
    });
  }, [addSystemMessage, handleHostMessage, preferredSymbol, resetSession]);

  const joinRoom = useCallback((nextRoomCode: string) => {
    const trimmedRoomCode = nextRoomCode.trim();
    if (!trimmedRoomCode) return;

    resetSession();
    setRole("client");
    roleRef.current = "client";
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
          playerName: localPlayerNameRef.current,
          preferredSymbol
        });
      },
      onMessage: handleClientMessage,
      onClose: () => {
        if (roleRef.current !== "client") return;
        resetSession();
        addSystemMessage(t("multiplayer.system.hostDisconnected"));
      },
      onError: (nextError) => {
        const msg = nextError.message;
        if (roleRef.current !== "client") return;
        resetSession();
        setError(msg);
        setStatus("error");
        addSystemMessage(msg);
      }
    });
  }, [addSystemMessage, handleClientMessage, preferredSymbol, resetSession]);

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

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const message: Extract<NetworkMessage, { type: "CHAT_MESSAGE" }> = {
      type: "CHAT_MESSAGE",
      id: createMessageId(),
      playerId: localPlayerIdRef.current,
      playerName: localPlayerNameRef.current,
      text: trimmed,
      sentAtMs: Date.now()
    };

    addChatMessage({
      id: message.id,
      kind: "player",
      playerId: message.playerId,
      playerName: message.playerName,
      text: message.text,
      sentAtMs: message.sentAtMs
    });
    serviceRef.current?.broadcast(message);
  }, [addChatMessage]);

  const sendGameAction = useCallback((action: GameAction) => {
    serviceRef.current?.broadcast({
      type: "GAME_ACTION_REQUEST",
      playerId: localPlayerIdRef.current,
      action
    });
  }, []);

  const sendClockTimeoutClaim = useCallback(() => {
    serviceRef.current?.broadcast({
      type: "CLOCK_TIMEOUT_CLAIM",
      playerId: localPlayerIdRef.current,
      mode: gameStateRef.current.config.clockMode === "bank" ? "bank" : "perTurn"
    });
  }, []);

  const syncGameState = useCallback((state: GameState) => {
    serviceRef.current?.broadcast({ type: "GAME_STATE_SYNC", state });
  }, []);

  useEffect(() => () => {
    serviceRef.current?.close();
  }, []);

  const isOnline = role !== "offline";
  const isHost = role === "host";
  const isClient = role === "client";
  const canEditConfig = !isClient;
  const canStartNewGame = !isClient;
  const canUseUndoRedo = !isClient;
  const canChangeProfile = !isOnline || canChangeProfileForState(gameState);
  const canPlayLocalTurn =
    !isOnline ||
    (localSymbol !== null &&
      localSymbol === gameState.currentPlayer &&
      status !== "connecting" &&
      status !== "creating-room" &&
      status !== "error");

  return {
    role,
    status,
    roomCode,
    localPlayerId,
    localPlayerName,
    localPlayerNameInput,
    localSymbol,
    roomMaxPlayers,
    minRoomPlayers: MIN_ROOM_PLAYERS,
    maxRoomPlayers: MAX_ROOM_PLAYERS,
    availableSymbols: getAvailableSymbols(players, localPlayerId),
    players,
    error,
    debugMessages,
    chatMessages,
    isOnline,
    isHost,
    isClient,
    canEditConfig,
    canStartNewGame,
    canUseUndoRedo,
    canPlayLocalTurn,
    canChangeProfile,
    createRoom,
    setLocalPlayerName,
    requestSymbolChange,
    setRoomMaxPlayers,
    joinRoom,
    leaveRoom: resetSession,
    sendDebugMessage,
    sendChatMessage,
    sendGameAction,
    sendClockTimeoutClaim,
    syncGameState
  };
}

function clampRoomMaxPlayers(maxPlayers: number): number {
  if (!Number.isFinite(maxPlayers)) return DEFAULT_PLAYER_ROOM_SIZE;
  return Math.min(MAX_ROOM_PLAYERS, Math.max(MIN_ROOM_PLAYERS, Math.round(maxPlayers)));
}

function getAssignableSymbol(
  players: NetworkPlayer[],
  preferredSymbol: GamePlayerId | null
): GamePlayerId | null {
  if (preferredSymbol && !isSymbolTaken(players, preferredSymbol, null)) return preferredSymbol;
  return getNextAvailableSymbol(players);
}

function getNextAvailableSymbol(players: NetworkPlayer[]): GamePlayerId | null {
  const usedSymbols = new Set(players.map((player) => player.symbol).filter((symbol): symbol is GamePlayerId => symbol !== null));
  return MULTIPLAYER_SYMBOL_ORDER.find((symbol) => !usedSymbols.has(symbol)) ?? null;
}

function getAvailableSymbols(players: NetworkPlayer[], localPlayerId: PlayerId): GamePlayerId[] {
  return MULTIPLAYER_SYMBOL_ORDER
    .filter((symbol) => !isSymbolTaken(players, symbol, localPlayerId));
}

function isSymbolTaken(players: NetworkPlayer[], symbol: GamePlayerId, allowedPlayerId: PlayerId | null): boolean {
  return players.some((player) => player.symbol === symbol && player.id !== allowedPlayerId);
}

function canChangeProfileForState(gameState: GameState): boolean {
  return gameState.gameOver || (gameState.turnNumber === 0 && gameState.undoStack.length === 0 && gameState.redoStack.length === 0);
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

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createPlayerName(): string {
  return `P-${Math.floor(Math.random() * 900 + 100)}`;
}

function normalizePlayerName(input: string, fallback: string): string {
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

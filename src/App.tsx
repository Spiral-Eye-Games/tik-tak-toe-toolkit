import { useCallback, useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { HelpModal } from "./components/HelpModal";
import { MatchStatusBanner } from "./components/MatchStatusBanner";
import { FloatingMultiplayerPanel } from "./components/MultiplayerPanel";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DEFAULT_CONFIG, DEFAULT_ROSTER } from "./game/defaults";
import { loadLastSettings } from "./game/sessionCache";
import { t } from "./i18n";
import { isDev } from "./isDev";
import { getStatusText, type VictoryOnlineNameContext } from "./game/formatters";
import { createInitialGameState, reduceGameState } from "./game/reducer";
import { mustMovePiece } from "./game/rules";
import type { GameAction, GameConfig, GameState } from "./game/types";
import { useDraftConfig } from "./hooks/useDraftConfig";
import { useGameClock } from "./hooks/useGameClock";
import { useHelpModal } from "./hooks/useHelpModal";
import { usePendingGravityRotation } from "./hooks/usePendingGravityRotation";
import { useMultiplayer } from "./multiplayer/useMultiplayer";

export default function App() {
  const isDevUrl = useMemo(() => isDev(), []);
  const skipDraftPersistForClientRef = useRef(false);

  const {
    draftConfig,
    updateDraftConfig,
    sanitizeDraftConfig,
    replaceDraftConfig
  } = useDraftConfig({ skipPersistRef: skipDraftPersistForClientRef });
  const initialGameState = useMemo(() => createInitialGameState(draftConfig), []);
  const gameStateRef = useRef<GameState>(initialGameState);
  const [gameState, setGameState] = useState(initialGameState);

  const applyGameAction = useCallback((action: GameAction): GameState => {
    const nextState = reduceGameState(gameStateRef.current, action);
    gameStateRef.current = nextState;
    setGameState(nextState);
    return nextState;
  }, []);

  const replaceGameState = useCallback((state: GameState) => {
    gameStateRef.current = state;
    setGameState(state);
  }, []);

  const restoreCachedSettingsAfterClientSession = useCallback(() => {
    const nextConfig = replaceDraftConfig(loadLastSettings() ?? DEFAULT_CONFIG);
    replaceGameState(createInitialGameState(nextConfig));
  }, [replaceDraftConfig, replaceGameState]);

  const { modal, closeModal, openHelp, openRulesHelp } = useHelpModal(gameState);
  const multiplayer = useMultiplayer({
    gameState,
    applyGameActionAsHost: applyGameAction,
    replaceGameState,
    replaceDraftConfig,
    persistNickname: !isDevUrl,
    onClientSessionEnd: restoreCachedSettingsAfterClientSession
  });
  skipDraftPersistForClientRef.current = multiplayer.isClient;
  const onlineHostMaxPlayerPicker = multiplayer.isHost ? DEFAULT_ROSTER.length : undefined;

  const updateConfig = useCallback((patch: Partial<GameConfig>) => {
    updateDraftConfig(patch);
  }, [updateDraftConfig]);

  const handleGameAction = useCallback((action: GameAction) => {
    if (multiplayer.isClient) {
      if (action.type === "playMove" || action.type === "skipTurn" || action.type === "surrender") {
        multiplayer.sendGameAction(action);
      }
      return;
    }

    if (
      multiplayer.isHost &&
      (action.type === "playMove" || action.type === "skipTurn" || action.type === "surrender") &&
      multiplayer.localSymbol !== gameState.currentPlayer
    ) {
      return;
    }

    const nextState = applyGameAction(action);
    if (multiplayer.isHost) {
      multiplayer.syncGameState(nextState);
    }
  }, [applyGameAction, gameState.currentPlayer, multiplayer]);

  const handleHostEventAction = useCallback((action: GameAction) => {
    if (multiplayer.isClient) return;
    const nextState = applyGameAction(action);
    if (multiplayer.isHost) {
      multiplayer.syncGameState(nextState);
    }
  }, [applyGameAction, multiplayer]);

  const handleClockAction = useCallback((action: GameAction) => {
    if (multiplayer.isClient) {
      if (action.type === "clockBankTimeout" || action.type === "clockPerTurnTimeout") {
        multiplayer.sendClockTimeoutClaim();
      }
      return;
    }
    handleHostEventAction(action);
  }, [handleHostEventAction, multiplayer]);

  const ownsClockTurn = !multiplayer.isOnline || multiplayer.localSymbol === gameState.currentPlayer;
  const topbarClockText = useGameClock(gameState, handleClockAction, ownsClockTurn);

  usePendingGravityRotation(gameState, handleHostEventAction);

  const statusAriaLabel = useMemo(
    () => getStatusText(gameState, gameState.config, mustMovePiece),
    [gameState]
  );

  const victoryOnlineNameContext = useMemo<VictoryOnlineNameContext>(
    () => ({
      isOnline: multiplayer.isOnline,
      players: multiplayer.players.map((player) => ({ symbol: player.symbol, name: player.name }))
    }),
    [multiplayer.isOnline, multiplayer.players]
  );

  function startNewGame() {
    if (!multiplayer.canStartNewGame) return;
    const nextConfig = multiplayer.isHost
      ? buildOnlineGameConfig(sanitizeDraftConfig(), multiplayer.players)
      : buildOfflineGameConfig(sanitizeDraftConfig());
    handleGameAction({ type: "newGame", config: nextConfig });
  }

  function applyPreset(config: GameConfig) {
    if (!multiplayer.canStartNewGame) return;
    const nextConfig = replaceDraftConfig(config);
    handleGameAction({
      type: "newGame",
      config: multiplayer.isHost ? buildOnlineGameConfig(nextConfig, multiplayer.players) : buildOfflineGameConfig(nextConfig)
    });
  }

  return (
    <div className="app">
      <TopBar statusAriaLabel={statusAriaLabel} clockText={topbarClockText}>
        <MatchStatusBanner state={gameState} mustMove={mustMovePiece} compactRanking />
      </TopBar>

      <main className="layout">
        <Sidebar
          config={draftConfig}
          liveGame={gameState}
          onChangeConfig={updateConfig}
          onNewGame={startNewGame}
          onApplyPreset={applyPreset}
          onHelp={openHelp}
          onRulesHelp={openRulesHelp}
          readOnlyConfig={!multiplayer.canEditConfig}
          canStartNewGame={multiplayer.canStartNewGame}
          maxPlayerCount={onlineHostMaxPlayerPicker}
        />

        <Board
          state={gameState}
          onPlayMove={(row, col) => handleGameAction({ type: "playMove", row, col })}
          onVictoryNewGame={startNewGame}
          onVictoryUndo={() => handleGameAction({ type: "undo" })}
          canUndo={multiplayer.canUseUndoRedo && gameState.undoStack.length > 0}
          canRedo={multiplayer.canUseUndoRedo && gameState.redoStack.length > 0}
          onUndo={() => handleGameAction({ type: "undo" })}
          onRedo={() => handleGameAction({ type: "redo" })}
          interactionLocked={multiplayer.isOnline && !multiplayer.canPlayLocalTurn}
          victoryNewGameDisabled={!multiplayer.canStartNewGame}
          victoryUndoDisabled={!multiplayer.canUseUndoRedo}
          skipTurnInteractive={multiplayer.canPlayLocalTurn}
          onSkipTurn={() => handleGameAction({ type: "skipTurn" })}
          surrenderInteractive={multiplayer.canPlayLocalTurn}
          onSurrender={() => handleGameAction({ type: "surrender" })}
          victoryOnlineNameContext={victoryOnlineNameContext}
        />
      </main>

      <HelpModal
        open={modal.open}
        title={modal.title}
        html={modal.html}
        onClose={closeModal}
      />

      <FloatingMultiplayerPanel multiplayer={multiplayer} />

      {multiplayer.hostDisconnectedToastOpen && (
        <div className="host-disconnect-toast-layer" role="status" aria-live="polite">
          <div className="host-disconnect-toast">{t("multiplayer.system.hostDisconnected")}</div>
        </div>
      )}
    </div>
  );
}

function buildOfflineGameConfig(config: GameConfig): GameConfig {
  return {
    ...config,
    roster: DEFAULT_ROSTER.map((player) => ({ ...player }))
  };
}

function buildOnlineGameConfig(config: GameConfig, players: Array<{ symbol: GameConfig["roster"][number]["id"] | null; connected: boolean }>): GameConfig {
  const connectedSymbols = players
    .filter((player) => player.connected && player.symbol !== null)
    .map((player) => player.symbol)
    .filter((symbol): symbol is GameConfig["roster"][number]["id"] => symbol !== null);

  const selectedCount = Math.min(config.playerCount, connectedSymbols.length);
  const selectedSymbols = shuffle(connectedSymbols).slice(0, selectedCount);
  const orderedSymbols = shuffle(selectedSymbols);
  const colorsById = new Map(DEFAULT_ROSTER.map((player) => [player.id, player.color]));
  const roster = orderedSymbols.map((id) => ({ id, color: colorsById.get(id) ?? "#ffffff" }));

  for (const player of DEFAULT_ROSTER) {
    if (!roster.some((entry) => entry.id === player.id)) {
      roster.push({ ...player });
    }
  }

  return {
    ...config,
    roster,
    playerCount: selectedCount
  };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
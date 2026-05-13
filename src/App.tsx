import { useCallback, useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { HelpModal } from "./components/HelpModal";
import { MatchStatusBanner } from "./components/MatchStatusBanner";
import { FloatingMultiplayerPanel } from "./components/MultiplayerPanel";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { getStatusText } from "./game/formatters";
import { createInitialGameState, reduceGameState } from "./game/reducer";
import { mustMovePiece } from "./game/rules";
import type { GameAction, GameConfig, GameState } from "./game/types";
import { useDraftConfig } from "./hooks/useDraftConfig";
import { useGameClock } from "./hooks/useGameClock";
import { useHelpModal } from "./hooks/useHelpModal";
import { usePendingGravityRotation } from "./hooks/usePendingGravityRotation";
import { useMultiplayer } from "./multiplayer/useMultiplayer";

export default function App() {
  const {
    draftConfig,
    updateDraftConfig,
    sanitizeDraftConfig,
    replaceDraftConfig
  } = useDraftConfig();
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

  const { modal, closeModal, openHelp, openRulesHelp } = useHelpModal(gameState);
  const multiplayer = useMultiplayer({
    gameState,
    applyGameActionAsHost: applyGameAction,
    replaceGameState,
    replaceDraftConfig
  });
  const showDevMultiplayer = useMemo(() => hasDevQueryParam(), []);

  const handleGameAction = useCallback((action: GameAction) => {
    if (multiplayer.isClient) {
      if (action.type === "playMove") {
        multiplayer.sendGameAction(action);
      }
      return;
    }

    if (
      multiplayer.isHost &&
      action.type === "playMove" &&
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

  const topbarClockText = useGameClock(gameState, handleHostEventAction);

  usePendingGravityRotation(gameState, handleHostEventAction);

  const statusAriaLabel = useMemo(
    () => getStatusText(gameState, gameState.config, mustMovePiece),
    [gameState]
  );

  function startNewGame() {
    if (!multiplayer.canStartNewGame) return;
    const nextConfig = sanitizeDraftConfig();
    handleGameAction({ type: "newGame", config: nextConfig });
  }

  function applyPreset(config: GameConfig) {
    if (!multiplayer.canStartNewGame) return;
    const nextConfig = replaceDraftConfig(config);
    handleGameAction({ type: "newGame", config: nextConfig });
  }

  return (
    <div className="app">
      <TopBar
        statusAriaLabel={statusAriaLabel}
        clockText={topbarClockText}
        canUndo={multiplayer.canUseUndoRedo && gameState.undoStack.length > 0}
        canRedo={multiplayer.canUseUndoRedo && gameState.redoStack.length > 0}
        onUndo={() => handleGameAction({ type: "undo" })}
        onRedo={() => handleGameAction({ type: "redo" })}
      >
        <MatchStatusBanner state={gameState} mustMove={mustMovePiece} compactRanking />
      </TopBar>

      <main className="layout">
        <Sidebar
          config={draftConfig}
          liveGame={gameState}
          onChangeConfig={updateDraftConfig}
          onNewGame={startNewGame}
          onApplyPreset={applyPreset}
          onHelp={openHelp}
          onRulesHelp={openRulesHelp}
          readOnlyConfig={!multiplayer.canEditConfig}
          canStartNewGame={multiplayer.canStartNewGame}
        />

        <Board
          state={gameState}
          onPlayMove={(row, col) => handleGameAction({ type: "playMove", row, col })}
          onVictoryNewGame={startNewGame}
          onVictoryUndo={() => handleGameAction({ type: "undo" })}
          interactionLocked={multiplayer.isOnline && !multiplayer.canPlayLocalTurn}
          victoryNewGameDisabled={!multiplayer.canStartNewGame}
          victoryUndoDisabled={!multiplayer.canUseUndoRedo}
        />
      </main>

      <HelpModal
        open={modal.open}
        title={modal.title}
        html={modal.html}
        onClose={closeModal}
      />

      {showDevMultiplayer && <FloatingMultiplayerPanel multiplayer={multiplayer} />}
    </div>
  );
}

function hasDevQueryParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("dev");
}
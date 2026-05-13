import { useCallback, useMemo, useReducer } from "react";
import { Board } from "./components/Board";
import { HelpModal } from "./components/HelpModal";
import { MatchStatusBanner } from "./components/MatchStatusBanner";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { getStatusText } from "./game/formatters";
import { createInitialGameState, gameReducer } from "./game/reducer";
import { mustMovePiece } from "./game/rules";
import type { GameAction, GameConfig } from "./game/types";
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
  const [gameState, dispatch] = useReducer(gameReducer, draftConfig, createInitialGameState);
  const topbarClockText = useGameClock(gameState, dispatch);
  const { modal, closeModal, openHelp, openRulesHelp } = useHelpModal(gameState);
  const multiplayer = useMultiplayer();

  usePendingGravityRotation(gameState, dispatch);

  const handleGameAction = useCallback((action: GameAction) => {
    dispatch(action);
  }, []);

  const statusAriaLabel = useMemo(
    () => getStatusText(gameState, gameState.config, mustMovePiece),
    [gameState]
  );

  function startNewGame() {
    const nextConfig = sanitizeDraftConfig();
    handleGameAction({ type: "newGame", config: nextConfig });
  }

  function applyPreset(config: GameConfig) {
    const nextConfig = replaceDraftConfig(config);
    handleGameAction({ type: "newGame", config: nextConfig });
  }

  return (
    <div className="app">
      <TopBar
        statusAriaLabel={statusAriaLabel}
        clockText={topbarClockText}
        canUndo={gameState.undoStack.length > 0}
        canRedo={gameState.redoStack.length > 0}
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
          multiplayer={multiplayer}
        />

        <Board
          state={gameState}
          onPlayMove={(row, col) => handleGameAction({ type: "playMove", row, col })}
          onVictoryNewGame={startNewGame}
          onVictoryUndo={() => handleGameAction({ type: "undo" })}
        />
      </main>

      <HelpModal
        open={modal.open}
        title={modal.title}
        html={modal.html}
        onClose={closeModal}
      />

    </div>
  );
}
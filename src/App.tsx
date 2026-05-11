import { useEffect, useMemo, useReducer, useState } from "react";
import { Board } from "./components/Board";
import { HelpModal } from "./components/HelpModal";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import {
  DEFAULT_BROKEN_HOLE_TURNS,
  DEFAULT_CONFIG,
  DEFAULT_GRAVITY_ROTATION_PAUSE_MS,
  DEFAULT_GRAVITY_ROTATE_EVERY_TURNS,
  DEFAULT_MAX_PIECES_PER_PLAYER,
  DEFAULT_PLAYER_COUNT
} from "./game/defaults";
import { clampInt, normalizeMoveMode, normalizeRoster, sanitizeConfig } from "./game/config";
import { buildRulesText, getStatusText } from "./game/formatters";
import { createInitialGameState, gameReducer } from "./game/reducer";
import { mustMovePiece } from "./game/rules";
import type { GameConfig, RosterPlayer } from "./game/types";
import { t } from "./i18n";

interface ModalState {
  open: boolean;
  title: string;
  html: string;
}

export default function App() {
  const [draftConfig, setDraftConfig] = useState<GameConfig>(() => sanitizeConfig(DEFAULT_CONFIG));
  const [gameState, dispatch] = useReducer(gameReducer, DEFAULT_CONFIG, createInitialGameState);
  const [modal, setModal] = useState<ModalState>(() => ({
    open: false,
    title: t("modal.helpTitle"),
    html: ""
  }));

  function closeModal() {
    setModal({ open: false, title: t("modal.helpTitle"), html: "" });
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (gameState.pendingGravityRotationTarget === null) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "completePendingGravityRotation" });
    }, DEFAULT_GRAVITY_ROTATION_PAUSE_MS);
    return () => window.clearTimeout(id);
  }, [gameState.pendingGravityRotationTarget, dispatch]);

  const status = useMemo(
    () => getStatusText(gameState, gameState.config, mustMovePiece),
    [gameState]
  );

  function updateDraftConfig(patch: Partial<GameConfig>) {
    setDraftConfig((previous) => {
      const next: GameConfig = { ...previous, ...patch };

      if (patch.roster !== undefined) {
        next.roster = normalizeRoster(patch.roster);
        if (next.playerCount > next.roster.length) {
          next.playerCount = next.roster.length;
        }
      }

      if (patch.playerCount !== undefined) {
        next.playerCount = clampInt(
          next.playerCount,
          2,
          Math.max(2, next.roster.length),
          Math.min(DEFAULT_PLAYER_COUNT, next.roster.length)
        );
      }

      if (patch.pieceLimitType !== undefined || patch.pieceMoveMode !== undefined) {
        next.pieceMoveMode = normalizeMoveMode(next.pieceLimitType, next.pieceMoveMode);
      }

      if (next.pieceLimitType === "limited" && next.maxPiecesPerPlayer <= 0) {
        next.maxPiecesPerPlayer = DEFAULT_MAX_PIECES_PER_PLAYER;
      }

      next.columns = clampInt(next.columns, 3, 12, DEFAULT_CONFIG.columns);
      next.rows = clampInt(next.rows, 3, 12, DEFAULT_CONFIG.rows);
      next.lineLength = clampInt(next.lineLength, 2, Math.max(next.columns, next.rows), DEFAULT_CONFIG.lineLength);
      next.maxPiecesPerPlayer = next.pieceLimitType === "unlimited"
        ? next.maxPiecesPerPlayer
        : clampInt(next.maxPiecesPerPlayer, 1, 99, DEFAULT_MAX_PIECES_PER_PLAYER);
      next.brokenHoleTurns = clampInt(next.brokenHoleTurns, 1, 99, DEFAULT_BROKEN_HOLE_TURNS);
      next.gravityRotateEveryTurns = clampInt(
        next.gravityRotateEveryTurns,
        1,
        99,
        DEFAULT_GRAVITY_ROTATE_EVERY_TURNS
      );

      return next;
    });
  }

  function applyRoster(nextRoster: RosterPlayer[]) {
    updateDraftConfig({ roster: nextRoster });
  }

  function startNewGame() {
    const nextConfig = sanitizeConfig(draftConfig);
    setDraftConfig(nextConfig);
    dispatch({ type: "newGame", config: nextConfig });
  }

  function openHelp(helpKey: string) {
    const title = t(`help.${helpKey}.title`);
    const html = t(`help.${helpKey}.html`);
    setModal({ open: true, title, html });
  }

  function openRulesHelp() {
    const newGameStrong = `<strong>${t("buttons.newGame")}</strong>`;
    setModal({
      open: true,
      title: t("modal.rulesCurrentTitle"),
      html: `<p>${buildRulesText(gameState.config)}</p><p>${t("rules.modal.intro", { newGame: newGameStrong })}</p>`
    });
  }

  return (
    <div className="app">
      <TopBar
        status={status}
        canUndo={gameState.undoStack.length > 0}
        canRedo={gameState.redoStack.length > 0}
        onUndo={() => dispatch({ type: "undo" })}
        onRedo={() => dispatch({ type: "redo" })}
      />

      <main className="layout">
        <Sidebar
          config={draftConfig}
          onChangeConfig={updateDraftConfig}
          onNewGame={startNewGame}
          onHelp={openHelp}
          onRulesHelp={openRulesHelp}
          onApplyRoster={applyRoster}
        />

        <Board
          state={gameState}
          onPlayMove={(row, col) => dispatch({ type: "playMove", row, col })}
          onVictoryNewGame={startNewGame}
          onVictoryUndo={() => dispatch({ type: "undo" })}
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

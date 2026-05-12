import { Info, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { mustMovePiece } from "../game/rules";
import type { GameConfig, GameState, RosterPlayer } from "../game/types";
import { t } from "../i18n";
import { MatchStatusBanner, getMatchStatusAriaText } from "./MatchStatusBanner";
import { PlayersModal } from "./PlayersModal";
import { PresetModal } from "./PresetModal";
import {
  BrokenHolesSettingsSection,
  ClockSettingsSection,
  GeneralSettingsSection,
  GravitySettingsSection,
  PiecesSettingsSection,
  PlayersSettingsSection
} from "./SidebarSections";
import { Tooltip } from "./Tooltip";

interface SidebarProps {
  config: GameConfig;
  liveGame: GameState;
  onChangeConfig: (patch: Partial<GameConfig>) => void;
  onNewGame: () => void;
  onApplyPreset: (config: GameConfig) => void;
  onHelp: (helpKey: string) => void;
  onRulesHelp: () => void;
  onApplyRoster: (roster: RosterPlayer[]) => void;
}

export function Sidebar({
  config,
  liveGame,
  onChangeConfig,
  onNewGame,
  onApplyPreset,
  onHelp,
  onRulesHelp,
  onApplyRoster
}: SidebarProps) {
  const [playersModalOpen, setPlayersModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-sticky">
        <div className="new-game-row">
          <button className="button full" type="button" onClick={onNewGame}>{t("buttons.newGame")}</button>
          <Tooltip text={t("presets.openTitle")}>
            <button className="help-button large" type="button" onClick={() => setPresetModalOpen(true)}>
              <SlidersHorizontal aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip text={t("actions.viewRulesCurrent")}>
            <button className="help-button large" type="button" onClick={onRulesHelp}>
              <Info aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        {liveGame.gameOver && liveGame.gameEndSummary && (
          <div
            className="sidebar-match-outcome"
            role="status"
            aria-label={getMatchStatusAriaText(liveGame, mustMovePiece)}
          >
            <div className="sidebar-match-outcome-title">{t("sidebar.matchOutcome")}</div>
            <div className="sidebar-match-outcome-body">
              <MatchStatusBanner state={liveGame} mustMove={mustMovePiece} compactRanking={false} />
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-content">
        <GeneralSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <PiecesSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <PlayersSettingsSection
          config={config}
          onChangeConfig={onChangeConfig}
          onHelp={onHelp}
          onOpenPlayers={() => setPlayersModalOpen(true)}
        />
        <BrokenHolesSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <GravitySettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <ClockSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
      </div>

      <PresetModal
        open={presetModalOpen}
        draftConfig={config}
        onClose={() => setPresetModalOpen(false)}
        onApplyPreset={(next) => {
          onApplyPreset(next);
          setPresetModalOpen(false);
        }}
      />

      <PlayersModal
        open={playersModalOpen}
        roster={config.roster}
        onClose={() => setPlayersModalOpen(false)}
        onApply={onApplyRoster}
      />
    </aside>
  );
}
import { Info, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { mustMovePiece } from "../game/rules";
import type { GameConfig, GameState } from "../game/types";
import { t } from "../i18n";
import { MatchStatusBanner, getMatchStatusAriaText } from "./MatchStatusBanner";
import { PresetModal } from "./PresetModal";
import {
  BrokenHolesSettingsSection,
  ClockSettingsSection,
  CollapseSettingsSection,
  GeneralSettingsSection,
  GravitySettingsSection,
  ObjectiveSettingsSection,
  PiecesSettingsSection,
  PlayersSettingsSection,
  RestrictionsSettingsSection
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
  readOnlyConfig?: boolean;
  canStartNewGame?: boolean;
  maxPlayerCount?: number;
}

export function Sidebar({
  config,
  liveGame,
  onChangeConfig,
  onNewGame,
  onApplyPreset,
  onHelp,
  onRulesHelp,
  readOnlyConfig = false,
  canStartNewGame = true,
  maxPlayerCount
}: SidebarProps) {
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-sticky">
        <div className="new-game-row">
          <button className="button full" type="button" disabled={!canStartNewGame} onClick={onNewGame}>{t("buttons.newGame")}</button>
          <Tooltip text={t("presets.openTitle")}>
            <button className="help-button large" type="button" disabled={readOnlyConfig} onClick={() => setPresetModalOpen(true)}>
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

      <fieldset className="sidebar-content sidebar-content-fieldset" disabled={readOnlyConfig}>
        <GeneralSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <ObjectiveSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <PiecesSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <PlayersSettingsSection
          config={config}
          onChangeConfig={onChangeConfig}
          onHelp={onHelp}
          maxPlayerCount={maxPlayerCount}
        />
        <ClockSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <RestrictionsSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <GravitySettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <BrokenHolesSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
        <CollapseSettingsSection config={config} onChangeConfig={onChangeConfig} onHelp={onHelp} />
      </fieldset>

      <PresetModal
        open={presetModalOpen}
        draftConfig={config}
        onClose={() => setPresetModalOpen(false)}
        onApplyPreset={(next) => {
          onApplyPreset(next);
          setPresetModalOpen(false);
        }}
      />

    </aside>
  );
}
import { DEFAULT_MAX_PIECES_PER_PLAYER } from "../game/defaults";
import { getMoveModeHelp, getMoveModeOptions } from "../game/config";
import type { GameConfig, LineRule, PieceLimitType, PieceMoveMode } from "../game/types";
import { SettingsSection } from "./SettingsSection";
import { t } from "../i18n";

interface SidebarProps {
  config: GameConfig;
  onChangeConfig: (patch: Partial<GameConfig>) => void;
  onNewGame: () => void;
  onHelp: (helpKey: string) => void;
  onRulesHelp: () => void;
}

export function Sidebar({ config, onChangeConfig, onNewGame, onHelp, onRulesHelp }: SidebarProps) {
  const unlimitedPieces = config.pieceLimitType === "unlimited";
  const moveModeOptions = getMoveModeOptions(config.pieceLimitType);
  const lineMax = Math.max(config.columns, config.rows);

  return (
    <aside className="sidebar">
      <div className="sidebar-sticky">
        <div className="new-game-row">
          <button className="button full" type="button" onClick={onNewGame}>{t("buttons.newGame")}</button>
          <button className="help-button large" title={t("actions.viewRulesCurrent")} type="button" onClick={onRulesHelp}>{t("ui.helpInfoGlyph")}</button>
        </div>
      </div>

      <div className="sidebar-content">
        <SettingsSection title={t("sections.general")} icon="◎" helpKey="general" defaultOpen onHelp={onHelp}>
          <div className="field-row">
            <label className="field">
              {t("fields.columns")}
              <input
                type="number"
                min={3}
                max={12}
                step={1}
                value={config.columns}
                onChange={(event) => onChangeConfig({ columns: Number(event.target.value) })}
              />
            </label>

            <label className="field">
              {t("fields.rows")}
              <input
                type="number"
                min={3}
                max={12}
                step={1}
                value={config.rows}
                onChange={(event) => onChangeConfig({ rows: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="field-row compact">
            <label className="field">
              {t("fields.winLose")}
              <select
                value={config.lineRule}
                onChange={(event) => onChangeConfig({ lineRule: event.target.value as LineRule })}
              >
                <option value="lose">{t("fields.lose")}</option>
                <option value="win">{t("fields.win")}</option>
              </select>
            </label>

            <label className="field">
              {t("fields.lineLength")}
              <input
                type="number"
                min={2}
                max={lineMax}
                step={1}
                value={config.lineLength}
                onChange={(event) => onChangeConfig({ lineLength: Number(event.target.value) })}
              />
            </label>
          </div>
        </SettingsSection>

        <SettingsSection title={t("sections.pieces")} icon="●" helpKey="pieces" defaultOpen onHelp={onHelp}>
          <div className="field-row toggle-and-number">
            <label className="field checkbox boxed">
              <span>{t("fields.unlimitedPieces")}</span>
              <input
                type="checkbox"
                checked={unlimitedPieces}
                onChange={(event) => onChangeConfig({ pieceLimitType: event.target.checked ? "unlimited" : "limited" as PieceLimitType })}
              />
            </label>

            <label className="field">
              {t("fields.quantity")}
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                disabled={unlimitedPieces}
                value={config.maxPiecesPerPlayer || DEFAULT_MAX_PIECES_PER_PLAYER}
                onChange={(event) => onChangeConfig({ maxPiecesPerPlayer: Number(event.target.value) })}
              />
            </label>
          </div>

          <label className="field">
            {t("fields.changePiecePlace")}
            <select
              value={config.pieceMoveMode}
              onChange={(event) => onChangeConfig({ pieceMoveMode: event.target.value as PieceMoveMode })}
            >
              {moveModeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{getMoveModeHelp(config.pieceLimitType)}</span>
          </label>
        </SettingsSection>

        <SettingsSection
          title={t("sections.holes")}
          icon="✦"
          helpKey="holes"
          onHelp={onHelp}
          titleToggle={
            <label className="section-toggle" title={t("fields.enableBrokenHoles")} onClick={(event) => event.stopPropagation()}>
              <input
                type="checkbox"
                checked={config.brokenEnabled}
                onChange={(event) => onChangeConfig({ brokenEnabled: event.target.checked })}
              />
            </label>
          }
        >
          <label className="field">
            {t("fields.turns")}
            <input
              type="number"
              min={0}
              max={99}
              step={1}
              disabled={!config.brokenEnabled}
              value={config.brokenHoleTurns}
              onChange={(event) => onChangeConfig({ brokenHoleTurns: Number(event.target.value) })}
            />
            <span className="field-help">{t("fields.brokenTurnsInfo")}</span>
          </label>
        </SettingsSection>

        <SettingsSection
          title={t("sections.gravity")}
          icon="↓"
          helpKey="gravity"
          onHelp={onHelp}
          titleToggle={
            <label className="section-toggle" title={t("fields.enableGravity")} onClick={(event) => event.stopPropagation()}>
              <input
                type="checkbox"
                checked={config.gravityEnabled}
                onChange={(event) => onChangeConfig({ gravityEnabled: event.target.checked })}
              />
            </label>
          }
        >
          <span className="field-help">{t("fields.gravityInfo")}</span>
        </SettingsSection>
      </div>
    </aside>
  );
}

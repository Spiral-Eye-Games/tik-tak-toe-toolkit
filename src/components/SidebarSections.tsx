import { ArrowDown, CircleDot, CircleOff, Grid3X3, Timer, UsersRound } from "lucide-react";
import { DEFAULT_MAX_PIECES_PER_PLAYER } from "../game/defaults";
import {
  getMoveModeHelp,
  getMoveModeOptions,
  getResolvedBrokenHoleTurns,
  getResolvedGravityRotateInterval,
  normalizeClockStrategy
} from "../game/config";
import type {
  GameConfig,
  GravityDirection,
  GravityRotateAngle,
  GravityRotateSpin,
  LineRule,
  PieceLimitType,
  PieceMoveMode
} from "../game/types";
import { t } from "../i18n";
import { SettingsSection } from "./SettingsSection";

interface SidebarSectionProps {
  config: GameConfig;
  onChangeConfig: (patch: Partial<GameConfig>) => void;
  onHelp: (helpKey: string) => void;
}

export function GeneralSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const lineMax = Math.max(config.columns, config.rows);

  return (
    <SettingsSection title={t("sections.general")} icon={<Grid3X3 aria-hidden="true" />} helpKey="general" defaultOpen onHelp={onHelp}>
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
  );
}

export function PiecesSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const unlimitedPieces = config.pieceLimitType === "unlimited";
  const moveModeOptions = getMoveModeOptions(config.pieceLimitType);

  return (
    <SettingsSection title={t("sections.pieces")} icon={<CircleDot aria-hidden="true" />} helpKey="pieces" defaultOpen onHelp={onHelp}>
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
  );
}

interface PlayersSettingsSectionProps extends SidebarSectionProps {
  onOpenPlayers: () => void;
}

export function PlayersSettingsSection({
  config,
  onChangeConfig,
  onHelp,
  onOpenPlayers
}: PlayersSettingsSectionProps) {
  const playerOptions = Array.from(
    { length: Math.max(0, config.roster.length - 1) },
    (_, index) => index + 2
  );

  return (
    <SettingsSection title={t("sections.players")} icon={<UsersRound aria-hidden="true" />} helpKey="players" onHelp={onHelp}>
      <div className="field-row players-tool-row">
        <label className="field">
          {t("fields.playerCount")}
          <select
            value={config.playerCount}
            onChange={(event) => onChangeConfig({ playerCount: Number(event.target.value) })}
          >
            {playerOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <div className="players-customize-cell">
          <button className="button secondary" type="button" onClick={onOpenPlayers}>
            {t("fields.customizePlayers")}
          </button>
        </div>
      </div>

      {config.lineRule === "lose" && config.playerCount > 2 && (
        <label className="field checkbox boxed">
          <span>{t("fields.eliminateLosers")}</span>
          <input
            type="checkbox"
            checked={config.eliminateLosers}
            onChange={(event) => onChangeConfig({ eliminateLosers: event.target.checked })}
          />
        </label>
      )}

      {config.lineRule === "win" && config.playerCount > 2 && (
        <label className="field checkbox boxed">
          <span>{t("fields.continueRanking")}</span>
          <input
            type="checkbox"
            checked={config.continueRanking}
            onChange={(event) => onChangeConfig({ continueRanking: event.target.checked })}
          />
        </label>
      )}

      {config.lineRule === "win" && config.playerCount > 2 && config.continueRanking && (
        <label className="field checkbox boxed">
          <span>{t("fields.eliminateWinners")}</span>
          <input
            type="checkbox"
            checked={config.eliminateWinners}
            onChange={(event) => onChangeConfig({ eliminateWinners: event.target.checked })}
          />
        </label>
      )}
    </SettingsSection>
  );
}

export function BrokenHolesSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  return (
    <SettingsSection
      title={t("sections.holes")}
      icon={<CircleOff aria-hidden="true" />}
      helpKey="holes"
      onHelp={onHelp}
      toggleExpanded={config.brokenEnabled}
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
      <div className="field-row broken-rupture-row">
        <label className="field">
          {t("fields.turns")}
          <input
            type="number"
            min={1}
            max={99}
            step={1}
            disabled={!config.brokenEnabled || config.brokenHoleUnlimited}
            value={config.brokenHoleTurns}
            onChange={(event) => onChangeConfig({ brokenHoleTurns: Number(event.target.value) })}
          />
        </label>
        <label className="field checkbox boxed broken-rupture-check">
          <span>{t("fields.brokenUnlimited")}</span>
          <input
            type="checkbox"
            disabled={!config.brokenEnabled}
            checked={config.brokenHoleUnlimited}
            onChange={(event) => onChangeConfig({ brokenHoleUnlimited: event.target.checked })}
          />
        </label>
      </div>
      <div className="field-row broken-rupture-per-player-row">
        <label className="field checkbox boxed broken-rupture-check">
          <span>{t("fields.brokenTurnsPerPlayer")}</span>
          <input
            type="checkbox"
            disabled={!config.brokenEnabled || config.brokenHoleUnlimited}
            checked={config.brokenHoleTurnsPerPlayer}
            onChange={(event) => onChangeConfig({ brokenHoleTurnsPerPlayer: event.target.checked })}
          />
        </label>
      </div>
      <span className="field-help">
        {config.brokenHoleUnlimited
          ? t("fields.brokenTurnsInfoUnlimited")
          : config.brokenHoleTurnsPerPlayer
            ? t("fields.brokenTurnsInfoPerPlayer", {
              base: config.brokenHoleTurns,
              players: config.playerCount,
              total: getResolvedBrokenHoleTurns(config)
            })
            : t("fields.brokenTurnsInfo")}
      </span>
    </SettingsSection>
  );
}

export function GravitySettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  return (
    <SettingsSection
      title={t("sections.gravity")}
      icon={<ArrowDown aria-hidden="true" />}
      helpKey="gravity"
      onHelp={onHelp}
      toggleExpanded={config.gravityEnabled}
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
      <label className="field">
        {t("fields.gravityInitialDirection")}
        <select
          disabled={!config.gravityEnabled}
          value={config.gravityInitialDirection}
          onChange={(event) => onChangeConfig({ gravityInitialDirection: event.target.value as GravityDirection })}
        >
          <option value="down">{t("rules.gravity.direction.down")}</option>
          <option value="up">{t("rules.gravity.direction.up")}</option>
          <option value="left">{t("rules.gravity.direction.left")}</option>
          <option value="right">{t("rules.gravity.direction.right")}</option>
        </select>
      </label>

      <label className="field checkbox boxed">
        <span>{t("fields.gravityRotate")}</span>
        <input
          type="checkbox"
          disabled={!config.gravityEnabled}
          checked={config.gravityRotateEnabled}
          onChange={(event) => onChangeConfig({ gravityRotateEnabled: event.target.checked })}
        />
      </label>

      {config.gravityEnabled && config.gravityRotateEnabled && (
        <>
          <div className="field-row">
            <label className="field">
              {t("fields.gravityRotateAngle")}
              <select
                value={config.gravityRotateAngle}
                onChange={(event) => onChangeConfig({ gravityRotateAngle: event.target.value as GravityRotateAngle })}
              >
                <option value="90">{t("rules.gravity.rotateAngle.90")}</option>
                <option value="180">{t("rules.gravity.rotateAngle.180")}</option>
                <option value="270">{t("rules.gravity.rotateAngle.270")}</option>
                <option value="random">{t("rules.gravity.rotateAngle.random")}</option>
              </select>
            </label>

            <label className="field">
              {t("fields.gravityRotateSpin")}
              <select
                value={config.gravityRotateSpin}
                onChange={(event) => onChangeConfig({ gravityRotateSpin: event.target.value as GravityRotateSpin })}
              >
                <option value="cw">{t("rules.gravity.rotateSpin.cw")}</option>
                <option value="ccw">{t("rules.gravity.rotateSpin.ccw")}</option>
                <option value="random">{t("rules.gravity.rotateSpin.random")}</option>
              </select>
            </label>
          </div>

          <div className="field-row toggle-and-number">
            <label className="field">
              {t("fields.gravityRotateEvery")}
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                value={config.gravityRotateEveryTurns}
                onChange={(event) => onChangeConfig({ gravityRotateEveryTurns: Number(event.target.value) })}
              />
            </label>

            <label className="field checkbox boxed">
              <span>{t("fields.gravityRotatePerPlayer")}</span>
              <input
                type="checkbox"
                checked={config.gravityRotateEveryTurnsPerPlayer}
                onChange={(event) =>
                  onChangeConfig({ gravityRotateEveryTurnsPerPlayer: event.target.checked })
                }
              />
            </label>
          </div>

          <span className="field-help">
            {config.gravityRotateEveryTurnsPerPlayer
              ? t("fields.gravityRotateInfoPerPlayer", {
                base: config.gravityRotateEveryTurns,
                players: config.playerCount,
                total: getResolvedGravityRotateInterval(config)
              })
              : t("fields.gravityRotateInfo", { turns: getResolvedGravityRotateInterval(config) })}
          </span>
        </>
      )}
    </SettingsSection>
  );
}

export function ClockSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  return (
    <SettingsSection
      title={t("sections.clock")}
      icon={<Timer aria-hidden="true" />}
      helpKey="clock"
      onHelp={onHelp}
      toggleExpanded={config.clockEnabled}
      titleToggle={
        <label className="section-toggle" title={t("fields.clockEnabled")} onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={config.clockEnabled}
            onChange={(event) => onChangeConfig({ clockEnabled: event.target.checked })}
          />
        </label>
      }
    >
      {config.clockEnabled && (
        <label className="field">
          {t("fields.clockType")}
          <select
            value={config.clockMode}
            onChange={(event) => onChangeConfig({ clockMode: normalizeClockStrategy(event.target.value) })}
          >
            <option value="bank">{t("clock.modes.bank")}</option>
            <option value="perTurn">{t("clock.modes.perTurn")}</option>
          </select>
        </label>
      )}

      {config.clockEnabled && config.clockMode === "bank" && (
        <>
          <label className="field">
            {t("fields.clockBankSeconds")}
            <input
              type="number"
              step={1}
              value={config.clockBankSeconds}
              onChange={(event) => onChangeConfig({ clockBankSeconds: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            {t("fields.clockRecoverSeconds")}
            <input
              type="number"
              step={1}
              value={config.clockRecoverSeconds}
              onChange={(event) => onChangeConfig({ clockRecoverSeconds: Number(event.target.value) })}
            />
          </label>
          <span className="field-help">{t("fields.clockHintBank")}</span>
        </>
      )}

      {config.clockEnabled && config.clockMode === "perTurn" && (
        <>
          <label className="field">
            {t("fields.clockPerTurnSeconds")}
            <input
              type="number"
              step={1}
              value={config.clockPerTurnSeconds}
              onChange={(event) => onChangeConfig({ clockPerTurnSeconds: Number(event.target.value) })}
            />
          </label>
          <span className="field-help">{t("fields.clockHintPerTurn")}</span>
        </>
      )}
    </SettingsSection>
  );
}

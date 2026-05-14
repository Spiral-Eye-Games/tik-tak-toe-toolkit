import { useState } from "react";
import { ArrowDown, ChevronsLeftRight, CircleDot, CircleOff, Grid3X3, Info, Lock, Timer, UsersRound } from "lucide-react";
import { DEFAULT_MAX_PIECES_PER_PLAYER } from "../game/defaults";
import { normalizeClockStrategy } from "../game/config";
import { movementSupportsConversion } from "../game/restrictions";
import type {
  CollapseType,
  GameConfig,
  GravityDirection,
  GravityRotateAngle,
  GravityRotateSpin,
  LineRule,
  RestrictionMovementMode
} from "../game/types";
import { t } from "../i18n";
import { MovementInfoModal } from "./MovementInfoModal";
import { NumericDraftInput } from "./NumericDraftInput";
import { QuantityModeDraftInput, TimeIntervalDraftInput, type TimeIntervalPickerMode } from "./NumericModeInputs";
import { PieceMoveModeSelect } from "./PieceMoveModeSelect";
import { RestrictionGridModal } from "./RestrictionGridModal";
import { SettingsSection } from "./SettingsSection";
import { Tooltip } from "./Tooltip";

interface SidebarSectionProps {
  config: GameConfig;
  onChangeConfig: (patch: Partial<GameConfig>) => void;
  onHelp: (helpKey: string) => void;
  maxPlayerCount?: number;
}

function brokenHoleTimePickerMode(config: GameConfig): TimeIntervalPickerMode {
  if (config.brokenHoleUnlimited) return "infinite";
  return config.brokenHoleDurationUnit === "rounds" ? "rounds" : "turns";
}

function skipTurnBlockPickerMode(config: GameConfig): TimeIntervalPickerMode {
  if (config.skipTurnBlockMode === "infinite") return "infinite";
  return config.skipTurnBlockMode === "rounds" ? "rounds" : "turns";
}

export function GeneralSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const lineMax = Math.max(config.columns, config.rows);

  return (
    <SettingsSection title={t("sections.general")} icon={<Grid3X3 aria-hidden="true" />} helpKey="general" defaultOpen onHelp={onHelp}>
      <div className="field-row">
        <label className="field">
          {t("fields.columns")}
          <NumericDraftInput
            min={3}
            max={12}
            step={1}
            value={config.columns}
            onCommit={(value) => onChangeConfig({ columns: value })}
          />
        </label>

        <label className="field">
          {t("fields.rows")}
          <NumericDraftInput
            min={3}
            max={12}
            step={1}
            value={config.rows}
            onCommit={(value) => onChangeConfig({ rows: value })}
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
          <NumericDraftInput
            min={2}
            max={lineMax}
            step={1}
            value={config.lineLength}
            onCommit={(value) => onChangeConfig({ lineLength: value })}
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          {t("fields.skipTurnBlock")}
          <TimeIntervalDraftInput
            min={0}
            max={99}
            step={1}
            allowedModes={["turns", "rounds", "infinite"]}
            mode={skipTurnBlockPickerMode(config)}
            value={config.skipTurnBlockTurns}
            onValueCommit={(value) => onChangeConfig({ skipTurnBlockTurns: value })}
            onModeChange={(nextMode) => {
              if (nextMode === "infinite") {
                onChangeConfig({ skipTurnBlockMode: "infinite" });
              } else {
                onChangeConfig({
                  skipTurnBlockMode: nextMode === "rounds" ? "rounds" : "turns"
                });
              }
            }}
          />
        </label>
      </div>
    </SettingsSection>
  );
}

export function PiecesSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const [movementInfoOpen, setMovementInfoOpen] = useState(false);

  return (
    <SettingsSection title={t("sections.pieces")} icon={<CircleDot aria-hidden="true" />} helpKey="pieces" defaultOpen onHelp={onHelp}>
      <div className="field-row field-row--pieces-move">
        <label className="field">
          {t("fields.quantity")}
          <QuantityModeDraftInput
            min={1}
            max={99}
            step={1}
            allowedModes={["infinite", "value"]}
            mode={config.pieceLimitType === "unlimited" ? "infinite" : "value"}
            value={config.maxPiecesPerPlayer || DEFAULT_MAX_PIECES_PER_PLAYER}
            onValueCommit={(value) => onChangeConfig({ maxPiecesPerPlayer: value })}
            onModeChange={(nextMode) => {
              if (nextMode === "infinite") onChangeConfig({ pieceLimitType: "unlimited" });
              else onChangeConfig({ pieceLimitType: "limited" });
            }}
          />
        </label>

        <label className="field">
          {t("fields.pieceMovement")}
          <PieceMoveModeSelect
            pieceLimitType={config.pieceLimitType}
            value={config.pieceMoveMode}
            onChange={(mode) => onChangeConfig({ pieceMoveMode: mode })}
          />
        </label>
      </div>

      {config.pieceMoveMode !== "blocked" && (
        <>
          <label className="field">
            {t("fields.restrictionMode")}
            <div className="select-with-info">
              <select
                value={config.restrictionMovementMode}
                onChange={(event) => onChangeConfig({ restrictionMovementMode: event.target.value as RestrictionMovementMode })}
              >
              {([
                "normal",
                "king",
                "grandKing",
                "queen",
                "rook",
                "pillar",
                "bishop",
                "monk",
                "knight",
                "neon",
                "checkers",
                "horsemen",
                "mage"
              ] as RestrictionMovementMode[]).map((mode) => (
                  <option key={mode} value={mode}>{t(`restrictions.movement.${mode}`)}</option>
                ))}
              </select>
              <button
                className="help-button movement-info-button"
                type="button"
                aria-label={t("movementInfo.open")}
                title={t("movementInfo.open")}
                onClick={() => setMovementInfoOpen(true)}
              >
                <Info aria-hidden="true" />
              </button>
            </div>
          </label>

          {config.restrictionMovementMode !== "normal" && (
            <div className="field-row movement-effect-row">
              <Tooltip text={t("fields.restrictionMovementEatTooltip")} className="movement-effect-tooltip" passAriaLabel={false}>
                <label className="field checkbox boxed">
                  <span>{t("fields.restrictionMovementEat")}</span>
                  <input
                    type="checkbox"
                    checked={config.restrictionMovementEatEnabled}
                    onChange={(event) => onChangeConfig({
                      restrictionMovementEatEnabled: event.target.checked,
                      restrictionMovementConvertEnabled: event.target.checked ? false : config.restrictionMovementConvertEnabled
                    })}
                  />
                </label>
              </Tooltip>

              {movementSupportsConversion(config.restrictionMovementMode) && (
                <Tooltip text={t("fields.restrictionMovementConvertTooltip")} className="movement-effect-tooltip" passAriaLabel={false}>
                  <label className="field checkbox boxed">
                    <span>{t("fields.restrictionMovementConvert")}</span>
                    <input
                      type="checkbox"
                      checked={config.restrictionMovementConvertEnabled}
                      onChange={(event) => onChangeConfig({
                        restrictionMovementConvertEnabled: event.target.checked,
                        restrictionMovementEatEnabled: event.target.checked ? false : config.restrictionMovementEatEnabled
                      })}
                    />
                  </label>
                </Tooltip>
              )}
            </div>
          )}
        </>
      )}
      <MovementInfoModal open={movementInfoOpen} onClose={() => setMovementInfoOpen(false)} />
    </SettingsSection>
  );
}

export function PlayersSettingsSection({
  config,
  onChangeConfig,
  onHelp,
  maxPlayerCount = config.roster.length
}: SidebarSectionProps) {
  const resolvedMaxPlayerCount = Math.max(2, Math.min(config.roster.length, maxPlayerCount));
  const playerOptions = Array.from(
    { length: Math.max(0, resolvedMaxPlayerCount - 1) },
    (_, index) => index + 2
  );

  return (
    <SettingsSection title={t("sections.players")} icon={<UsersRound aria-hidden="true" />} helpKey="players" onHelp={onHelp}>
      {config.playerCount > 2 ? (
        <div className="field-row field-row--player-count">
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

          <Tooltip text={t("fields.removeOutOfGamePiecesTooltip")} passAriaLabel={false}>
            <label className="field checkbox boxed">
              <span>{t("fields.removeOutOfGamePieces")}</span>
              <input
                type="checkbox"
                checked={config.removeOutOfGamePieces}
                onChange={(event) => onChangeConfig({ removeOutOfGamePieces: event.target.checked })}
              />
            </label>
          </Tooltip>
        </div>
      ) : (
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
      )}

      {config.lineRule === "win" && config.playerCount > 2 && (
        <label className="field checkbox boxed">
          <span>{t("fields.singleWinner")}</span>
          <input
            type="checkbox"
            checked={config.singleWinner}
            onChange={(event) => onChangeConfig({ singleWinner: event.target.checked })}
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
        <div className="broken-rupture-duration-col">
          <label className="field">
            {t("fields.brokenDuration")}
            <TimeIntervalDraftInput
              disabled={!config.brokenEnabled}
              min={1}
              max={99}
              step={1}
              allowedModes={["turns", "rounds", "infinite"]}
              mode={brokenHoleTimePickerMode(config)}
              value={config.brokenHoleTurns}
              onValueCommit={(value) => onChangeConfig({ brokenHoleTurns: value })}
              onModeChange={(nextMode) => {
                if (nextMode === "infinite") {
                  onChangeConfig({ brokenHoleUnlimited: true });
                } else {
                  onChangeConfig({
                    brokenHoleUnlimited: false,
                    brokenHoleDurationUnit: nextMode === "rounds" ? "rounds" : "turns"
                  });
                }
              }}
            />
          </label>
        </div>

        <div className="broken-rupture-obstacle-cell">
          <Tooltip text={t("fields.brokenRuptureGravityCollisionHelp")} passAriaLabel={false}>
            <label className="field checkbox boxed broken-rupture-check">
              <span>{t("fields.brokenRuptureGravityCollision")}</span>
              <input
                type="checkbox"
                disabled={!config.brokenEnabled || !config.gravityEnabled}
                checked={config.brokenRuptureGravityCollision}
                onChange={(event) =>
                  onChangeConfig({ brokenRuptureGravityCollision: event.target.checked })
                }
              />
            </label>
          </Tooltip>
        </div>
      </div>
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

          <label className="field">
            {t("fields.gravityRotateEvery")}
            <TimeIntervalDraftInput
              disabled={!config.gravityEnabled || !config.gravityRotateEnabled}
              min={1}
              max={99}
              step={1}
              allowedModes={["turns", "rounds"]}
              mode={config.gravityRotateEveryUnit === "rounds" ? "rounds" : "turns"}
              value={config.gravityRotateEveryTurns}
              onValueCommit={(value) => onChangeConfig({ gravityRotateEveryTurns: value })}
              onModeChange={(nextMode) => {
                onChangeConfig({ gravityRotateEveryUnit: nextMode === "rounds" ? "rounds" : "turns" });
              }}
            />
          </label>
        </>
      )}
    </SettingsSection>
  );
}

export function CollapseSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  return (
    <SettingsSection
      title={t("sections.collapse")}
      icon={<ChevronsLeftRight aria-hidden="true" />}
      helpKey="collapse"
      onHelp={onHelp}
      toggleExpanded={config.collapseEnabled}
      titleToggle={
        <label className="section-toggle" title={t("fields.collapseEnabled")} onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={config.collapseEnabled}
            onChange={(event) => onChangeConfig({ collapseEnabled: event.target.checked })}
          />
        </label>
      }
    >
      <label className="field">
        {t("fields.collapseType")}
        <select
          disabled={!config.collapseEnabled}
          value={config.collapseType}
          onChange={(event) => onChangeConfig({ collapseType: event.target.value as CollapseType })}
        >
          <option value="left">{t("rules.collapse.type.left")}</option>
          <option value="right">{t("rules.collapse.type.right")}</option>
          <option value="up">{t("rules.collapse.type.up")}</option>
          <option value="down">{t("rules.collapse.type.down")}</option>
          <option value="horizontal">{t("rules.collapse.type.horizontal")}</option>
          <option value="vertical">{t("rules.collapse.type.vertical")}</option>
          <option value="circular">{t("rules.collapse.type.circular")}</option>
        </select>
      </label>

      <div className="field-row field-row--collapse-interval">
        <label className="field">
          {t("fields.collapseEvery")}
          <TimeIntervalDraftInput
            disabled={!config.collapseEnabled}
            min={1}
            max={99}
            step={1}
            allowedModes={["turns", "rounds"]}
            mode={config.collapseEveryUnit === "rounds" ? "rounds" : "turns"}
            value={config.collapseEveryTurns}
            onValueCommit={(value) => onChangeConfig({ collapseEveryTurns: value })}
            onModeChange={(nextMode) => {
              onChangeConfig({ collapseEveryUnit: nextMode === "rounds" ? "rounds" : "turns" });
            }}
          />
        </label>

        <label className="field">
          {t("fields.collapseTimes")}
          <NumericDraftInput
            min={1}
            max={99}
            step={1}
            disabled={!config.collapseEnabled}
            value={config.collapseTimes}
            onCommit={(value) => onChangeConfig({ collapseTimes: value })}
          />
        </label>
      </div>

      <label className="field checkbox boxed">
        <span>{t("fields.collapseKillsPlayers")}</span>
        <input
          type="checkbox"
          disabled={!config.collapseEnabled}
          checked={config.collapseKillsPlayers}
          onChange={(event) => onChangeConfig({ collapseKillsPlayers: event.target.checked })}
        />
      </label>
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
            <NumericDraftInput
              min={10}
              max={7200}
              step={1}
              value={config.clockBankSeconds}
              onCommit={(value) => onChangeConfig({ clockBankSeconds: value })}
            />
          </label>
          <label className="field">
            {t("fields.clockRecoverSeconds")}
            <NumericDraftInput
              min={0}
              max={600}
              step={1}
              value={config.clockRecoverSeconds}
              onCommit={(value) => onChangeConfig({ clockRecoverSeconds: value })}
            />
          </label>
        </>
      )}

      {config.clockEnabled && config.clockMode === "perTurn" && (
        <>
          <label className="field">
            {t("fields.clockPerTurnSeconds")}
            <NumericDraftInput
              min={3}
              max={600}
              step={1}
              value={config.clockPerTurnSeconds}
              onCommit={(value) => onChangeConfig({ clockPerTurnSeconds: value })}
            />
          </label>
        </>
      )}
    </SettingsSection>
  );
}

export function RestrictionsSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const [gridModalOpen, setGridModalOpen] = useState(false);

  return (
    <SettingsSection
      title={t("sections.blocking")}
      icon={<Lock aria-hidden="true" />}
      helpKey="restrictions"
      onHelp={onHelp}
      toggleExpanded={config.restrictionsEnabled}
      titleToggle={
        <label className="section-toggle" title={t("fields.blockingEnabled")} onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={config.restrictionsEnabled}
            onChange={(event) => onChangeConfig({ restrictionsEnabled: event.target.checked })}
          />
        </label>
      }
    >
      {config.restrictionsEnabled && (
        <>
          <div className="field-row field-row--restriction-start">
            <label className="field">
              {t("fields.restrictionStartEvery")}
              <TimeIntervalDraftInput
                min={1}
                max={99}
                step={1}
                allowedModes={["turns", "rounds"]}
                mode={config.restrictionStartUnit === "rounds" ? "rounds" : "turns"}
                value={config.restrictionStartTurns}
                onValueCommit={(value) => onChangeConfig({ restrictionStartTurns: value })}
                onModeChange={(nextMode) => {
                  onChangeConfig({ restrictionStartUnit: nextMode === "rounds" ? "rounds" : "turns" });
                }}
              />
            </label>
            <div className="field field--restriction-edit">
              <span className="field-label-spacer" aria-hidden>{"\u00a0"}</span>
              <button
                className="button secondary full"
                type="button"
                aria-label={t("fields.editRestrictionStartGrid")}
                title={t("fields.editRestrictionStartGrid")}
                onClick={() => setGridModalOpen(true)}
              >
                {t("fields.editBlockedCellsShort")}
              </button>
            </div>
          </div>
        </>
      )}
      <RestrictionGridModal
        open={gridModalOpen}
        config={config}
        onApply={(blockedCells) => onChangeConfig({ restrictionStartBlockedCells: blockedCells })}
        onClose={() => setGridModalOpen(false)}
      />
    </SettingsSection>
  );
}

import { useState } from "react";
import { ArrowDown, ChevronsLeftRight, CircleDot, CircleOff, Grid3X3, Info, Lock, Target, Timer, UsersRound } from "lucide-react";
import { DEFAULT_MAX_PIECES_PER_PLAYER } from "../game/defaults";
import { normalizeClockStrategy } from "../game/config";
import { movementSupportsConversion, RESTRICTION_MOVEMENT_MODES_ORDER } from "../game/restrictions";
import type {
  ClockMode,
  CollapseType,
  GameConfig,
  GravityDirection,
  GravityRotateAngle,
  GravityRotateSpin,
  ObjectiveExtraRuleId,
  RestrictionMovementMode
} from "../game/types";
import { t } from "../i18n";
import { CustomSelect } from "./CustomSelect";
import { MovementInfoModal } from "./MovementInfoModal";
import { NumericDraftInput } from "./NumericDraftInput";
import { QuantityModeDraftInput, TimeIntervalDraftInput, type TimeIntervalPickerMode } from "./NumericModeInputs";
import { CustomMultiSelect } from "./CustomMultiSelect";
import { CustomToggle } from "./CustomToggle";
import { LineRuleSelect } from "./LineRuleSelect";
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

const OBJECTIVE_EXTRA_IDS = ["tieBreakMostPieces", "exileEmptyBoard"] as const satisfies readonly ObjectiveExtraRuleId[];

const GRAVITY_DIRECTIONS_ORDER: GravityDirection[] = ["down", "up", "left", "right"];
const GRAVITY_ROTATE_ANGLES_ORDER: GravityRotateAngle[] = ["90", "180", "270", "random"];
const GRAVITY_ROTATE_SPINS_ORDER: GravityRotateSpin[] = ["cw", "ccw", "random"];

const COLLAPSE_TYPES_ORDER: CollapseType[] = [
  "left",
  "right",
  "up",
  "down",
  "horizontal",
  "vertical",
  "circular"
];

const CLOCK_MODES_ORDER: ClockMode[] = ["bank", "perTurn"];

export function GeneralSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
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

export function ObjectiveSettingsSection({ config, onChangeConfig, onHelp }: SidebarSectionProps) {
  const lineMax = Math.max(config.columns, config.rows);

  const objectiveExtraOptions = OBJECTIVE_EXTRA_IDS.map((id) => ({
    value: id,
    label: t(`objectiveExtra.${id}.label`)
  }));

  return (
    <SettingsSection
      title={t("sections.objective")}
      icon={<Target aria-hidden="true" />}
      helpKey="objective"
      defaultOpen
      onHelp={onHelp}
    >
      <div className="field-row compact">
        <label className="field">
          {t("fields.lineRuleMode")}
          <LineRuleSelect value={config.lineRule} onChange={(rule) => onChangeConfig({ lineRule: rule })} />
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

      <label className="field">
        {t("fields.objectiveExtraRules")}
        <CustomMultiSelect<ObjectiveExtraRuleId>
          options={objectiveExtraOptions}
          values={config.objectiveExtraRules}
          onChange={(rules) => onChangeConfig({ objectiveExtraRules: rules })}
          placeholder={t("objectiveExtra.multi.placeholder")}
          getTriggerLabel={(selected) => t("objectiveExtra.multi.summary", { count: selected.length })}
          triggerAriaLabel={t("objectiveExtra.multi.triggerAria", { count: config.objectiveExtraRules.length })}
          getChipRemoveAriaLabel={(_value, chipLabel) =>
            t("objectiveExtra.multi.removeChip", { label: chipLabel })
          }
          chipListAriaLabel={t("objectiveExtra.multi.chipListAria")}
        />
      </label>
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
              <CustomSelect<RestrictionMovementMode>
                options={RESTRICTION_MOVEMENT_MODES_ORDER.map((mode) => ({
                  value: mode,
                  label: t(`restrictions.movement.${mode}`),
                  description: t(`movementInfo.modes.${mode}`)
                }))}
                value={config.restrictionMovementMode}
                onChange={(mode) => onChangeConfig({ restrictionMovementMode: mode })}
                triggerAriaLabel={t("settingsSelectTriggers.restrictionMovement", {
                  mode: t(`restrictions.movement.${config.restrictionMovementMode}`)
                })}
              />
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
                <CustomToggle
                  checked={config.restrictionMovementEatEnabled}
                  onChange={(next) =>
                    onChangeConfig({
                      restrictionMovementEatEnabled: next,
                      restrictionMovementConvertEnabled: next ? false : config.restrictionMovementConvertEnabled
                    })
                  }
                >
                  {t("fields.restrictionMovementEat")}
                </CustomToggle>
              </Tooltip>

              {movementSupportsConversion(config.restrictionMovementMode) && (
                <Tooltip text={t("fields.restrictionMovementConvertTooltip")} className="movement-effect-tooltip" passAriaLabel={false}>
                  <CustomToggle
                    checked={config.restrictionMovementConvertEnabled}
                    onChange={(next) =>
                      onChangeConfig({
                        restrictionMovementConvertEnabled: next,
                        restrictionMovementEatEnabled: next ? false : config.restrictionMovementEatEnabled
                      })
                    }
                  >
                    {t("fields.restrictionMovementConvert")}
                  </CustomToggle>
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
            <CustomSelect
              options={playerOptions.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(config.playerCount)}
              onChange={(v) => onChangeConfig({ playerCount: Number(v) })}
              triggerAriaLabel={t("settingsSelectTriggers.playerCount", { mode: String(config.playerCount) })}
            />
          </label>

          <Tooltip text={t("fields.removeOutOfGamePiecesTooltip")} passAriaLabel={false}>
            <CustomToggle
              checked={config.removeOutOfGamePieces}
              onChange={(next) => onChangeConfig({ removeOutOfGamePieces: next })}
            >
              {t("fields.removeOutOfGamePieces")}
            </CustomToggle>
          </Tooltip>
        </div>
      ) : (
        <label className="field">
          {t("fields.playerCount")}
          <CustomSelect
            options={playerOptions.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(config.playerCount)}
            onChange={(v) => onChangeConfig({ playerCount: Number(v) })}
            triggerAriaLabel={t("settingsSelectTriggers.playerCount", { mode: String(config.playerCount) })}
          />
        </label>
      )}

      {config.lineRule === "win" && config.playerCount > 2 && (
        <CustomToggle
          checked={config.singleWinner}
          onChange={(next) => onChangeConfig({ singleWinner: next })}
        >
          {t("fields.singleWinner")}
        </CustomToggle>
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
            className="section-toggle-input"
            checked={config.brokenEnabled}
            onChange={(event) => onChangeConfig({ brokenEnabled: event.target.checked })}
            aria-label={t("fields.enableBrokenHoles")}
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
            <CustomToggle
              disabled={!config.brokenEnabled || !config.gravityEnabled}
              checked={config.brokenRuptureGravityCollision}
              onChange={(next) => onChangeConfig({ brokenRuptureGravityCollision: next })}
            >
              {t("fields.brokenRuptureGravityCollision")}
            </CustomToggle>
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
            className="section-toggle-input"
            checked={config.gravityEnabled}
            onChange={(event) => onChangeConfig({ gravityEnabled: event.target.checked })}
            aria-label={t("fields.enableGravity")}
          />
        </label>
      }
    >
      <label className="field">
        {t("fields.gravityInitialDirection")}
        <CustomSelect<GravityDirection>
          disabled={!config.gravityEnabled}
          options={GRAVITY_DIRECTIONS_ORDER.map((dir) => ({
            value: dir,
            label: t(`rules.gravity.direction.${dir}`)
          }))}
          value={config.gravityInitialDirection}
          onChange={(dir) => onChangeConfig({ gravityInitialDirection: dir })}
          triggerAriaLabel={t("settingsSelectTriggers.gravityDirection", {
            mode: t(`rules.gravity.direction.${config.gravityInitialDirection}`)
          })}
        />
      </label>

      <CustomToggle
        disabled={!config.gravityEnabled}
        checked={config.gravityRotateEnabled}
        onChange={(next) => onChangeConfig({ gravityRotateEnabled: next })}
      >
        {t("fields.gravityRotate")}
      </CustomToggle>

      {config.gravityEnabled && config.gravityRotateEnabled && (
        <>
          <div className="field-row">
            <label className="field">
              {t("fields.gravityRotateAngle")}
              <CustomSelect<GravityRotateAngle>
                disabled={!config.gravityEnabled}
                options={GRAVITY_ROTATE_ANGLES_ORDER.map((angle) => ({
                  value: angle,
                  label: t(`rules.gravity.rotateAngle.${angle}`)
                }))}
                value={config.gravityRotateAngle}
                onChange={(angle) => onChangeConfig({ gravityRotateAngle: angle })}
                triggerAriaLabel={t("settingsSelectTriggers.gravityRotateAngle", {
                  mode: t(`rules.gravity.rotateAngle.${config.gravityRotateAngle}`)
                })}
              />
            </label>

            <label className="field">
              {t("fields.gravityRotateSpin")}
              <CustomSelect<GravityRotateSpin>
                disabled={!config.gravityEnabled}
                options={GRAVITY_ROTATE_SPINS_ORDER.map((spin) => ({
                  value: spin,
                  label: t(`rules.gravity.rotateSpin.${spin}`)
                }))}
                value={config.gravityRotateSpin}
                onChange={(spin) => onChangeConfig({ gravityRotateSpin: spin })}
                triggerAriaLabel={t("settingsSelectTriggers.gravityRotateSpin", {
                  mode: t(`rules.gravity.rotateSpin.${config.gravityRotateSpin}`)
                })}
              />
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
            className="section-toggle-input"
            checked={config.collapseEnabled}
            onChange={(event) => onChangeConfig({ collapseEnabled: event.target.checked })}
            aria-label={t("fields.collapseEnabled")}
          />
        </label>
      }
    >
      <label className="field">
        {t("fields.collapseType")}
        <CustomSelect<CollapseType>
          disabled={!config.collapseEnabled}
          options={COLLAPSE_TYPES_ORDER.map((kind) => ({
            value: kind,
            label: t(`rules.collapse.type.${kind}`)
          }))}
          value={config.collapseType}
          onChange={(kind) => onChangeConfig({ collapseType: kind })}
          triggerAriaLabel={t("settingsSelectTriggers.collapseType", {
            mode: t(`rules.collapse.type.${config.collapseType}`)
          })}
        />
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
            className="section-toggle-input"
            checked={config.clockEnabled}
            onChange={(event) => onChangeConfig({ clockEnabled: event.target.checked })}
            aria-label={t("fields.clockEnabled")}
          />
        </label>
      }
    >
      {config.clockEnabled && (
        <label className="field">
          {t("fields.clockType")}
          <CustomSelect<ClockMode>
            options={CLOCK_MODES_ORDER.map((mode) => ({
              value: mode,
              label: t(`clock.modes.${mode}.label`),
              description: t(`clock.modes.${mode}.description`)
            }))}
            value={config.clockMode}
            onChange={(mode) => onChangeConfig({ clockMode: normalizeClockStrategy(mode) })}
            triggerAriaLabel={t("settingsSelectTriggers.clockMode", {
              mode: t(`clock.modes.${config.clockMode}.label`)
            })}
          />
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
            className="section-toggle-input"
            checked={config.restrictionsEnabled}
            onChange={(event) => onChangeConfig({ restrictionsEnabled: event.target.checked })}
            aria-label={t("fields.blockingEnabled")}
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

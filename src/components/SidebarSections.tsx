import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { ArrowDown, ChevronsLeftRight, CircleDot, CircleOff, Grid3X3, Timer, UsersRound } from "lucide-react";
import { DEFAULT_MAX_PIECES_PER_PLAYER } from "../game/defaults";
import {
  getMoveModeHelp,
  getMoveModeOptions,
  getResolvedBrokenHoleTurns,
  getResolvedCollapseInterval,
  getResolvedGravityRotateInterval,
  normalizeClockStrategy
} from "../game/config";
import type {
  CollapseType,
  GameConfig,
  GravityDirection,
  GravityRotateAngle,
  GravityRotateSpin,
  IntervalUnit,
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

interface NumericDraftInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number;
  onCommit: (value: number) => void;
  commitDelayMs?: number;
}

function NumericDraftInput({
  value,
  onCommit,
  commitDelayMs = 700,
  disabled,
  onBlur,
  ...props
}: NumericDraftInputProps) {
  const [draftValue, setDraftValue] = useState(String(value));
  const commitTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  useEffect(() => {
    return () => {
      window.clearTimeout(commitTimeoutRef.current);
    };
  }, []);

  function clearPendingCommit() {
    window.clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = undefined;
  }

  function parseDraft(valueToParse: string) {
    const trimmedValue = valueToParse.trim();
    if (trimmedValue === "" || trimmedValue === "-" || trimmedValue === "+") return null;

    const parsedValue = Number(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function parseNumericProp(propValue: InputHTMLAttributes<HTMLInputElement>[keyof InputHTMLAttributes<HTMLInputElement>]) {
    const parsedValue = Number(propValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function normalizeDraft(valueToNormalize: string) {
    const parsedValue = parseDraft(valueToNormalize);
    if (parsedValue === null) return null;

    const stepValue = parseNumericProp(props.step);
    const minValue = parseNumericProp(props.min);
    const maxValue = parseNumericProp(props.max);
    let nextValue = stepValue !== null && Number.isInteger(stepValue) ? Math.trunc(parsedValue) : parsedValue;

    if (minValue !== null) nextValue = Math.max(minValue, nextValue);
    if (maxValue !== null) nextValue = Math.min(maxValue, nextValue);
    return nextValue;
  }

  function scheduleCommit(nextDraftValue: string) {
    clearPendingCommit();
    const normalizedValue = normalizeDraft(nextDraftValue);
    if (normalizedValue === null || disabled) return;

    commitTimeoutRef.current = window.setTimeout(() => {
      setDraftValue(String(normalizedValue));
      onCommit(normalizedValue);
      commitTimeoutRef.current = undefined;
    }, commitDelayMs);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraftValue = event.target.value;
    setDraftValue(nextDraftValue);
    scheduleCommit(nextDraftValue);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    clearPendingCommit();
    const normalizedValue = normalizeDraft(event.target.value);

    if (normalizedValue === null || disabled) {
      setDraftValue(String(value));
    } else {
      setDraftValue(String(normalizedValue));
      onCommit(normalizedValue);
    }

    onBlur?.(event);
  }

  return (
    <input
      {...props}
      type="number"
      disabled={disabled}
      value={draftValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
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
          <NumericDraftInput
            min={1}
            max={99}
            step={1}
            disabled={unlimitedPieces}
            value={config.maxPiecesPerPlayer || DEFAULT_MAX_PIECES_PER_PLAYER}
            onCommit={(value) => onChangeConfig({ maxPiecesPerPlayer: value })}
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

export function PlayersSettingsSection({
  config,
  onChangeConfig,
  onHelp
}: SidebarSectionProps) {
  const playerOptions = Array.from(
    { length: Math.max(0, config.roster.length - 1) },
    (_, index) => index + 2
  );

  return (
    <SettingsSection title={t("sections.players")} icon={<UsersRound aria-hidden="true" />} helpKey="players" onHelp={onHelp}>
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
          <NumericDraftInput
            min={1}
            max={99}
            step={1}
            disabled={!config.brokenEnabled || config.brokenHoleUnlimited}
            value={config.brokenHoleTurns}
            onCommit={(value) => onChangeConfig({ brokenHoleTurns: value })}
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

          <div className="field-row">
            <label className="field">
              {t("fields.gravityRotateEvery")}
              <NumericDraftInput
                min={1}
                max={99}
                step={1}
                value={config.gravityRotateEveryTurns}
                onCommit={(value) => onChangeConfig({ gravityRotateEveryTurns: value })}
              />
            </label>

            <label className="field">
              {t("fields.intervalUnit")}
              <select
                value={config.gravityRotateEveryUnit}
                onChange={(event) => onChangeConfig({ gravityRotateEveryUnit: event.target.value as IntervalUnit })}
              >
                <option value="turns">{t("intervalUnits.turns")}</option>
                <option value="rounds">{t("intervalUnits.rounds")}</option>
              </select>
            </label>
          </div>

          <span className="field-help">
            {config.gravityRotateEveryUnit === "rounds"
              ? t("fields.gravityRotateInfoRounds", {
                amount: config.gravityRotateEveryTurns,
                players: config.playerCount,
                turns: getResolvedGravityRotateInterval(config)
              })
              : t("fields.gravityRotateInfoTurns", { amount: config.gravityRotateEveryTurns })}
          </span>
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

      <div className="field-row">
        <label className="field">
          {t("fields.collapseEvery")}
          <NumericDraftInput
            min={1}
            max={99}
            step={1}
            disabled={!config.collapseEnabled}
            value={config.collapseEveryTurns}
            onCommit={(value) => onChangeConfig({ collapseEveryTurns: value })}
          />
        </label>

        <label className="field">
          {t("fields.intervalUnit")}
          <select
            disabled={!config.collapseEnabled}
            value={config.collapseEveryUnit}
            onChange={(event) => onChangeConfig({ collapseEveryUnit: event.target.value as IntervalUnit })}
          >
            <option value="turns">{t("intervalUnits.turns")}</option>
            <option value="rounds">{t("intervalUnits.rounds")}</option>
          </select>
        </label>
      </div>

      <div className="field-row toggle-and-number">
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

        <label className="field checkbox boxed">
          <span>{t("fields.collapseKillsPlayers")}</span>
          <input
            type="checkbox"
            disabled={!config.collapseEnabled}
            checked={config.collapseKillsPlayers}
            onChange={(event) => onChangeConfig({ collapseKillsPlayers: event.target.checked })}
          />
        </label>
      </div>

      <span className="field-help">
        {config.collapseEveryUnit === "rounds"
          ? t("fields.collapseInfoRounds", {
            amount: config.collapseEveryTurns,
            players: config.playerCount,
            turns: getResolvedCollapseInterval(config),
            times: config.collapseTimes
          })
          : t("fields.collapseInfoTurns", {
            amount: config.collapseEveryTurns,
            times: config.collapseTimes
          })}
      </span>
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
          <span className="field-help">{t("fields.clockHintBank")}</span>
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
          <span className="field-help">{t("fields.clockHintPerTurn")}</span>
        </>
      )}
    </SettingsSection>
  );
}

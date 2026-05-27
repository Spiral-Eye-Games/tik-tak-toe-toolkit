import type { InputHTMLAttributes } from "react";
import type { CombosEndMode } from "../game/types";
import { NumericDraftInput } from "./NumericDraftInput";
import { Tooltip } from "./Tooltip";
import { t } from "../i18n";

export type TimeIntervalPickerMode = "turns" | "rounds" | "infinite";
export type QuantityPickerMode = "value" | "infinite";
export type CombosEndPickerMode = CombosEndMode;

const TIME_SYMBOL: Record<TimeIntervalPickerMode, string> = {
  turns: "T",
  rounds: "R",
  infinite: "∞"
};

const QUANTITY_SYMBOL: Record<QuantityPickerMode, string> = {
  value: "V",
  infinite: "∞"
};

function cycleMode<M extends string>(allowed: readonly M[], current: M): M {
  const index = allowed.indexOf(current);
  const safeIndex = index >= 0 ? index : 0;
  return allowed[(safeIndex + 1) % allowed.length]!;
}

interface TimeIntervalDraftInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step" | "disabled"> {
  value: number;
  mode: TimeIntervalPickerMode;
  /** Orden de ciclo al pulsar el botón; debe incluir `mode` o se fuerza el primero en el padre. */
  allowedModes: readonly TimeIntervalPickerMode[];
  onValueCommit: (value: number) => void;
  onModeChange: (mode: TimeIntervalPickerMode) => void;
  min?: number;
  max?: number;
  step?: number;
  commitDelayMs?: number;
  disabled?: boolean;
}

export function TimeIntervalDraftInput({
  value,
  mode,
  allowedModes,
  onValueCommit,
  onModeChange,
  min,
  max,
  step = 1,
  commitDelayMs = 700,
  disabled = false,
  className,
  ...inputRest
}: TimeIntervalDraftInputProps) {
  const effectiveAllowed = allowedModes.length > 0 ? allowedModes : (["turns"] as const);
  const effectiveMode = effectiveAllowed.includes(mode) ? mode : effectiveAllowed[0]!;
  const numericLocked = disabled || effectiveMode === "infinite";

  return (
    <div className={["numeric-with-mode", className].filter(Boolean).join(" ")}>
      <NumericDraftInput
        {...inputRest}
        className="numeric-with-mode__input"
        min={min}
        max={max}
        step={step}
        disabled={numericLocked}
        value={value}
        commitDelayMs={commitDelayMs}
        onCommit={onValueCommit}
      />
      <Tooltip
        text={t(`numericMode.time.${effectiveMode}`)}
        passAriaLabel={false}
        className="numeric-with-mode-tooltip"
      >
        <button
          type="button"
          className="numeric-with-mode__mode"
          disabled={disabled}
          aria-label={t("numericMode.time.cycleAria", { label: t(`numericMode.time.${effectiveMode}`) })}
          onClick={() => onModeChange(cycleMode(effectiveAllowed, effectiveMode))}
        >
          {TIME_SYMBOL[effectiveMode]}
        </button>
      </Tooltip>
    </div>
  );
}

interface QuantityModeDraftInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step" | "disabled"> {
  value: number;
  mode: QuantityPickerMode;
  allowedModes: readonly QuantityPickerMode[];
  onValueCommit: (value: number) => void;
  onModeChange: (mode: QuantityPickerMode) => void;
  min?: number;
  max?: number;
  step?: number;
  commitDelayMs?: number;
  disabled?: boolean;
}

export function QuantityModeDraftInput({
  value,
  mode,
  allowedModes,
  onValueCommit,
  onModeChange,
  min,
  max,
  step = 1,
  commitDelayMs = 700,
  disabled = false,
  className,
  ...inputRest
}: QuantityModeDraftInputProps) {
  const effectiveAllowed = allowedModes.length > 0 ? allowedModes : (["value"] as const);
  const effectiveMode = effectiveAllowed.includes(mode) ? mode : effectiveAllowed[0]!;
  const numericLocked = disabled || effectiveMode === "infinite";

  return (
    <div className={["numeric-with-mode", className].filter(Boolean).join(" ")}>
      <NumericDraftInput
        {...inputRest}
        className="numeric-with-mode__input"
        min={min}
        max={max}
        step={step}
        disabled={numericLocked}
        value={value}
        commitDelayMs={commitDelayMs}
        onCommit={onValueCommit}
      />
      <Tooltip
        text={t(`numericMode.quantity.${effectiveMode}`)}
        passAriaLabel={false}
        className="numeric-with-mode-tooltip"
      >
        <button
          type="button"
          className="numeric-with-mode__mode"
          disabled={disabled}
          aria-label={t("numericMode.quantity.cycleAria", { label: t(`numericMode.quantity.${effectiveMode}`) })}
          onClick={() => onModeChange(cycleMode(effectiveAllowed, effectiveMode))}
        >
          {QUANTITY_SYMBOL[effectiveMode]}
        </button>
      </Tooltip>
    </div>
  );
}

const COMBOS_END_SYMBOL: Record<CombosEndPickerMode, string> = {
  maxRounds: "R",
  scoreTarget: "P"
};

const COMBOS_END_MODES_ORDER = ["maxRounds", "scoreTarget"] as const satisfies readonly CombosEndPickerMode[];

interface CombosEndDraftInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step" | "disabled"> {
  value: number;
  mode: CombosEndPickerMode;
  onValueCommit: (value: number) => void;
  onModeChange: (mode: CombosEndPickerMode) => void;
  min?: number;
  max?: number;
  step?: number;
  commitDelayMs?: number;
  disabled?: boolean;
}

export function CombosEndDraftInput({
  value,
  mode,
  onValueCommit,
  onModeChange,
  min,
  max,
  step = 1,
  commitDelayMs = 700,
  disabled = false,
  className,
  ...inputRest
}: CombosEndDraftInputProps) {
  const effectiveMode = COMBOS_END_MODES_ORDER.includes(mode as (typeof COMBOS_END_MODES_ORDER)[number])
    ? mode
    : COMBOS_END_MODES_ORDER[0]!;

  return (
    <div className={["numeric-with-mode", className].filter(Boolean).join(" ")}>
      <NumericDraftInput
        {...inputRest}
        className="numeric-with-mode__input"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        commitDelayMs={commitDelayMs}
        onCommit={onValueCommit}
      />
      <Tooltip
        text={t(`numericMode.combosEnd.${effectiveMode}`)}
        passAriaLabel={false}
        className="numeric-with-mode-tooltip"
      >
        <button
          type="button"
          className="numeric-with-mode__mode"
          disabled={disabled}
          aria-label={t("numericMode.combosEnd.cycleAria", {
            label: t(`numericMode.combosEnd.${effectiveMode}`)
          })}
          onClick={() => onModeChange(cycleMode([...COMBOS_END_MODES_ORDER], effectiveMode))}
        >
          {COMBOS_END_SYMBOL[effectiveMode]}
        </button>
      </Tooltip>
    </div>
  );
}

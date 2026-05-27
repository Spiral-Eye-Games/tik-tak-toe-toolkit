import type { LineRule } from "../game/types";
import { t } from "../i18n";
import { CustomSelect } from "./CustomSelect";

interface LineRuleSelectProps {
  value: LineRule;
  disabled?: boolean;
  /** Si es true o si el valor actual es `combos`, la opción Combos aparece en la lista. */
  showCombosOption?: boolean;
  onChange: (rule: LineRule) => void;
}

export function LineRuleSelect({ value, disabled, showCombosOption = false, onChange }: LineRuleSelectProps) {
  const includeCombos = showCombosOption || value === "combos";
  const baseKeys = includeCombos
    ? (["win", "lose", "combos"] as const)
    : (["win", "lose"] as const);

  const options = baseKeys.map((key) => ({
    value: key,
    label: t(`lineRuleSelect.options.${key}.label`)
  }));
  const currentLabel = t(`lineRuleSelect.options.${value}.label`);

  return (
    <CustomSelect
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      triggerAriaLabel={t("lineRuleSelect.triggerAria", { mode: currentLabel })}
    />
  );
}

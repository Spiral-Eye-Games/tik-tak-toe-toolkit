import type { LineRule } from "../game/types";
import { t } from "../i18n";
import { CustomSelect } from "./CustomSelect";

const LINE_RULE_OPTIONS = [
  { value: "win" as const },
  { value: "lose" as const }
];

interface LineRuleSelectProps {
  value: LineRule;
  disabled?: boolean;
  onChange: (rule: LineRule) => void;
}

export function LineRuleSelect({ value, disabled, onChange }: LineRuleSelectProps) {
  const options = LINE_RULE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`lineRuleSelect.options.${o.value}.label`),
    description: t(`lineRuleSelect.options.${o.value}.description`)
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

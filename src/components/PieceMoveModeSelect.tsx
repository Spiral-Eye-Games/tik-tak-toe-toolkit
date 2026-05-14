import { getMoveModeOptions } from "../game/config";
import type { GameConfig, PieceMoveMode } from "../game/types";
import { t } from "../i18n";
import { CustomSelect } from "./CustomSelect";

interface PieceMoveModeSelectProps {
  pieceLimitType: GameConfig["pieceLimitType"];
  value: PieceMoveMode;
  disabled?: boolean;
  onChange: (mode: PieceMoveMode) => void;
}

export function PieceMoveModeSelect({ pieceLimitType, value, disabled, onChange }: PieceMoveModeSelectProps) {
  const raw = getMoveModeOptions(pieceLimitType);
  const options = raw.map((o) => ({
    value: o.value,
    label: o.name,
    description: o.description
  }));
  const current = raw.find((o) => o.value === value) ?? raw[0]!;

  return (
    <CustomSelect
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      triggerAriaLabel={t("pieceMoveSelect.triggerAria", { mode: current.name })}
    />
  );
}

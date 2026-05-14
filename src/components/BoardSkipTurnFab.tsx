import { SkipForward } from "lucide-react";
import { t } from "../i18n";
import { Tooltip } from "./Tooltip";

interface BoardSkipTurnFabProps {
  disabled: boolean;
  onSkipTurn: () => void;
}

export function BoardSkipTurnFab({ disabled, onSkipTurn }: BoardSkipTurnFabProps) {
  const label = t("board.skipTurn.tooltip");

  return (
    <div className="board-skip-turn-fab">
      <Tooltip text={label}>
        <button
          type="button"
          className="board-skip-turn-fab__btn"
          disabled={disabled}
          onClick={onSkipTurn}
        >
          <SkipForward aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

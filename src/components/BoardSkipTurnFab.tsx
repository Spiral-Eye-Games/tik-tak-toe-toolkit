import { SkipForward } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface BoardSkipTurnFabProps {
  disabled: boolean;
  /** Texto visible y accesible (tooltips cuando está desactivado incluidos). */
  tooltip: string;
  onSkipTurn: () => void;
}

export function BoardSkipTurnFab({ disabled, tooltip, onSkipTurn }: BoardSkipTurnFabProps) {
  const label = tooltip;

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

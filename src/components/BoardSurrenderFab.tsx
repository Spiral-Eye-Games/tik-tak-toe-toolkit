import { Flag } from "lucide-react";
import { Tooltip } from "./Tooltip";
interface BoardSurrenderFabProps {
  disabled: boolean;
  tooltip: string;
  onOpenConfirm: () => void;
}

export function BoardSurrenderFab({ disabled, tooltip, onOpenConfirm }: BoardSurrenderFabProps) {
  return (
    <div className="board-surrender-fab">
      <Tooltip text={tooltip}>
        <button
          type="button"
          className="board-surrender-fab__btn"
          disabled={disabled}
          onClick={onOpenConfirm}
          aria-haspopup="dialog"
        >
          <Flag aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

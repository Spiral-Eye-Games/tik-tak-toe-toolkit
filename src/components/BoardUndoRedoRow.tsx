import { RotateCcw, RotateCw } from "lucide-react";
import { t } from "../i18n";

interface BoardUndoRedoRowProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function BoardUndoRedoRow({ canUndo, canRedo, onUndo, onRedo }: BoardUndoRedoRowProps) {
  return (
    <div className="board-undo-redo-row">
      <button
        className="button icon board-undo-redo-row__btn"
        title={t("actions.undo")}
        aria-label={t("actions.undo")}
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <RotateCcw aria-hidden="true" />
      </button>
      <button
        className="button icon board-undo-redo-row__btn"
        title={t("actions.redo")}
        aria-label={t("actions.redo")}
        type="button"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <RotateCw aria-hidden="true" />
      </button>
    </div>
  );
}

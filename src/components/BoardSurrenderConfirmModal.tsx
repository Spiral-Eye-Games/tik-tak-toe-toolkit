import { useEffect } from "react";
import { t } from "../i18n";

interface BoardSurrenderConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BoardSurrenderConfirmModal({ open, onClose, onConfirm }: BoardSurrenderConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="board-surrender-overlay" role="presentation">
      <div className="board-surrender-backdrop" role="presentation" onClick={onClose} />
      <section
        className="board-surrender-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="boardSurrenderTitle"
      >
        <header className="board-surrender-header">
          <h2 className="board-surrender-title" id="boardSurrenderTitle">{t("board.surrender.confirmTitle")}</h2>
        </header>
        <div className="board-surrender-body">
          <p className="board-surrender-text">{t("board.surrender.confirmBody")}</p>
        </div>
        <footer className="board-surrender-actions">
          <button type="button" className="button full secondary" onClick={onClose}>
            {t("board.surrender.cancel")}
          </button>
          <button type="button" className="button full danger" onClick={onConfirm}>
            {t("board.surrender.confirm")}
          </button>
        </footer>
      </section>
    </div>
  );
}

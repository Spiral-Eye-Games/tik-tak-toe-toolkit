import { useEffect } from "react";
import { X } from "lucide-react";
import type { RestrictionMovementMode } from "../game/types";
import { t } from "../i18n";
import { ModalPortal } from "./ModalPortal";

interface MovementInfoModalProps {
  open: boolean;
  onClose: () => void;
}

const MOVEMENT_MODES: RestrictionMovementMode[] = [
  "normal",
  "king",
  "grandKing",
  "queen",
  "rook",
  "pillar",
  "bishop",
  "monk",
  "knight",
  "neon",
  "checkers",
  "horsemen",
  "mage"
];

export function MovementInfoModal({ open, onClose }: MovementInfoModalProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        aria-hidden={false}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="modal movement-info-modal" role="dialog" aria-modal="true" aria-labelledby="movementInfoModalTitle">
          <header className="modal-header">
            <h2 className="modal-title" id="movementInfoModalTitle">{t("movementInfo.title")}</h2>
            <button className="modal-close" type="button" aria-label={t("actions.close")} onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="modal-body movement-info-modal-body">
            <p className="movement-info-intro">{t("movementInfo.intro")}</p>
            <div className="movement-info-guide">
              <h3>{t("movementInfo.guideTitle")}</h3>
              <ul>
                <li>{t("movementInfo.guideSelect")}</li>
                <li>{t("movementInfo.guideBlocked")}</li>
                <li>{t("movementInfo.guideEffects")}</li>
              </ul>
            </div>
            <div className="movement-info-list">
              {MOVEMENT_MODES.map((mode) => (
                <article className="movement-info-item" key={mode}>
                  <h3>{t(`restrictions.movement.${mode}`)}</h3>
                  <p>{t(`movementInfo.modes.${mode}`)}</p>
                </article>
              ))}
            </div>
            <p className="movement-info-note">{t("movementInfo.effects")}</p>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}

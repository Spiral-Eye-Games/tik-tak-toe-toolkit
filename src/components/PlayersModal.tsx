import { useEffect, useState } from "react";
import { normalizeRoster } from "../game/config";
import type { RosterPlayer } from "../game/types";
import { t } from "../i18n";
import { ModalPortal } from "./ModalPortal";

interface PlayersModalProps {
  open: boolean;
  roster: RosterPlayer[];
  onClose: () => void;
  onApply: (nextRoster: RosterPlayer[]) => void;
}

function createNewPlayerId(existing: RosterPlayer[]): string {
  const used = new Set(existing.map((player) => player.id));
  let id = "";
  do {
    id = `p_${crypto.randomUUID().split("-").join("").slice(0, 10)}`;
  } while (used.has(id));
  return id;
}

export function PlayersModal({ open, roster, onClose, onApply }: PlayersModalProps) {
  const [draft, setDraft] = useState<RosterPlayer[]>(roster);

  useEffect(() => {
    if (open) setDraft(roster.map((player) => ({ ...player })));
  }, [open, roster]);

  if (!open) return null;

  function updateEmoji(index: number, emoji: string) {
    setDraft((previous) => {
      const next = [...previous];
      const row = next[index];
      if (!row) return previous;
      next[index] = { ...row, emoji };
      return next;
    });
  }

  function removeRow(index: number) {
    if (draft.length <= 2) return;
    setDraft((previous) => previous.filter((_, i) => i !== index));
  }

  function addRow() {
    setDraft((previous) => [...previous, { id: createNewPlayerId(previous), emoji: "⭐" }]);
  }

  function handleSave() {
    onApply(normalizeRoster(draft));
    onClose();
  }

  return (
    <ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        aria-hidden={false}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="modal players-modal" role="dialog" aria-modal="true" aria-labelledby="playersModalTitle">
          <header className="modal-header">
            <h2 className="modal-title" id="playersModalTitle">{t("playersModal.title")}</h2>
            <button className="modal-close" type="button" aria-label={t("actions.close")} onClick={onClose}>×</button>
          </header>
          <div className="modal-body players-modal-body">
            <p className="field-help">{t("playersModal.intro")}</p>
            <ul className="players-modal-list">
              {draft.map((player, index) => (
                <li key={player.id} className="players-modal-row">
                  <label className="players-modal-emoji-field">
                    <input
                      className="players-modal-emoji-input"
                      type="text"
                      value={player.emoji}
                      maxLength={8}
                      onChange={(event) => updateEmoji(index, event.target.value)}
                      aria-label={t("playersModal.emojiLabel")}
                    />
                  </label>
                  <button
                    className="button icon danger"
                    type="button"
                    disabled={draft.length <= 2}
                    title={t("playersModal.remove")}
                    onClick={() => removeRow(index)}
                  >
                    −
                  </button>
                </li>
              ))}
            </ul>
            <button className="button full secondary" type="button" onClick={addRow}>{t("playersModal.add")}</button>
          </div>
          <footer className="players-modal-footer">
            <button className="button full" type="button" onClick={handleSave}>{t("playersModal.save")}</button>
          </footer>
        </section>
      </div>
    </ModalPortal>
  );
}

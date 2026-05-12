import { useEffect, useState } from "react";
import { normalizeRoster } from "../game/config";
import { DEFAULT_PLAYER_COLORS, DEFAULT_ROSTER } from "../game/defaults";
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

  function updateSymbol(index: number, symbol: string) {
    setDraft((previous) => {
      const next = [...previous];
      const row = next[index];
      if (!row) return previous;
      next[index] = { ...row, symbol };
      return next;
    });
  }

  function updateColor(index: number, color: string) {
    setDraft((previous) => {
      const next = [...previous];
      const row = next[index];
      if (!row) return previous;
      next[index] = { ...row, color };
      return next;
    });
  }

  function removeRow(index: number) {
    if (draft.length <= 2) return;
    setDraft((previous) => previous.filter((_, i) => i !== index));
  }

  function addRow() {
    setDraft((previous) => {
      const i = previous.length;
      const fallback = DEFAULT_ROSTER[i % DEFAULT_ROSTER.length];
      return [
        ...previous,
        {
          id: createNewPlayerId(previous),
          symbol: fallback.symbol,
          color: DEFAULT_PLAYER_COLORS[i % DEFAULT_PLAYER_COLORS.length]
        }
      ];
    });
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
                  <label className="players-modal-symbol-field">
                    <input
                      className="players-modal-symbol-input"
                      type="text"
                      value={player.symbol}
                      maxLength={8}
                      onChange={(event) => updateSymbol(index, event.target.value)}
                      aria-label={t("playersModal.symbolLabel")}
                    />
                  </label>
                  <input
                    className="players-modal-color-input"
                    type="color"
                    value={player.color}
                    onChange={(event) => updateColor(index, event.target.value)}
                    aria-label={t("playersModal.colorLabel")}
                  />
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

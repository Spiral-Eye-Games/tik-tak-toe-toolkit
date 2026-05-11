import { useCallback, useEffect, useState } from "react";
import {
  BUILTIN_PRESET_ORDER,
  deleteUserPreset,
  getBuiltinPresetConfig,
  loadUserPresets,
  saveUserPreset,
  type BuiltinPresetId,
  type UserPresetRecord
} from "../game/presets";
import { sanitizeConfig } from "../game/config";
import type { GameConfig } from "../game/types";
import { t } from "../i18n";

interface PresetModalProps {
  open: boolean;
  draftConfig: GameConfig;
  onClose: () => void;
  onApplyPreset: (config: GameConfig) => void;
}

export function PresetModal({ open, draftConfig, onClose, onApplyPreset }: PresetModalProps) {
  const [userList, setUserList] = useState<UserPresetRecord[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshUser = useCallback(() => {
    setUserList(loadUserPresets());
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshUser();
    setSaveName("");
    setSaveError(null);
  }, [open, refreshUser]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function applyBuiltin(id: BuiltinPresetId) {
    onApplyPreset(getBuiltinPresetConfig(id));
  }

  function applyUser(record: UserPresetRecord) {
    onApplyPreset(sanitizeConfig(record.config));
  }

  function handleSaveCurrent() {
    const name = saveName.trim();
    if (!name) {
      setSaveError(t("presets.saveNameRequired"));
      return;
    }
    setSaveError(null);
    saveUserPreset(name, draftConfig);
    setSaveName("");
    refreshUser();
  }

  function handleDeleteUser(id: string) {
    deleteUserPreset(id);
    refreshUser();
  }

  return (
    <div
      className={`modal-backdrop ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal preset-modal" role="dialog" aria-modal="true" aria-labelledby="presetModalTitle">
        <header className="modal-header">
          <h2 className="modal-title" id="presetModalTitle">{t("presets.modalTitle")}</h2>
          <button className="modal-close" type="button" aria-label={t("actions.close")} onClick={onClose}>×</button>
        </header>
        <div className="modal-body preset-modal-body">
          <div className="preset-save-block">
            <p className="preset-save-intro">{t("presets.saveIntro")}</p>
            <div className="preset-save-row">
              <label className="preset-save-label">
                <span className="preset-save-label-text">{t("presets.saveNameLabel")}</span>
                <input
                  className="preset-save-input"
                  type="text"
                  maxLength={80}
                  value={saveName}
                  placeholder={t("presets.saveNamePlaceholder")}
                  onChange={(event) => {
                    setSaveName(event.target.value);
                    if (saveError) setSaveError(null);
                  }}
                />
              </label>
              <button className="button secondary" type="button" onClick={handleSaveCurrent}>
                {t("presets.saveButton")}
              </button>
            </div>
            {saveError !== null && <p className="preset-save-error" role="alert">{saveError}</p>}
          </div>

          <h3 className="preset-subheading">{t("presets.builtinHeading")}</h3>
          <ul className="preset-list">
            {BUILTIN_PRESET_ORDER.map((id) => (
              <li key={id}>
                <button className="preset-item" type="button" onClick={() => applyBuiltin(id)}>
                  <span className="preset-item-name">{t(`presets.builtin.${id}.name`)}</span>
                  <span className="preset-item-desc">{t(`presets.builtin.${id}.description`)}</span>
                </button>
              </li>
            ))}
          </ul>

          <h3 className="preset-subheading">{t("presets.userHeading")}</h3>
          {userList.length === 0 ? (
            <p className="preset-empty">{t("presets.userEmpty")}</p>
          ) : (
            <ul className="preset-list">
              {userList.map((record) => (
                <li key={record.id} className="preset-user-row">
                  <button className="preset-item" type="button" onClick={() => applyUser(record)}>
                    <span className="preset-item-name">{record.name}</span>
                  </button>
                  <button
                    className="button icon danger preset-delete"
                    type="button"
                    title={t("presets.deleteUserTitle")}
                    aria-label={t("presets.deleteUserTitle")}
                    onClick={() => handleDeleteUser(record.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

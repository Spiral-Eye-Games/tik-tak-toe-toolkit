import { t } from "../i18n";

interface TopBarProps {
  status: string;
  /** Texto del cronómetro del jugador en turno (null = oculto). */
  clockText: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ status, clockText, canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1>{t("app.title")}</h1>
      </div>
      <div className="topbar-stage">
        <span className="topbar-stage-spacer" aria-hidden />
        <div className="topbar-center-cluster">
          <div className="topbar-turn-anchor">
            <div className="turn-pill">{status}</div>
            {clockText !== null && (
              <div className="topbar-clock-pill" aria-live="polite">
                {clockText}
              </div>
            )}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="button icon" title={t("actions.undo")} type="button" disabled={!canUndo} onClick={onUndo}>↶</button>
          <button className="button icon" title={t("actions.redo")} type="button" disabled={!canRedo} onClick={onRedo}>↷</button>
        </div>
      </div>
    </header>
  );
}

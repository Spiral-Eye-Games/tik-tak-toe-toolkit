import type { ReactNode } from "react";
import { t } from "../i18n";

interface TopBarProps {
  /** Contenido visible de la pastilla de estado (puede incluir marcas con color). */
  children: ReactNode;
  /** Texto plano equivalente para accesibilidad (p. ej. `aria-label`). */
  statusAriaLabel: string;
  /** Texto del cronómetro del jugador en turno (null = oculto). */
  clockText: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ children, statusAriaLabel, clockText, canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1>{t("app.title")}</h1>
      </div>
      <div className="topbar-stage">
        <span className="topbar-stage-spacer" aria-hidden />
        <div className="topbar-center-cluster">
          <div className="topbar-turn-anchor">
            <div className="turn-pill" role="status" aria-label={statusAriaLabel}>
              {children}
            </div>
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

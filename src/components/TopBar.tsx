import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { t } from "../i18n";
import { isTatau } from "../isTatau";

interface TopBarProps {
  /** Contenido visible de la pastilla de estado (puede incluir marcas con color). */
  children: ReactNode;
  /** Texto plano equivalente para accesibilidad (p. ej. `aria-label`). */
  statusAriaLabel: string;
  /** Tiempo del cronómetro del jugador en turno en MM:SS (null = oculto). */
  clockText: string | null;
}

export function TopBar({ children, statusAriaLabel, clockText }: TopBarProps) {
  const appTitle = isTatau() ? t("app.titleTatau") : t("app.title");

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1>{appTitle}</h1>
      </div>
      <div className="topbar-stage">
        <div className="topbar-center-cluster">
          <div className="topbar-turn-anchor">
            <div className="turn-pill" role="status" aria-label={statusAriaLabel}>
              {children}
            </div>
            {clockText !== null && (
              <div
                className="topbar-clock-pill"
                aria-live="polite"
                aria-label={t("topbar.clockAria", { time: clockText })}
              >
                <Clock className="topbar-clock-icon" aria-hidden size={18} strokeWidth={2.25} />
                <span>{clockText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

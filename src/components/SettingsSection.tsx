import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { t } from "../i18n";

interface SettingsSectionProps {
  title: string;
  icon: string;
  helpKey: string;
  defaultOpen?: boolean;
  /** Si se pasa, el acordeón se fuerza cerrado en `false` y se abre solo al pasar a `true`. */
  toggleExpanded?: boolean;
  titleToggle?: ReactNode;
  children: ReactNode;
  onHelp: (helpKey: string) => void;
}

export function SettingsSection({
  title,
  icon,
  helpKey,
  defaultOpen = false,
  toggleExpanded,
  titleToggle,
  children,
  onHelp
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(() => (toggleExpanded === false ? false : defaultOpen));
  const prevToggleExpanded = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (toggleExpanded === undefined) return;

    if (!toggleExpanded) {
      setIsOpen(false);
      prevToggleExpanded.current = false;
      return;
    }

    if (prevToggleExpanded.current === false || prevToggleExpanded.current === undefined) {
      setIsOpen(true);
    }
    prevToggleExpanded.current = true;
  }, [toggleExpanded]);

  const forceClosed = toggleExpanded === false;
  const open = forceClosed ? false : isOpen;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const el = detailsRef.current;
    if (!el || !forceClosed) return;
    el.open = false;
  }, [forceClosed, open]);

  function isInteractiveSummaryControl(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("button") || target.closest(".section-toggle"));
  }

  /** El `<details>` se abre con el clic/teclado en el `summary` antes de que `toggle` sea cancelable. */
  function blockSummaryOpenWhenDisabled(event: React.SyntheticEvent): void {
    if (toggleExpanded !== false) return;
    if (isInteractiveSummaryControl(event.target)) return;
    event.preventDefault();
  }

  return (
    <details
      ref={detailsRef}
      className={["settings-section", titleToggle ? "has-title-toggle" : "", forceClosed ? "settings-section-toggle-locked" : ""]
        .filter(Boolean)
        .join(" ")}
      open={open}
      onToggle={(event) => {
        if (toggleExpanded === false) {
          if (event.currentTarget.open) {
            setIsOpen(false);
          }
          return;
        }
        setIsOpen(event.currentTarget.open);
      }}
    >
      <summary
        className="section-header"
        onPointerDownCapture={blockSummaryOpenWhenDisabled}
        onClickCapture={blockSummaryOpenWhenDisabled}
        onKeyDownCapture={(event) => {
          if (toggleExpanded !== false) return;
          if (event.key !== " " && event.key !== "Enter") return;
          if (isInteractiveSummaryControl(event.target)) return;
          event.preventDefault();
        }}
      >
        <span className="section-icon">{icon}</span>
        <span className="section-title-wrap"><span className="section-title">{title}</span></span>
        {titleToggle}
        <Tooltip text={t("actions.explainSection", { section: title })}>
          <button
            className="help-button"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onHelp(helpKey);
            }}
          >
            {t("ui.helpButtonSymbol")}
          </button>
        </Tooltip>
        <span className="chevron">{t("ui.chevronRight")}</span>
      </summary>

      <div className="settings-card">{children}</div>
    </details>
  );
}

import { useState, type ReactNode } from "react";
import { t } from "../i18n";

interface SettingsSectionProps {
  title: string;
  icon: string;
  helpKey: string;
  defaultOpen?: boolean;
  titleToggle?: ReactNode;
  children: ReactNode;
  onHelp: (helpKey: string) => void;
}

export function SettingsSection({
  title,
  icon,
  helpKey,
  defaultOpen = false,
  titleToggle,
  children,
  onHelp
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className={`settings-section ${titleToggle ? "has-title-toggle" : ""}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="section-header">
        <span className="section-icon">{icon}</span>
        <span className="section-title-wrap"><span className="section-title">{title}</span></span>
        {titleToggle}
        <button
          className="help-button"
          title={t("actions.explainSection", { section: title })}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onHelp(helpKey);
          }}
        >{t("ui.helpButtonSymbol")}</button>
        <span className="chevron">{t("ui.chevronRight")}</span>
      </summary>

      <div className="settings-card">{children}</div>
    </details>
  );
}

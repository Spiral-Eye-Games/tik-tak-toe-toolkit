import { type ChangeEvent, type LabelHTMLAttributes, type ReactNode } from "react";

export type CustomToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Tooltip nativo del control */
  title?: string;
  children: ReactNode;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange" | "children">;

export function CustomToggle({
  checked,
  onChange,
  disabled,
  className,
  title,
  children,
  ...rest
}: CustomToggleProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label
      {...rest}
      title={title}
      className={[
        "custom-toggle-field",
        checked ? "custom-toggle-field--on" : "custom-toggle-field--off",
        disabled ? "custom-toggle-field--disabled" : "",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className="custom-toggle-field__input"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="custom-toggle-field__text">
        <span className="custom-toggle-field__label">
          <span className="custom-toggle-field__dot" aria-hidden="true" />
          <span className="custom-toggle-field__label-text">{children}</span>
        </span>
      </span>
    </label>
  );
}

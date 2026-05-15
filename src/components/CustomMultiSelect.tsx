import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { createPortal } from "react-dom";
import type { CustomSelectOption } from "./CustomSelect";
import {
  MENU_GAP,
  MENU_MAX_HEIGHT,
  Z_DESC,
  Z_MENU,
  useDescTooltipPosition
} from "./customSelectMenuShared";

export type CustomMultiSelectProps<T extends string> = {
  options: CustomSelectOption<T>[];
  /** Valores seleccionados (controlado). El orden se respeta en los chips. */
  values: readonly T[];
  onChange: (values: T[]) => void;
  disabled?: boolean;
  className?: string;
  /** Texto del botón cuando la lista está vacía. */
  placeholder: string;
  /** Texto del botón cerrado cuando hay al menos un ítem (ej. resumen con cantidad). */
  getTriggerLabel: (selected: CustomSelectOption<T>[]) => string;
  /** aria-label del botón que abre/cierra la lista. */
  triggerAriaLabel: string;
  /** aria-label del botón que quita un chip. */
  getChipRemoveAriaLabel: (value: T, label: string) => string;
  /** Opcional: describe el grupo de chips para lectores de pantalla. */
  chipListAriaLabel?: string;
};

function optionMap<T extends string>(options: CustomSelectOption<T>[]) {
  const m = new Map<T, CustomSelectOption<T>>();
  for (const o of options) m.set(o.value, o);
  return m;
}

export function CustomMultiSelect<T extends string>({
  options,
  values,
  onChange,
  disabled,
  className,
  placeholder,
  getTriggerLabel,
  triggerAriaLabel,
  getChipRemoveAriaLabel,
  chipListAriaLabel
}: CustomMultiSelectProps<T>) {
  const listId = useId();
  const chipsId = `${listId}-chips`;
  const byValue = useMemo(() => optionMap(options), [options]);

  const selectedOptions = useMemo(
    () => values.map((v) => byValue.get(v) ?? { value: v, label: v }),
    [values, byValue]
  );

  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    left: number;
    width: number;
    top: number;
    flipUp: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [descAnchor, setDescAnchor] = useState<HTMLElement | null>(null);
  const [descText, setDescText] = useState<string | null>(null);
  const { box: descBox, sync: syncDesc } = useDescTooltipPosition(descAnchor);

  const selectedSet = useMemo(() => new Set(values), [values]);

  const repositionMenu = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const estimated = Math.min(MENU_MAX_HEIGHT, options.length * 56);
    const spaceBelow = vh - r.bottom - MENU_GAP - 8;
    const flipUp = spaceBelow < Math.min(estimated, 120) && r.top > vh - r.bottom;
    setMenuBox({
      left: r.left,
      width: r.width,
      top: flipUp ? r.top - MENU_GAP : r.bottom + MENU_GAP,
      flipUp
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }
    repositionMenu();
    window.addEventListener("resize", repositionMenu);
    window.addEventListener("scroll", repositionMenu, true);
    return () => {
      window.removeEventListener("resize", repositionMenu);
      window.removeEventListener("scroll", repositionMenu, true);
    };
  }, [open, repositionMenu]);

  useLayoutEffect(() => {
    if (!open || !descAnchor) return;
    const menu = menuRef.current;
    const onScroll = () => syncDesc();
    menu?.addEventListener("scroll", onScroll);
    return () => menu?.removeEventListener("scroll", onScroll);
  }, [open, descAnchor, syncDesc]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const inTrigger = Boolean(triggerRef.current?.contains(target));
      const inMenu = Boolean(menuRef.current?.contains(target));
      if (!inTrigger && !inMenu) setOpen(false);
    }
    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  const showDesc = useCallback((el: HTMLElement, text: string | undefined) => {
    if (!text) {
      setDescAnchor(null);
      setDescText(null);
      return;
    }
    setDescAnchor(el);
    setDescText(text);
  }, []);

  const hideDesc = useCallback(() => {
    setDescAnchor(null);
    setDescText(null);
  }, []);

  useEffect(() => {
    if (!open) hideDesc();
  }, [open, hideDesc]);

  const toggleValue = useCallback(
    (v: T) => {
      if (selectedSet.has(v)) {
        onChange(values.filter((x) => x !== v));
      } else {
        onChange([...values, v]);
      }
    },
    [selectedSet, values, onChange]
  );

  const removeChip = useCallback(
    (v: T) => {
      onChange(values.filter((x) => x !== v));
    },
    [values, onChange]
  );

  const triggerText = values.length === 0 ? placeholder : getTriggerLabel(selectedOptions);

  const rootClass = ["custom-multi-select", "custom-select", open ? "custom-select--open" : "", className]
    .filter(Boolean)
    .join(" ");

  const menuPortal =
    open &&
    menuBox &&
    typeof document !== "undefined" &&
    createPortal(
      <ul
        ref={menuRef}
        id={listId}
        className="custom-select__list"
        role="listbox"
        aria-multiselectable="true"
        style={{
          position: "fixed",
          left: menuBox.left,
          width: menuBox.width,
          top: menuBox.top,
          transform: menuBox.flipUp ? "translateY(-100%)" : undefined,
          zIndex: Z_MENU,
          maxHeight: MENU_MAX_HEIGHT
        }}
      >
        {options.map((option) => {
          const descId = `${listId}-desc-${option.value}`;
          const desc = option.description?.trim();
          const isOn = selectedSet.has(option.value);
          return (
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={isOn}
                aria-describedby={desc ? descId : undefined}
                className={
                  isOn
                    ? "custom-select__option custom-select__option--active"
                    : "custom-select__option"
                }
                onPointerEnter={(e: ReactPointerEvent<HTMLButtonElement>) => {
                  showDesc(e.currentTarget, desc);
                }}
                onPointerLeave={() => hideDesc()}
                onFocus={(e) => showDesc(e.currentTarget, desc)}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (menuRef.current?.contains(next)) return;
                  hideDesc();
                }}
                onClick={() => toggleValue(option.value)}
              >
                <span className="custom-multi-select__option-row">
                  <span className="custom-multi-select__check" aria-hidden data-on={isOn ? "true" : "false"} />
                  <span className="custom-select__option-label">{option.label}</span>
                </span>
                {desc ? (
                  <span id={descId} className="custom-select__sr">
                    {desc}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body
    );

  const descPortal =
    descText &&
    descBox &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="custom-select__desc-tooltip"
        style={{
          position: "fixed",
          left: descBox.left,
          top: descBox.top,
          maxWidth: descBox.maxWidth,
          transform: descBox.transform,
          zIndex: Z_DESC
        }}
        role="tooltip"
      >
        {descText}
      </div>,
      document.body
    );

  return (
    <div className={rootClass}>
      <button
        ref={triggerRef}
        type="button"
        className="custom-select__trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={triggerAriaLabel}
        aria-describedby={selectedOptions.length > 0 && chipListAriaLabel ? chipsId : undefined}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="custom-select__current">{triggerText}</span>
        <span className="custom-select__chevron" aria-hidden />
      </button>
      {selectedOptions.length > 0 ? (
        <ul
          id={chipsId}
          className="custom-multi-select__chips"
          {...(chipListAriaLabel ? { "aria-label": chipListAriaLabel } : {})}
        >
          {selectedOptions.map((opt) => (
            <li key={opt.value} className="custom-multi-select__chip">
              <span className="custom-multi-select__chip-label">{opt.label}</span>
              <button
                type="button"
                className="custom-multi-select__chip-remove"
                aria-label={getChipRemoveAriaLabel(opt.value, opt.label)}
                disabled={disabled}
                onClick={() => removeChip(opt.value)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {menuPortal}
      {descPortal}
    </div>
  );
}

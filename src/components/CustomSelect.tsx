import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { createPortal } from "react-dom";

export type CustomSelectOption<T extends string = string> = {
  value: T;
  label: string;
  /** Texto largo; en UI se muestra al hacer hover (tooltip a la derecha). */
  description?: string;
};

export type CustomSelectProps<T extends string> = {
  options: CustomSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  triggerAriaLabel: string;
};

const MENU_MAX_HEIGHT = 240;
const MENU_GAP = 4;
const DESC_GAP = 8;
const Z_MENU = 2147482900;
const Z_DESC = 2147482950;

type DescBox = { left: number; top: number; maxWidth: number; transform: string };

function measureDescBox(anchor: HTMLElement): DescBox {
  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const margin = 12;
  const preferredLeft = r.right + DESC_GAP;
  const spaceRight = vw - preferredLeft - margin;
  if (spaceRight >= 100) {
    return {
      left: preferredLeft,
      top: r.top + r.height / 2,
      maxWidth: Math.min(320, Math.max(100, spaceRight)),
      transform: "translateY(-50%)"
    };
  }
  const spaceLeft = r.left - margin - margin;
  return {
    left: r.left - DESC_GAP,
    top: r.top + r.height / 2,
    maxWidth: Math.min(320, Math.max(80, spaceLeft)),
    transform: "translate(-100%, -50%)"
  };
}

function useDescTooltipPosition(anchor: HTMLElement | null) {
  const [box, setBox] = useState<DescBox | null>(null);

  const sync = useCallback(() => {
    if (!anchor || typeof window === "undefined") {
      setBox(null);
      return;
    }
    setBox(measureDescBox(anchor));
  }, [anchor]);

  useLayoutEffect(() => {
    if (!anchor) {
      setBox(null);
      return;
    }
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [anchor, sync]);

  return { box, sync };
}

export function CustomSelect<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
  triggerAriaLabel
}: CustomSelectProps<T>) {
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];
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

  const rootClass = ["custom-select", open ? "custom-select--open" : "", className].filter(Boolean).join(" ");

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
          return (
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                aria-describedby={desc ? descId : undefined}
                className={
                  option.value === value
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
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  hideDesc();
                }}
              >
                <span className="custom-select__option-label">{option.label}</span>
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
        onClick={() => setOpen((p) => !p)}
      >
        <span className="custom-select__current">{current?.label ?? ""}</span>
        <span className="custom-select__chevron" aria-hidden />
      </button>
      {menuPortal}
      {descPortal}
    </div>
  );
}

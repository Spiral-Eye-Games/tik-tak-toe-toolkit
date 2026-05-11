import {
  cloneElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement
} from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  /** Texto del tooltip (también como `aria-label` del control cuando `passAriaLabel` es true). */
  text: string;
  children: ReactElement;
  className?: string;
  passAriaLabel?: boolean;
}

interface TooltipPos {
  left: number;
  top: number;
  translateY: string;
  maxWidth: number;
}

function measureTooltipPos(host: HTMLElement): TooltipPos {
  const r = host.getBoundingClientRect();
  const gap = 10;
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const maxWidth = Math.min(280, vw - 24);

  let top = r.bottom + gap;
  let translateY = "0";
  const estHeight = 96;
  if (top + estHeight > vh - 12) {
    top = r.top - gap;
    translateY = "-100%";
  }

  let left = r.left + r.width / 2;
  const half = maxWidth / 2 + 12;
  left = Math.max(half, Math.min(vw - half, left));

  return { left, top, translateY, maxWidth };
}

export function Tooltip({ text, children, className, passAriaLabel = true }: TooltipProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TooltipPos | null>(null);

  const syncPosition = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    setPos(measureTooltipPos(host));
  }, []);

  const show = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    setPos(measureTooltipPos(host));
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open, syncPosition]);

  const extra = passAriaLabel ? ({ "aria-label": text } as const) : {};
  const childProps = children.props as {
    onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
    onFocus?: (e: FocusEvent<HTMLElement>) => void;
    onBlur?: (e: FocusEvent<HTMLElement>) => void;
  };

  const mergedProps = {
    ...extra,
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(e);
      show();
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(e);
      if (!hostRef.current?.contains(e.relatedTarget as Node | null)) {
        hide();
      }
    }
  };

  const child = cloneElement(children, mergedProps as Parameters<typeof cloneElement>[1]);

  const portalNode =
    open &&
    pos !== null &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="tooltip-portal"
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          maxWidth: pos.maxWidth,
          transform: `translate(-50%, ${pos.translateY})`,
          zIndex: 2147483000
        }}
        aria-hidden
      >
        {text}
      </div>,
      document.body
    );

  return (
    <span ref={hostRef} className={["tooltip-host", className].filter(Boolean).join(" ")}>
      {child}
      {portalNode}
    </span>
  );
}

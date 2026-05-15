import { useCallback, useLayoutEffect, useState } from "react";

export const MENU_MAX_HEIGHT = 240;
export const MENU_GAP = 4;
export const DESC_GAP = 8;
export const Z_MENU = 2147482900;
export const Z_DESC = 2147482950;

export type DescBox = { left: number; top: number; maxWidth: number; transform: string };

export function measureDescBox(anchor: HTMLElement): DescBox {
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

export function useDescTooltipPosition(anchor: HTMLElement | null) {
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

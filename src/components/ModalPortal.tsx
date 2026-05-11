import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  open: boolean;
  children: ReactNode;
}

export function ModalPortal({ open, children }: ModalPortalProps) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

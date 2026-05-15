import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export type CustomInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

const BASE = "custom-field-input";

function mergeClasses(extra: string | undefined): string {
  return [BASE, extra].filter(Boolean).join(" ");
}

/** `<input>` con la misma cromía y métricas que selectores/toggle y campos numerados modular (tokens `--field-control-*`). */
export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(function CustomInput({ className, ...rest }, ref) {
  return <input ref={ref} className={mergeClasses(className)} {...rest} />;
});

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";

export interface NumericDraftInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number;
  onCommit: (value: number) => void;
  commitDelayMs?: number;
}

export function NumericDraftInput({
  value,
  onCommit,
  commitDelayMs = 700,
  disabled,
  onBlur,
  ...props
}: NumericDraftInputProps) {
  const { step, min, max } = props;
  const [draftValue, setDraftValue] = useState(String(value));
  const commitTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  useEffect(() => {
    return () => {
      window.clearTimeout(commitTimeoutRef.current);
    };
  }, []);

  function clearPendingCommit() {
    window.clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = undefined;
  }

  function parseDraft(valueToParse: string) {
    const trimmedValue = valueToParse.trim();
    if (trimmedValue === "" || trimmedValue === "-" || trimmedValue === "+") return null;

    const parsedValue = Number(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function parseNumericProp(propValue: InputHTMLAttributes<HTMLInputElement>[keyof InputHTMLAttributes<HTMLInputElement>]) {
    const parsedValue = Number(propValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function normalizeDraft(valueToNormalize: string) {
    const parsedValue = parseDraft(valueToNormalize);
    if (parsedValue === null) return null;

    const stepValue = parseNumericProp(step);
    const minValue = parseNumericProp(min);
    const maxValue = parseNumericProp(max);
    let nextValue = stepValue !== null && Number.isInteger(stepValue) ? Math.trunc(parsedValue) : parsedValue;

    if (minValue !== null) nextValue = Math.max(minValue, nextValue);
    if (maxValue !== null) nextValue = Math.min(maxValue, nextValue);
    return nextValue;
  }

  function scheduleCommit(nextDraftValue: string) {
    clearPendingCommit();
    const normalizedValue = normalizeDraft(nextDraftValue);
    if (normalizedValue === null || disabled) return;

    commitTimeoutRef.current = window.setTimeout(() => {
      setDraftValue(String(normalizedValue));
      onCommit(normalizedValue);
      commitTimeoutRef.current = undefined;
    }, commitDelayMs);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraftValue = event.target.value;
    setDraftValue(nextDraftValue);
    scheduleCommit(nextDraftValue);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    clearPendingCommit();
    const normalizedValue = normalizeDraft(event.target.value);

    if (normalizedValue === null || disabled) {
      setDraftValue(String(value));
    } else {
      setDraftValue(String(normalizedValue));
      onCommit(normalizedValue);
    }

    onBlur?.(event);
  }

  return (
    <input
      {...props}
      type="number"
      disabled={disabled}
      value={draftValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

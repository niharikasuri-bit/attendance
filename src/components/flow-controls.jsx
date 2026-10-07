import { Check, Minus } from "lucide-react";

export const backButtonClass =
  "flex items-center gap-1.5 rounded-md border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5";

export const primaryButtonClass =
  "rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export function Checkbox({ checked, indeterminate = false, size = "size-4" }) {
  const on = checked || indeterminate;
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-xs border ${
        on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"
      }`}
    >
      {checked ? <Check className="size-3" strokeWidth={3} /> : indeterminate && <Minus className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function RadioDot({ selected, className = "" }) {
  return (
    <span
      className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? "border-primary" : "border-muted-foreground/40"
      } ${className}`}
    >
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </span>
  );
}

/** Selectable card with a radio dot, title and description. */
export function RadioCard({ label, text, selected, onSelect, dotClassName }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-primary bg-selected-bg" : "border-border bg-info-bg hover:border-muted-foreground/30"
      }`}
    >
      <RadioDot selected={selected} className={dotClassName} />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-heading">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

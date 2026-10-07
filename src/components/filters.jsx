import { ChevronDown, Search } from "lucide-react";

export const BOUNDARY_LEVEL_OPTIONS = ["State", "LGA", "Ward", "Settlement"];

/** True when a register's comma-separated boundary list includes `level`. */
export const hasBoundaryLevel = (register, level) => register.boundary.split(",").some((b) => b.trim() === level);

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="w-56">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">Select</option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export function FilterInput({ label, value, onChange }) {
  return (
    <div className="w-56">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
      />
    </div>
  );
}

/** Row of filters followed by "Clear Search" and "Search" (filters apply live). */
export function FilterBar({ children, onClear }) {
  return (
    <div className="mt-5 flex flex-wrap items-end gap-4">
      {children}
      <div className="ml-auto flex items-center gap-4">
        <button onClick={onClear} className="text-sm font-medium text-primary hover:underline">
          Clear Search
        </button>
        <button className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95">
          <Search className="size-4" /> Search
        </button>
      </div>
    </div>
  );
}

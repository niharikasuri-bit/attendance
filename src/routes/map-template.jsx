import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Info, Search, X } from "lucide-react";
import { AppShell, Breadcrumb, FlowFooter } from "@/components/app-shell";
import { Checkbox, RadioCard, backButtonClass, primaryButtonClass } from "@/components/flow-controls";
import { attendanceActions, getRegisters, getState, useAttendanceStore } from "@/lib/attendance-store";

// Steps: 0 registers, 1 enrollment date.
const LAST_STEP = 1;

const PER_USER = "Different date for each user";

const ENROLLMENT_OPTIONS = [
  { label: PER_USER, text: "Add an enrollment date for each user in the generated template." },
  { label: "Same date for all users", text: "Choose one enrollment date that applies to everyone." },
];

const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

function DateField({ label, value, onChange, hint }) {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-2 md:grid-cols-[minmax(180px,2fr)_3fr]">
        <label className="text-sm font-bold text-foreground">
          {label} <span className="text-primary">*</span>
        </label>
        <div>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function SearchField({ id, label, value, onChange, placeholder }) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative mt-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

/** Register checklist with name and boundary search. Selections are kept while searching. */
function RegisterPicker({ registers, selected, onChange, newIds }) {
  const [nameQuery, setNameQuery] = useState("");
  const [boundaryQuery, setBoundaryQuery] = useState("");
  const name = nameQuery.trim().toLowerCase();
  const boundary = boundaryQuery.trim().toLowerCase();
  const searching = !!(name || boundary);
  // Boundary search matches the register's boundary name and its boundary levels.
  const matchesBoundary = (r) => [r.boundaryName, r.boundary].some((v) => v?.toLowerCase().includes(boundary));
  const shown = registers.filter((r) => (!name || r.name.toLowerCase().includes(name)) && (!boundary || matchesBoundary(r)));
  const shownSelected = shown.filter((r) => selected.includes(r.id)).length;
  const allShown = shown.length > 0 && shownSelected === shown.length;

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const toggleShown = () => {
    const ids = new Set(shown.map((r) => r.id));
    onChange(allShown ? selected.filter((id) => !ids.has(id)) : [...new Set([...selected, ...ids])]);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="flex flex-col gap-3 border-b border-border bg-info-bg p-3 sm:flex-row sm:items-end">
        <SearchField id="register-name-search" label="Register name" value={nameQuery} onChange={setNameQuery} placeholder="e.g. BILL 16273673" />
        <SearchField id="register-boundary-search" label="Boundary" value={boundaryQuery} onChange={setBoundaryQuery} placeholder="e.g. Angwan or Ward" />
        {searching && (
          <button
            type="button"
            onClick={() => {
              setNameQuery("");
              setBoundaryQuery("");
            }}
            className="shrink-0 pb-2 text-sm font-medium text-primary hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={allShown ? "true" : shownSelected > 0 ? "mixed" : "false"}
          disabled={shown.length === 0}
          onClick={toggleShown}
          className="flex items-center gap-3 text-sm font-semibold text-primary disabled:opacity-40"
        >
          <Checkbox checked={allShown} indeterminate={shownSelected > 0 && !allShown} />
          {searching ? `Select all ${plural(shown.length, "result")}` : "Select all"}
        </button>
        <span className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
          {plural(selected.length, "register")} selected
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="font-medium text-primary hover:underline">
              Clear
            </button>
          )}
        </span>
      </div>

      <ul className="max-h-[420px] overflow-y-auto" aria-label="Registers">
        {shown.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No registers match your search.</li>}
        {shown.map((r) => {
          const checked = selected.includes(r.id);
          return (
            <li key={r.id} className="border-b border-border last:border-0">
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(r.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${checked ? "bg-selected-bg" : "hover:bg-muted/40"}`}
              >
                <span className="mt-0.5">
                  <Checkbox checked={checked} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-heading">{r.name}</span>
                    {newIds.includes(r.id) && (
                      <span className="rounded-xs bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">New</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {r.boundary} · {r.frequency} a day
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{plural(r.users, "user")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MapTemplate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useAttendanceStore();
  const registers = useMemo(() => getRegisters(store), [store]);

  // `?step=N` means we came back from the review page: restore the saved choices.
  const stepParam = params.get("step");
  const resuming = stepParam !== null;
  const saved = resuming ? getState().mappingOptions : null;

  // Otherwise preselect the registers just uploaded, or the one we came from on View Register.
  const [newIds] = useState(() => {
    if (params.get("preselect") !== "latest") return [];
    const ids = getRegisters(getState()).map((r) => r.id);
    return getState().latestIds.filter((id) => ids.includes(id));
  });
  const [selected, setSelected] = useState(() => {
    if (resuming) return getState().mappingIds;
    // `?register=` (from View Register) or `?registers=a,b` (bulk action on Manage Registers).
    const ids = (params.get("registers") ?? params.get("register") ?? "").split(",").filter(Boolean);
    return ids.length ? ids : newIds;
  });

  // Registers with users already have enrollment dates, so they can't be picked again —
  // except one the user explicitly came here to map (e.g. from View Register). First-time
  // users (who haven't mapped anyone yet) see every register and no notice.
  const firstTimeMapping = store.users.length === 0;
  const selectable = firstTimeMapping ? registers : registers.filter((r) => r.users === 0 || selected.includes(r.id));
  const hiddenCount = registers.length - selectable.length;
  const [noticeOpen, setNoticeOpen] = useState(true);

  const [step, setStep] = useState(() => Math.min(Math.max(Number(stepParam) || 0, 0), LAST_STEP));
  // Older saved choices used "Set per user" for the per-user option.
  const [enrollment, setEnrollment] = useState(() => (saved?.enrollment === "Set per user" ? PER_USER : saved?.enrollment ?? PER_USER));
  const [enrollmentDate, setEnrollmentDate] = useState(saved?.enrollmentDate ?? "2026-02-12");
  const canContinue = step === 0 ? selected.length > 0 : !!enrollment;

  const next = () => {
    if (step === 0) attendanceActions.setMappingRegisters(selected);
    if (step < LAST_STEP) return setStep((s) => s + 1);
    attendanceActions.setMappingOptions({ enrollment, enrollmentDate });
    navigate("/attendance/map-summary");
  };

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-28 pt-4">
        <div className="w-full">
          <Breadcrumb
            items={[{ label: "Home", to: "/" }, { label: "Attendance Setup & Management", to: "/attendance" }, { label: "Customize your User Mapping Template" }]}
          />
          <h1 className="mt-3 font-condensed text-3xl font-bold text-heading">Customize your User Mapping Template</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up the template by choosing which registers it covers and from when attendance is marked.
          </p>

          <div className="mt-5 rounded-lg border border-border bg-card px-8 py-6">
            {step === 0 && (
              <>
                <h2 className="text-2xl font-bold text-heading">Which registers do you want to map users to?</h2>
                <p className="mt-1 text-sm text-muted-foreground">The template will be pre-filled with the Register IDs and boundaries of the registers you select.</p>
                {hiddenCount > 0 && noticeOpen && (
                  <div role="note" className="mt-4 flex items-start gap-2.5 rounded-md border border-info-foreground/20 bg-info px-4 py-3 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0 text-info-foreground" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-heading">Only registers without enrollment dates are shown here.</p>
                      <p className="mt-0.5 text-muted-foreground">
                        Registers that already have enrollment dates set can't be selected, so they won't appear in this list.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoticeOpen(false)}
                      aria-label="Dismiss"
                      className="ml-auto shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <RegisterPicker registers={selectable} selected={selected} onChange={setSelected} newIds={newIds} />
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-heading">From which date should attendance be marked for these users?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is the enrollment date. Users appear on the register from this date and can be marked Present or Absent.
                </p>
                <div className="mt-4 space-y-3">
                  {ENROLLMENT_OPTIONS.map((o) => (
                    <RadioCard key={o.label} label={o.label} text={o.text} selected={enrollment === o.label} onSelect={() => setEnrollment(o.label)} />
                  ))}
                </div>
                {enrollment === "Same date for all users" && (
                  <DateField
                    label="Enrollment Date"
                    value={enrollmentDate}
                    onChange={setEnrollmentDate}
                    hint="The campaign start date is selected by default. You can change it if needed."
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <FlowFooter>
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className={backButtonClass}>
            <ChevronLeft className="size-4" /> Back
          </button>
        ) : (
          <Link to="/attendance" className={backButtonClass}>
            <ChevronLeft className="size-4" /> Back
          </Link>
        )}
        <button disabled={!canContinue} onClick={next} className={primaryButtonClass}>
          {step === LAST_STEP ? "Review Template" : "Next"}
        </button>
      </FlowFooter>
    </AppShell>
  );
}

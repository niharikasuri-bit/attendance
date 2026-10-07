import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AppShell, Breadcrumb, FlowFooter } from "@/components/app-shell";
import { Checkbox, RadioDot, backButtonClass, primaryButtonClass } from "@/components/flow-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { attendanceActions, getState } from "@/lib/attendance-store";
import { hasGeneratedRegisters } from "./attendance-home";

export const BOUNDARY_LEVELS = [
  { label: "State", count: "1 state" },
  { label: "LGA", count: "6 LGAs" },
  { label: "Ward", count: "14 wards" },
  { label: "Settlement", count: "96 settlements" },
];

export const FREQUENCIES = [
  { label: "Once a day", chip: "One register with a single attendance session" },
  { label: "Twice a day", chip: "One register with multiple attendance sessions" },
];

export default function CustomizeTemplate() {
  const navigate = useNavigate();
  // `?step=N` means we came back from the review page: restore the saved choices.
  const [params] = useSearchParams();
  const resuming = params.get("step") !== null;
  const [step, setStep] = useState(() => (resuming && params.get("step") === "1" ? 1 : 0));
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [levels, setLevels] = useState(() => (resuming ? getState().templateLevels : []));
  const [frequency, setFrequency] = useState(() => (resuming ? getState().templateFrequency : null));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const allSelected = levels.length === BOUNDARY_LEVELS.length;
  const toggleLevel = (label) => setLevels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  const canContinue = step === 0 ? levels.length > 0 : !!frequency;

  // Registers already exist for every boundary level, so picking all of them can't create new ones.
  const [existsAlertOpen, setExistsAlertOpen] = useState(false);


  const next = () => {
    // First-time users haven't uploaded any registers yet, so nothing can already exist for them.
    if (step === 0) return allSelected && hasGeneratedRegisters() ? setExistsAlertOpen(true) : setStep(1);
    attendanceActions.setRegisterTemplateOptions({ levels, frequency });
    navigate("/attendance/register-summary");
  };

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-28 pt-4">
        <div className="w-full">
          <Breadcrumb
            items={[
              { label: "Home", to: "/" },
              { label: "Attendance Setup & Management", to: "/attendance" },
              { label: "Customize your Attendance Register Template" },
            ]}
          />
          <h1 className="mt-3 font-condensed text-3xl font-bold text-heading">Customize your Attendance Register Template</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize your attendance register template by selecting the boundary levels and attendance frequency.
          </p>

          <div className="mt-5 rounded-lg border border-border bg-card px-8 py-6">
            {step === 0 && (
              <>
                <h2 className="text-2xl font-bold text-heading">What boundary levels are you generating registers for?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select one or more boundary levels from the dropdown below. We'll create a register for every boundary at the levels you select.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-[216px_minmax(0,1fr)] sm:items-center sm:gap-6">
                  <label className="text-sm font-bold text-foreground">
                    Boundary level <span className="text-primary">*</span>
                  </label>
                  <div ref={dropdownRef} className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setOpen((o) => !o)}
                      aria-expanded={open}
                      className={`flex w-full items-center justify-between rounded-md border bg-card px-3 py-2.5 text-left text-sm ${
                        open ? "border-primary" : "border-input"
                      }`}
                    >
                      <span className={levels.length ? "text-foreground" : "text-muted-foreground"}>
                        {levels.length ? levels.join(", ") : "Select boundary levels..."}
                      </span>
                      {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </button>
                    {open && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
                        <button
                          type="button"
                          onClick={() => setLevels(allSelected ? [] : BOUNDARY_LEVELS.map((l) => l.label))}
                          className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left hover:bg-muted"
                        >
                          <Checkbox checked={allSelected} size="size-4.5" />
                          <span className="text-sm font-semibold text-primary">Select All</span>
                        </button>
                        {BOUNDARY_LEVELS.map((level) => (
                          <button
                            key={level.label}
                            type="button"
                            onClick={() => toggleLevel(level.label)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted"
                          >
                            <Checkbox checked={levels.includes(level.label)} size="size-4.5" />
                            <span className="text-sm font-semibold text-foreground">{level.label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{level.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-heading">How many times will attendance be recorded each day?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose how many times attendance will be recorded each day.</p>
                <div className="mt-4 space-y-3">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setFrequency(f.label)}
                      className={`flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors ${
                        frequency === f.label ? "border-primary bg-selected-bg" : "border-border bg-info-bg hover:border-muted-foreground/30"
                      }`}
                    >
                      <RadioDot selected={frequency === f.label} />
                      <span>
                        <span className="block text-sm font-bold text-heading">{f.label}</span>
                        <span className="mt-1.5 inline-block rounded-xs bg-chip px-2 py-1 text-[11px] font-semibold text-heading">{f.chip}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <FlowFooter>
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className={backButtonClass}>
            Back
          </button>
        ) : (
          <Link to="/attendance" className={backButtonClass}>
            Back
          </Link>
        )}
        <button disabled={!canContinue} onClick={next} className={primaryButtonClass}>
          {step === 1 ? "Review Template" : "Next"}
        </button>
      </FlowFooter>
      <Dialog open={existsAlertOpen} onOpenChange={setExistsAlertOpen}>
        <DialogContent className="max-w-[40rem] gap-0 bg-white px-10 pb-8 pt-10 text-center sm:rounded-lg">
          <svg viewBox="0 0 24 24" className="mx-auto size-14" aria-hidden="true">
            <path d="M12 2.5 22.5 21h-21L12 2.5Z" fill="#B91900" />
            <path d="M12 9v5.5" stroke="white" strokeWidth="2.2" strokeLinecap="square" />
            <path d="M12 17.2v1.4" stroke="white" strokeWidth="2.2" strokeLinecap="square" />
          </svg>
          <DialogTitle className="mt-4 text-2xl font-bold leading-tight text-heading">Registers already exist for these boundary levels</DialogTitle>
          <DialogDescription className="mt-3 text-base leading-relaxed text-foreground">
            Attendance registers have already been created for the{" "}
            <strong className="font-semibold">
              {BOUNDARY_LEVELS.slice(0, -1)
                .map((l) => l.label)
                .join(", ")}{" "}
              and {BOUNDARY_LEVELS[BOUNDARY_LEVELS.length - 1].label}
            </strong>{" "}
            boundary levels. To view or edit the existing register, go to <strong className="font-semibold">Manage Registers</strong>. You can also
            continue to create a new register; it will be generated with a <strong className="font-semibold">new Register ID</strong>.
          </DialogDescription>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/attendance/registers")}
              className="rounded-md border border-primary bg-white px-4 py-3 text-base font-medium text-primary transition-colors hover:bg-primary/5"
            >
              Go to Manage Registers
            </button>
            <button
              onClick={() => {
                setExistsAlertOpen(false);
                setStep(1);
              }}
              className="rounded-md bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:brightness-95"
            >
              Continue Creating New Register
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

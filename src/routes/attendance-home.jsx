import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { X } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/app-shell";
import illustration from "@/assets/attendance-illustration.png";

// Set by the upload step once registers have been added.
export const REGISTER_GENERATED_KEY = "attendanceRegisterGenerated";

/** True once the user has uploaded registers at least once. */
export function hasGeneratedRegisters() {
  try {
    return localStorage.getItem(REGISTER_GENERATED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AttendanceHome() {
  const [introOpen, setIntroOpen] = useState(true);

  // Returning users work from the register list; only first-time users see this empty state.
  if (hasGeneratedRegisters()) return <Navigate to="/attendance/registers" replace />;

  const crumbs = [{ label: "Home", to: "/" }, { label: "Attendance Setup & Management" }];

  return (
    <AppShell>
      <main className="min-w-0 flex-1 px-6 pb-12 pt-4">
          <>
            <div className="max-w-5xl">
              <Breadcrumb items={crumbs} />
            </div>
            <div className="mt-8 flex w-full justify-center">
              <div className="flex w-full max-w-none flex-col items-center rounded-md border border-border bg-card p-6 text-center">
                <img src={illustration} alt="Illustration of an attendance register clipboard" className="h-44 w-auto object-contain" width={1024} height={1024} />
                <h2 className="mt-4 text-2xl font-bold text-heading">Start by creating your attendance register</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Create an attendance register to record and manage attendance for campaign users.</p>
                <Link
                  to="/attendance/customize"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
                >
                  Generate New Register
                </Link>
              </div>
            </div>
          </>
      </main>

      {introOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label="What is an attendance register?">
          <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-md bg-card shadow-xl">
            <button
              aria-label="Close"
              onClick={() => setIntroOpen(false)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-5" />
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-8 [@media(max-height:640px)]:pt-6">
              <img
                src={illustration}
                alt="Illustration of an attendance register clipboard"
                className="mx-auto h-32 w-32 object-contain [@media(max-height:640px)]:h-20 [@media(max-height:640px)]:w-20"
                width={1024}
                height={1024}
              />
              <h2 className="mt-4 text-center text-xl font-bold text-heading">What is an attendance register?</h2>
              <p className="mt-3 rounded-lg bg-info-bg px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
                An attendance register is a ready-to-use list for recording who attended a campaign event.
              </p>
              <hr className="mt-5 border-border" />
              <h3 className="mt-4 text-sm font-bold text-heading">What's inside?</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Each register contains:</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { label: "Where", text: "The boundary the register is for" },
                  { label: "When", text: "The session when attendance is recorded" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-info-bg p-2.5">
                    <span className="rounded-md bg-chip px-1.5 py-0.5 text-[11px] font-semibold text-heading">{item.label}</span>
                    <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
              <hr className="mt-5 border-border" />
              <h3 className="mt-4 text-sm font-bold text-heading">What can you do with it?</h3>
              <p className="mt-2 rounded-lg bg-info-bg px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Add or remove users</span> from the register, then mark each user as{" "}
                <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-800">Present</span> or{" "}
                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-800">Absent</span> as attendance is recorded.
              </p>
            </div>
            <div className="shrink-0 px-6 pb-6 pt-4">
              <Link
                to="/attendance/customize"
                className="block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
              >
                Generate New Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

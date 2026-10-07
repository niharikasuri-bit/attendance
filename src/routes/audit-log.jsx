import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AppShell, Breadcrumb, FlowFooter } from "@/components/app-shell";
import { backButtonClass } from "@/components/flow-controls";
import { FilterBar, FilterSelect } from "@/components/filters";
import { getRegisters, useAttendanceStore } from "@/lib/attendance-store";

const ACTIONS = ["Template Downloaded", "Register Generated", "Register Edited", "Register Deleted", "Users Mapped", "Register Downloaded"];

const SEED_GENERATED = [
  { id: "a-5", register: "BILL 16273677", boundary: "State, LGA, Ward, Settlement", frequency: "once", officer: "Rahul Verma", minute: "36" },
  { id: "a-4", register: "BILL 16273676", boundary: "State, LGA, Ward", frequency: "twice", officer: "Meera Iyer", minute: "35" },
  { id: "a-3", register: "BILL 16273675", boundary: "State, LGA", frequency: "once", officer: "Anita Sharma", minute: "34" },
  { id: "a-2", register: "BILL 16273674", boundary: "State, LGA, Ward", frequency: "twice", officer: "Rahul Verma", minute: "33" },
  { id: "a-1", register: "BILL 16273673", boundary: "State, LGA, Ward, Settlement", frequency: "once", officer: "Anita Sharma", minute: "32" },
];

// Historical entries shown beneath anything logged during this session.
const SEED_LOG = [
  { id: "a-10", action: "Register Downloaded", register: "BILL 16273676", details: "Signature list downloaded · 12 users", user: "Meera Iyer", role: "Attendance Officer", at: "2025-08-25T17:05:00+05:30" },
  { id: "a-9", action: "Register Downloaded", register: "BILL 16273677", details: "Attendance report downloaded · 43 users", user: "Rahul Verma", role: "Attendance Officer", at: "2025-08-22T18:20:00+05:30" },
  {
    id: "a-8",
    action: "Users Mapped",
    register: "BILL 16273677",
    details: "43 users mapped from Attendee_Template.xlsx · Roles: DISTRIBUTOR, FIELD_SUPPORT, TEAM_SUPERVISOR",
    user: "Suresh Patel",
    role: "Data Entry Operator",
    at: "2025-08-19T15:41:00+05:30",
  },
  {
    id: "a-7",
    action: "Users Mapped",
    register: "BILL 16273676",
    details: "12 users mapped from Attendee_Template.xlsx · Roles: DISTRIBUTOR, WAREHOUSE_MANAGER",
    user: "Suresh Patel",
    role: "Data Entry Operator",
    at: "2025-08-19T15:40:00+05:30",
  },
  {
    id: "a-6",
    action: "Template Downloaded",
    register: "",
    details: "User mapping template downloaded for BILL 16273676, BILL 16273677",
    user: "Suresh Patel",
    role: "Data Entry Operator",
    at: "2025-08-19T10:05:00+05:30",
  },
  ...SEED_GENERATED.map((e) => ({
    id: e.id,
    action: "Register Generated",
    register: e.register,
    details: `Created from Attendance_Register_Template.xlsx · Boundary level: ${e.boundary} · Attendance ${e.frequency} a day · Officer: ${e.officer}`,
    user: "Aisha Bello",
    role: "Campaign Supervisor",
    at: `2025-08-18T11:${e.minute}:00+05:30`,
  })),
  {
    id: "a-0",
    action: "Template Downloaded",
    register: "",
    details: "Attendance register template downloaded · 5 registers · 1 session a day",
    user: "Aisha Bello",
    role: "Campaign Supervisor",
    at: "2025-08-18T09:10:00+05:30",
  },
];

const formatDateTime = (iso) =>
  new Date(iso)
    .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(/ (\d{4}),?/, " $1,");

const COLUMNS = ["Register Name", "Action", "Details", "Role", "Date & Time"];

export default function AuditLog() {
  const [action, setAction] = useState("");
  const [register, setRegister] = useState("");
  const store = useAttendanceStore();
  const registerIds = useMemo(() => new Map(getRegisters(store).map((r) => [r.name, r.id])), [store]);
  const entries = useMemo(() => [...store.auditLog, ...SEED_LOG], [store.auditLog]);
  const visible = useMemo(
    () => entries.filter((e) => (!register || e.register === register) && (!action || e.action === action)),
    [entries, register, action],
  );

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-28 pt-4">
        <div className="w-full">
          <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Attendance Setup & Management", to: "/attendance" }, { label: "Audit Log" }]} />

          <div className="mt-4 rounded-lg border border-border bg-card px-6 py-5">
            <h1 className="font-condensed text-3xl font-bold text-heading">Audit Log</h1>
            <FilterBar
              onClear={() => {
                setAction("");
                setRegister("");
              }}
            >
              <FilterSelect
                label="Register Name"
                value={register}
                onChange={setRegister}
                options={Array.from(new Set(entries.map((e) => e.register).filter(Boolean))).sort()}
              />
              <FilterSelect label="Action" value={action} onChange={setAction} options={ACTIONS} />
            </FilterBar>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] border-collapse text-left">
                <thead>
                  <tr className="bg-muted">
                    {COLUMNS.map((label, i) => (
                      <th
                        key={label}
                        className={`px-4 py-3 text-xs font-bold text-heading ${i === 0 ? "rounded-l-md" : ""} ${i === COLUMNS.length - 1 ? "rounded-r-md" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No audit log entries match the selected filters.
                      </td>
                    </tr>
                  )}
                  {visible.map((e) => (
                    <tr key={e.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 text-sm font-medium">
                        {registerIds.has(e.register) ? (
                          <Link className="text-primary underline" to={`/attendance/registers/${registerIds.get(e.register)}?from=audit-log`}>
                            {e.register}
                          </Link>
                        ) : (
                          <span className={e.register ? "text-foreground" : "text-muted-foreground"}>{e.register || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-xs bg-chip px-2 py-1 text-[11px] font-semibold text-heading">{e.action}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{e.details}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{e.role}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDateTime(e.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <FlowFooter>
        <Link to="/attendance" className={backButtonClass}>
          <ChevronLeft className="size-4" /> Back
        </Link>
      </FlowFooter>
    </AppShell>
  );
}

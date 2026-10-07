import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell, Breadcrumb } from "@/components/app-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getRegisters, useAttendanceStore } from "@/lib/attendance-store";
import { downloadSimpleSheet } from "@/lib/templates";
import emptyIllustration from "@/assets/empty-attendance-register.png";

// Material icon paths used by this (Figma-matched) screen.
const PATHS = {
  arrowBack: "M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z",
  dropDown: "M7 10L12 15L17 10H7Z",
  forwardIos: "M5.87891 4.12L13.7589 12L5.87891 19.88L7.99891 22L17.9989 12L7.99891 2L5.87891 4.12Z",
  checkCircle:
    "M16.59 7.58L10 14.17L6.41 10.59L5 12L10 17L18 9L16.59 7.58ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z",
  chevronLeft: "M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z",
  chevronRight: "M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z",
  firstPage: "M18.41 16.59L13.82 12L18.41 7.41L17 6L11 12L17 18L18.41 16.59ZM6 6H8V18H6V6Z",
  lastPage: "M5.59 7.41L10.18 12L5.59 16.59L7 18L13 12L7 6L5.59 7.41ZM16 6H18V18H16V6Z",
  edit: "M12.126 8.125L14.063 6.188L17.81 9.935L15.873 11.873L12.126 8.125ZM20.71 5.63L18.37 3.29C18.1826 3.10375 17.9292 2.99921 17.665 2.99921C17.4008 2.99921 17.1474 3.10375 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7C20.8844 6.81454 20.9815 6.56956 20.9815 6.315C20.9815 6.06044 20.8844 5.81546 20.71 5.63ZM8.63 11.63L3 17.25V21H6.75L12.38 15.38L15.873 11.873L12.126 8.125L8.63 11.63Z",
};

function MIcon({ path, fill = "#0B0C0C", className = "" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`block shrink-0 ${className}`}>
      <path d={path} fill={fill} />
    </svg>
  );
}

const ORIGINS = {
  manage: { label: "Manage Registers", to: "/attendance/registers" },
  "audit-log": { label: "Audit Log", to: "/attendance/audit-log" },
};

const CAMPAIGN = { name: "Campaign Name 1", dates: "21 August - 30 August, 2025" };
const ATTENDANCE_DAYS = ["21/08/2025", "22/08/2025", "23/08/2025", "24/08/2025", "25/08/2025"];
const UNMARKED_DAY = 4;
const TARGET_PER_DAY = 70;
const PAGE_SIZES = [5, 10, 20];

function hash(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Deterministic sample attendance (per-day present/absent) and performance for a worker. */
function withAttendance(worker) {
  const h = hash(worker.id);
  const days = ATTENDANCE_DAYS.map((_, i) => (i === UNMARKED_DAY ? null : worker.status === "Active" || ((h >> i) % 2) === 0));
  const present = days.filter(Boolean).length;
  return { ...worker, days, performance: present * (40 + (h % 30)) };
}

function registerWorkers(registerId, users) {
  return users
    .filter((u) => u.registerId === registerId)
    .map((u) => withAttendance({ id: u.id, name: u.name, role: u.role, teamCode: u.teamCode || "—", status: u.status }));
}

const daysWorked = (w) => w.days.filter(Boolean).length;

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-md px-3 py-1 text-sm leading-[1.37] ${
        status === "Active" ? "bg-[#f1fff8] text-[#00703c]" : "bg-[#fff5f4] text-[#b91900]"
      }`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 text-base sm:flex-row sm:items-center sm:gap-16">
      <dt className="font-bold leading-[1.14] text-foreground sm:w-[250px] sm:shrink-0">{label}</dt>
      <dd className="leading-[1.37] text-muted-foreground">{value}</dd>
    </div>
  );
}

function downloadOptions(register, registerName, workers) {
  const base = (w) => [w.name, w.role, w.teamCode, w.status];
  const filePrefix = registerName.replace(/[^\w-]+/g, "_");
  const headers = ["Worker Name", "Role", "Team Code", "Status"];
  const audit = (what) => ({
    action: "Register Downloaded",
    register: register?.name ?? registerName,
    details: `${what} downloaded · ${workers.length} ${workers.length === 1 ? "user" : "users"}`,
  });
  return [
    {
      label: "Download Attendance Report",
      run: () =>
        downloadSimpleSheet(
          `${filePrefix}_Attendance_Report.xlsx`,
          "Attendance Report",
          [...headers, ...ATTENDANCE_DAYS, "Days Worked", "Performance"],
          workers.map((w) => [...base(w), ...w.days.map((d) => (d === null ? "Not marked" : d ? "Present" : "Absent")), daysWorked(w), w.performance]),
          audit("Attendance report"),
        ),
    },
    {
      label: "Download Signature List",
      run: () =>
        downloadSimpleSheet(
          `${filePrefix}_Signature_List.xlsx`,
          "Signature List",
          [...headers, "Register ID", "Days Worked", "Signature"],
          workers.map((w) => [...base(w), register?.name ?? registerName, daysWorked(w), null]),
          audit("Signature list"),
        ),
    },
    {
      label: "Download Photo List",
      run: () =>
        downloadSimpleSheet(
          `${filePrefix}_Photo_List.xlsx`,
          "Photo List",
          [...headers, "Register ID", "Photo"],
          workers.map((w) => [...base(w), register?.name ?? registerName, null]),
          audit("Photo list"),
        ),
    },
  ];
}

const WORKER_COLUMNS = [
  { label: "Worker Name", width: "w-[196px]" },
  { label: "Role", width: "w-[180px]" },
  { label: "Team Code", width: "w-[180px]" },
  { label: "Status", width: "w-[180px]" },
  { label: "Days Worked", width: "w-[180px]" },
  { label: "Performance (Registrations / Interventions)", width: "min-w-[364px]" },
];

export default function ViewRegister() {
  const { registerId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const origin = ORIGINS[params.get("from")] ?? ORIGINS.manage;
  const store = useAttendanceStore();
  const register = useMemo(() => getRegisters(store).find((r) => r.id === registerId), [store, registerId]);
  const workers = useMemo(() => registerWorkers(registerId, store.users), [registerId, store.users]);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(workers.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = workers.slice(current * pageSize, (current + 1) * pageSize);
  const from = workers.length ? current * pageSize + 1 : 0;
  const to = Math.min((current + 1) * pageSize, workers.length);

  const totalPerformance = workers.reduce((sum, w) => sum + w.performance, 0);
  const target = workers.filter((w) => w.status === "Active").length * ATTENDANCE_DAYS.length * TARGET_PER_DAY || 1;
  const targetPct = Math.min(100, Math.round((totalPerformance / target) * 100));
  const registerName = register?.name ?? `ID-${registerId}`;
  const downloads = downloadOptions(register, registerName, workers);

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-32 pt-6">
        <div className="flex w-full flex-col gap-6">
          <Breadcrumb
            items={[
              { label: "Home", to: "/" },
              { label: "Attendance Setup & Management", to: "/attendance" },
              { label: origin.label, to: origin.to },
              { label: "View Register" },
            ]}
          />
          <h1 className="font-condensed text-[40px] font-bold leading-[1.14] text-heading">View Register</h1>

          <div className="grid gap-6 rounded-xl bg-card px-6 py-6 text-center text-muted-foreground shadow-[0px_2px_3.5px_rgba(0,0,0,0.15)] sm:grid-cols-3 lg:px-[100px]">
            {[
              { value: totalPerformance.toLocaleString("en-US"), label: "Registrations/\nInterventions Completed" },
              { value: `${targetPct}%`, label: "Target Achieved" },
              { value: "1 Day", label: "with Unmarked\nAttendance" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <div className="text-2xl font-bold leading-[1.14]">{stat.value}</div>
                <div className="whitespace-pre-line text-base leading-[1.37]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-card p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] font-bold leading-[1.14] text-heading">{CAMPAIGN.name}</h2>
              <p className="text-xl font-medium leading-[1.14] text-[#787878]">{CAMPAIGN.dates}</p>
            </div>

            <div className="rounded-lg border border-[#d6d5d4] bg-info-bg">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                aria-expanded={detailsOpen}
                className="flex w-full items-start justify-between gap-4 p-6 text-left"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-2xl font-bold leading-[1.14] text-heading">Register Details</span>
                  <span className="text-base leading-6 text-muted-foreground">View register ID, officer, contact details, status, and timeline</span>
                </span>
                <MIcon path={PATHS.forwardIos} fill="#787878" className={`transition-transform ${detailsOpen ? "rotate-90" : ""}`} />
              </button>
              {detailsOpen && (
                <dl className="flex flex-col gap-4 border-t border-[#d6d5d4] p-6">
                  <DetailRow label="Register ID" value={registerName} />
                  <DetailRow label="Attendance Officer" value={register?.officer || "—"} />
                  <DetailRow label="Contact Details" value="+234 803 555 0142" />
                  <DetailRow label="Status" value={<StatusPill status="Active" />} />
                  <DetailRow label="Boundary" value={register?.boundaryName || register?.boundary || "—"} />
                  <DetailRow label="Attendance Frequency" value={register?.frequency ?? "Once"} />
                  <DetailRow label="Timeline" value="Created 18 August 2025 · Attendance 21 August 2025 - 25 August 2025" />
                </dl>
              )}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#d6d5d4] bg-info-bg p-6">
              <div className="flex flex-col gap-4">
                <h3 className="flex h-[34px] items-center text-2xl font-bold leading-[1.14] text-heading">Attendance Details</h3>
                <dl className="flex flex-col gap-4">
                  <DetailRow label="Attendance Duration" value="21 August 2025 - 25 August 2025" />
                  <DetailRow label="Original Duration (in days)" value={`${ATTENDANCE_DAYS.length} Days`} />
                  <DetailRow label="Days without Attendance Marked" value="1 Day" />
                </dl>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-[172px] items-center justify-center gap-2 rounded-md border border-primary bg-white px-5 text-base font-medium leading-[1.14] text-primary transition-colors hover:bg-primary/5 data-[state=open]:bg-primary/5">
                    Download <MIcon path={PATHS.dropDown} fill="#C84C0E" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[248px] overflow-hidden rounded-xl border-0 bg-white p-0 shadow-[0px_4px_6px_rgba(0,0,0,0.2)]">
                    {downloads.map((d) => (
                      <DropdownMenuItem
                        key={d.label}
                        onSelect={() => void d.run()}
                        className="cursor-pointer rounded-none px-2.5 py-4 text-base leading-6 text-[#0b0c0c] focus:bg-[#eee]"
                      >
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <h2 className="text-[28px] font-bold leading-[1.14] text-heading">Worker Attendance & Performance Register</h2>
              {workers.length > 0 && (
                <button className="flex h-8 items-center justify-center gap-2 rounded-md border border-primary bg-white px-6 text-base font-medium leading-[1.14] text-primary transition-colors hover:bg-primary/5">
                  <MIcon path={PATHS.edit} fill="#C84C0E" /> Edit Attendance
                </button>
              )}
            </div>

            {workers.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-[#c5c5c5] bg-card px-6 py-10 text-center">
                <img
                  src={emptyIllustration}
                  alt="Illustration of two workers carrying an attendance register"
                  className="h-44 w-auto object-contain"
                  loading="lazy"
                  width={1376}
                  height={768}
                />
                <h3 className="mt-4 text-2xl font-bold leading-[1.14] text-heading">No users are mapped</h3>
                <p className="mt-2 max-w-md text-base leading-[1.37] text-muted-foreground">Map users to this register to see their attendance and performance here.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#c5c5c5] bg-info-bg">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#d6d5d4] bg-[#eee]">
                        {WORKER_COLUMNS.map((c) => (
                          <th key={c.label} className={`py-4 pl-4 align-top ${c.width}`}>
                            <span className="flex justify-between gap-4 whitespace-nowrap pr-0 text-base font-bold leading-[1.14] text-heading">
                              {c.label}
                              <span className="w-px shrink-0 self-stretch bg-[#787878]" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((w) => (
                        <tr key={w.id} className="h-[74px] align-top">
                          <td className="p-4 text-base leading-[1.37] text-primary underline">{w.name}</td>
                          <td className="p-4 text-base leading-[1.37] text-foreground">{w.role}</td>
                          <td className="p-4 text-base leading-[1.37] text-foreground">{w.teamCode}</td>
                          <td className="p-4">
                            <StatusPill status={w.status} />
                          </td>
                          <td className="p-4 text-base leading-[1.37] tabular-nums text-foreground">{daysWorked(w)}</td>
                          <td className="p-4 text-base leading-[1.37] tabular-nums text-foreground">{w.performance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex h-[49px] items-center justify-end gap-[3px] border-t border-[#c5c5c5] px-6 text-base leading-6 text-muted-foreground">
                  <label className="flex items-center gap-2 p-2.5">
                    <span>Rows</span>
                    <span className="relative flex items-center">
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(0);
                        }}
                        aria-label="Rows per page"
                        className="cursor-pointer appearance-none bg-transparent pr-6"
                      >
                        {PAGE_SIZES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <MIcon path={PATHS.dropDown} fill="#505A5F" className="pointer-events-none absolute right-0" />
                    </span>
                  </label>
                  <span className="p-2.5">
                    {from} - {to} of {workers.length}
                  </span>
                  <div className="flex items-center gap-4">
                    {[
                      { path: PATHS.firstPage, label: "First page", to: 0, off: current === 0 },
                      { path: PATHS.chevronLeft, label: "Previous page", to: current - 1, off: current === 0 },
                      { path: PATHS.chevronRight, label: "Next page", to: current + 1, off: current >= pageCount - 1 },
                      { path: PATHS.lastPage, label: "Last page", to: pageCount - 1, off: current >= pageCount - 1 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        aria-label={btn.label}
                        disabled={btn.off}
                        onClick={() => setPage(btn.to)}
                        className="rounded-sm transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MIcon path={btn.path} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-11 right-0 z-30 flex h-[72px] items-center rounded-t-xl bg-card px-8 shadow-[0px_-1px_1px_rgba(0,0,0,0.16)]">
        <div className="flex w-full items-center justify-between gap-4">
          <Link
            to={origin.to}
            className="flex h-10 w-[237px] items-center justify-center gap-2 rounded-md border border-primary bg-white px-6 text-xl font-medium leading-[1.14] text-primary transition-colors hover:bg-primary/5"
          >
            <MIcon path={PATHS.arrowBack} fill="#C84C0E" /> Back
          </Link>
          <button
            onClick={() => {
              navigate(`/attendance/map-template?register=${registerId}`);
            }}
            className="flex h-10 w-[271px] items-center justify-center gap-2 rounded-md bg-primary px-6 text-xl font-medium leading-[1.14] text-primary-foreground transition-colors hover:brightness-95"
          >
            <MIcon path={PATHS.checkCircle} fill="white" /> Map Users
          </button>
        </div>
      </footer>
    </AppShell>
  );
}

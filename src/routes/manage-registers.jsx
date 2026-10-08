import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Plus, Search, Trash2, TriangleAlert, Users } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/app-shell";
import { Checkbox } from "@/components/flow-controls";
import { hasBoundaryLevel } from "@/components/filters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { attendanceActions, getRegisters, TOTAL_CAMPAIGN_USERS, useAttendanceStore } from "@/lib/attendance-store";
import { downloadRegisters } from "@/lib/templates";

const PAGE_SIZES = [10, 20, 50];
const NO_FILTERS = { query: "", level: "", frequency: "", officer: "", status: "" };

const STATUS_OPTIONS = [
  { value: "mapped", label: "Users mapped" },
  { value: "unmapped", label: "No users mapped" },
];

const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;
const frequencyLabel = (f) => (f === "Once" || f === "Twice" ? `${f} a day` : f);
/** Boundary levels used by any register, in first-seen order. */
const boundaryLevels = (registers) => [...new Set(registers.flatMap((r) => r.boundary.split(",").map((b) => b.trim()).filter(Boolean)))];

const outlineButton =
  "flex items-center gap-2 whitespace-nowrap rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5";
const primaryButton =
  "flex items-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95";
// Unfilled, muted look for bulk actions while nothing is selected.
const disabledButton =
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-white disabled:text-muted-foreground disabled:hover:bg-white";
const fieldClass =
  "w-full rounded-lg border border-input bg-card py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function SelectFilter({ label, value, onChange, options, allLabel }) {
  const id = useId();
  return (
    <div className="w-48">
      <label htmlFor={id} className="block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative mt-1">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} appearance-none pl-3 pr-9`}>
          <option value="">{allLabel}</option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="flex items-baseline gap-2 px-5 py-2.5">
      <span className={`text-xl font-bold tabular-nums ${tone === "warn" ? "text-amber-700" : "text-heading"}`}>{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default function ManageRegisters() {
  const store = useAttendanceStore();
  const registers = useMemo(() => getRegisters(store), [store]);

  // Filters are edited as a draft and applied with Search (or Enter in the search box).
  const [draft, setDraft] = useState(NO_FILTERS);
  const [applied, setApplied] = useState(NO_FILTERS);
  const setField = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtersActive = Object.values(applied).some((v) => v.trim());
  // Clear and Search only do something once a filter has been entered (or one is still applied).
  const canFilter = filtersActive || Object.values(draft).some((v) => v.trim());
  const search = () => setApplied({ ...draft, query: draft.query.trim() });
  const clearFilters = () => {
    setDraft(NO_FILTERS);
    setApplied(NO_FILTERS);
  };

  const visible = useMemo(() => {
    const { query, level, frequency, officer, status } = applied;
    const q = query.toLowerCase();
    return registers.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q)) &&
        (!level || hasBoundaryLevel(r, level)) &&
        (!frequency || r.frequency === frequency) &&
        (!officer || r.officer === officer) &&
        (!status || (status === "unmapped" ? r.users === 0 : r.users > 0)),
    );
  }, [registers, applied]);

  useEffect(() => setPage(0), [applied]);

  // Forget selections for registers that no longer exist (e.g. after delete).
  useEffect(() => {
    const ids = new Set(registers.map((r) => r.id));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [registers]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(current * pageSize, (current + 1) * pageSize);
  const pageSelected = pageRows.filter((r) => selected.has(r.id)).length;
  const allPageSelected = pageRows.length > 0 && pageSelected === pageRows.length;
  const selectedRegisters = registers.filter((r) => selected.has(r.id));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => (allPageSelected ? next.delete(r.id) : next.add(r.id)));
      return next;
    });

  const totalUsers = registers.reduce((n, r) => n + r.users, 0);
  const withoutUsers = registers.filter((r) => r.users === 0).length;
  const usersLeft = Math.max(0, TOTAL_CAMPAIGN_USERS - totalUsers);

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-12 pt-4">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Manage Registers" }]} />

        <div className="mt-3 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="font-condensed text-3xl font-bold text-heading">Manage Registers</h1>
            <p className="mt-1 text-sm text-muted-foreground">All the attendance registers you've generated for this campaign are here. Find a register, open it to see its users and attendance, or download and delete registers.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/attendance/map-template" className={outlineButton}>
              <Users className="size-4" /> Map Users to Registers
            </Link>
            <Link to="/attendance/customize" className={primaryButton}>
              <Plus className="size-4" /> Create New Register
            </Link>
          </div>
        </div>

        <div className="mt-4 inline-flex flex-wrap divide-x divide-border rounded-lg border border-border bg-card">
          <Stat label="Total Registers" value={registers.length} />
          <Stat label="Users mapped" value={totalUsers} />
          <Stat label="Registers without users" value={withoutUsers} tone={withoutUsers ? "warn" : undefined} />
          <Stat label="Users left to be mapped" value={usersLeft} tone={usersLeft ? "warn" : undefined} />
        </div>

        <form
          role="search"
          aria-label="Filter registers"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card px-5 py-4"
        >
          <div className="w-64">
            <label htmlFor="register-search" className="block text-xs font-medium text-foreground">
              Register ID
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                id="register-search"
                type="search"
                value={draft.query}
                onChange={(e) => setField("query")(e.target.value)}
                placeholder="Search registers"
                className={`${fieldClass} pl-9 pr-3`}
              />
            </div>
          </div>
          <SelectFilter label="Boundary level" value={draft.level} onChange={setField("level")} options={boundaryLevels(registers)} allLabel="All levels" />
          <SelectFilter
            label="Attendance frequency"
            value={draft.frequency}
            onChange={setField("frequency")}
            options={[...new Set(registers.map((r) => r.frequency))].map((f) => ({ value: f, label: frequencyLabel(f) }))}
            allLabel="All frequencies"
          />
          <SelectFilter
            label="Attendance officer"
            value={draft.officer}
            onChange={setField("officer")}
            options={[...new Set(registers.map((r) => r.officer).filter(Boolean))]}
            allLabel="All officers"
          />
          <SelectFilter label="User mapping status" value={draft.status} onChange={setField("status")} options={STATUS_OPTIONS} allLabel="All statuses" />
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!canFilter}
              className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!canFilter}
              className={`${primaryButton} disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground disabled:hover:brightness-100`}
            >
              <Search className="size-4" /> Search
            </button>
          </div>
        </form>

        <section className="mt-4 rounded-lg border border-border bg-card" aria-label="Registers">
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-4 py-2">
            {selected.size > 0 ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-heading">{plural(selected.size, "register")} selected</span>
                <button onClick={() => setSelected(new Set())} className="font-medium text-primary hover:underline">
                  Clear selection
                </button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {filtersActive ? `Showing ${visible.length} of ${plural(registers.length, "register")}` : plural(registers.length, "register")}
              </span>
            )}
            {/* Always visible; enabled once at least one register is selected. */}
            <div className="flex flex-wrap items-center gap-2">
              {selected.size > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`${outlineButton} data-[state=open]:bg-primary/5`}>
                    <Download className="size-4" /> Download <ChevronDown className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-64 bg-white p-0">
                    <DropdownMenuItem
                      onSelect={() => void downloadRegisters(selectedRegisters, "single")}
                      className="cursor-pointer flex-col items-start gap-0.5 rounded-none px-3 py-2.5 focus:bg-muted"
                    >
                      <span className="text-sm text-foreground">Download as a single Excel sheet</span>
                      <span className="text-xs text-muted-foreground">All {selected.size} registers in one sheet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void downloadRegisters(selectedRegisters, "individual")}
                      className="cursor-pointer flex-col items-start gap-0.5 rounded-none border-t border-border px-3 py-2.5 focus:bg-muted"
                    >
                      <span className="text-sm text-foreground">Download as individual registers</span>
                      <span className="text-xs text-muted-foreground">One Excel file per register, in a .zip</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  disabled={selected.size === 0}
                  onClick={() => void downloadRegisters(selectedRegisters, "single")}
                  className={`${outlineButton} ${disabledButton}`}
                >
                  <Download className="size-4" /> Download
                </button>
              )}
              <button
                disabled={selected.size === 0}
                onClick={() => setConfirmOpen(true)}
                className={`${outlineButton} ${disabledButton}`}
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-y border-border bg-muted text-xs font-bold text-heading">
                  <th className="w-12 px-4 py-3">
                    <button
                      role="checkbox"
                      aria-checked={allPageSelected ? "true" : pageSelected > 0 ? "mixed" : "false"}
                      aria-label="Select all registers on this page"
                      disabled={pageRows.length === 0}
                      onClick={togglePage}
                      className="align-middle disabled:opacity-40"
                    >
                      <Checkbox checked={allPageSelected} indeterminate={pageSelected > 0 && !allPageSelected} />
                    </button>
                  </th>
                  <th className="min-w-[200px] px-4 py-3">Register ID</th>
                  <th className="w-[180px] px-4 py-3">Boundary level</th>
                  <th className="px-4 py-3 text-right">Total users</th>
                  <th className="px-4 py-3 text-right">Active users</th>
                  <th className="px-4 py-3">Attendance frequency</th>
                  <th className="px-4 py-3">Attendance officer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">No registers match your filters.</p>
                      <button onClick={clearFilters} className="mt-2 text-sm font-medium text-primary hover:underline">
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
                {pageRows.map((r) => {
                  const checked = selected.has(r.id);
                  return (
                    <tr key={r.id} className={`border-b border-border transition-colors last:border-0 ${checked ? "bg-selected-bg" : "hover:bg-muted/40"}`}>
                      <td className="px-4 py-3">
                        <button role="checkbox" aria-checked={checked} aria-label={`Select ${r.name}`} onClick={() => toggle(r.id)} className="align-middle">
                          <Checkbox checked={checked} />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                        <Link to={`/attendance/registers/${r.id}?from=manage`} className="text-primary underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="max-w-[180px] whitespace-normal break-words px-4 py-3 text-sm text-foreground">{r.boundary}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{r.users}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{r.active}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{frequencyLabel(r.frequency)}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.officer || <span className="text-muted-foreground">Not assigned</span>}</td>
                      <td className="px-4 py-3">
                        {/* A register is active while it has active users to mark attendance for. */}
                        {r.active > 0 ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Active</span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Inactive</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              Rows per page
              <span className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="appearance-none rounded-md border border-input bg-card py-1 pl-2 pr-7 text-sm text-foreground outline-none focus:border-primary"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 size-4" />
              </span>
            </label>
            <span className="tabular-nums" aria-live="polite">
              {visible.length ? `${current * pageSize + 1}–${Math.min((current + 1) * pageSize, visible.length)}` : "0"} of {visible.length}
            </span>
            <div className="flex items-center gap-1">
              {[
                { icon: ChevronsLeft, label: "First page", to: 0, off: current === 0 },
                { icon: ChevronLeft, label: "Previous page", to: current - 1, off: current === 0 },
                { icon: ChevronRight, label: "Next page", to: current + 1, off: current >= pageCount - 1 },
                { icon: ChevronsRight, label: "Last page", to: pageCount - 1, off: current >= pageCount - 1 },
              ].map(({ icon: Icon, label, to, off }) => (
                <button
                  key={label}
                  aria-label={label}
                  disabled={off}
                  onClick={() => setPage(to)}
                  className="rounded-md p-1.5 text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md bg-white">
          <AlertDialogHeader className="items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
              <TriangleAlert className="size-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-heading">Are you sure you want to delete these registers?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground">
              You've selected {plural(selected.size, "register")}. Once deleted, they cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="w-full rounded-md border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                attendanceActions.deleteRegisters([...selected]);
                setSelected(new Set());
                setConfirmOpen(false);
              }}
              className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-95"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

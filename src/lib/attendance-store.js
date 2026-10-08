// Prototype data store, persisted to localStorage so the flow survives reloads.
import { useSyncExternalStore } from "react";

export const SEED_REGISTERS = [
  { id: "r-1", createdAt: "2025-08-18T11:32:00+05:30", name: "BILL 16273673", users: 0, boundary: "State, LGA, Ward, Settlement", frequency: "Once", officer: "Anita Sharma" },
  { id: "r-2", createdAt: "2025-08-18T11:33:00+05:30", name: "BILL 16273674", users: 0, boundary: "State, LGA, Ward", frequency: "Twice", officer: "Rahul Verma" },
  { id: "r-3", createdAt: "2025-08-18T11:34:00+05:30", name: "BILL 16273675", users: 0, boundary: "State, LGA", frequency: "Once", officer: "Anita Sharma" },
  { id: "r-4", createdAt: "2025-08-18T11:35:00+05:30", name: "BILL 16273676", users: 12, active: 10, enrollmentSet: true, boundary: "State, LGA, Ward", frequency: "Twice", officer: "Meera Iyer" },
  { id: "r-5", createdAt: "2025-08-18T11:36:00+05:30", name: "BILL 16273677", users: 43, active: 40, enrollmentSet: true, boundary: "State, LGA, Ward, Settlement", frequency: "Once", officer: "Rahul Verma" },
];

/** Users available to this campaign; anyone not yet on a register is still left to be mapped. */
export const TOTAL_CAMPAIGN_USERS = 120;

const CURRENT_USER ={ name: "Aisha Bello", role: "Campaign Supervisor" };
const STORAGE_KEY = "attendancePrototypeData";

const EMPTY = {
  uploadedRegisters: [],
  deletedIds: [],
  users: [],
  latestIds: [],
  mappingIds: [],
  mappingOptions: null,
  templateLevels: [],
  templateFrequency: null,
  auditLog: [],
};

let state = EMPTY;
let hydrated = false;
const listeners = new Set();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = backfillCreatedAt({ ...EMPTY, ...JSON.parse(saved) });
  } catch {
    // ignore corrupt storage
  }
}

/**
 * Registers uploaded before creation dates were recorded get one from their
 * "Register Generated" audit entry (or now), and it is saved so it stays stable.
 */
function backfillCreatedAt(s) {
  if (s.uploadedRegisters.every((r) => r.createdAt)) return s;
  const now = new Date().toISOString();
  const generatedAt = (name) => s.auditLog.findLast?.((e) => e.action === "Register Generated" && e.register === name)?.at;
  const next = { ...s, uploadedRegisters: s.uploadedRegisters.map((r) => (r.createdAt ? r : { ...r, createdAt: generatedAt(r.name) ?? now })) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

function setState(patch) {
  hydrate();
  state = { ...state, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  hydrate();
  return state;
}

export function useAttendanceStore() {
  return useSyncExternalStore(subscribe, getState, () => EMPTY);
}

/** All live registers (uploaded + seed, minus deleted), with mapped and active user counts added. */
export function getRegisters(s) {
  const deleted = new Set(s.deletedIds);
  return [...s.uploadedRegisters, ...SEED_REGISTERS]
    .filter((r) => !deleted.has(r.id))
    .map((r) => {
      const mapped = s.users.filter((u) => u.registerId === r.id);
      return {
        ...r,
        users: r.users + mapped.length,
        active: (r.active ?? r.users) + mapped.filter((u) => u.status === "Active").length,
      };
    });
}

let auditSeq = 0;

export const attendanceActions = {
  log(entries) {
    if (!entries.length) return;
    const at = new Date().toISOString();
    const rows = entries.map((e) => ({
      id: `al-${Date.now().toString(36)}-${auditSeq++}`,
      action: e.action,
      register: e.register ?? "",
      details: e.details,
      user: CURRENT_USER.name,
      role: CURRENT_USER.role,
      at,
    }));
    setState({ auditLog: [...rows, ...getState().auditLog] });
  },

  /** Boundary levels and attendance frequency chosen for the register template. */
  setRegisterTemplateOptions({ levels, frequency }) {
    setState({ templateLevels: levels, templateFrequency: frequency });
  },

  /** Upserts registers by name. Returns [{ id, created }] in input order. */
  addRegisters(incoming) {
    const s = getState();
    const existing = getRegisters(s);
    const uploaded = [...s.uploadedRegisters];
    const created = [];
    const resultIds = [];
    const createdIds = new Set();
    let nextId = Math.max(0, ...[...uploaded, ...SEED_REGISTERS].map((r) => Number(r.id.slice(2)) || 0)) + 1;

    for (const reg of incoming) {
      const dup = created.find((r) => r.name === reg.name);
      if (dup) {
        Object.assign(dup, reg);
        continue;
      }
      const match = existing.find((r) => r.name === reg.name);
      if (match && uploaded.some((r) => r.id === match.id)) {
        const i = uploaded.findIndex((r) => r.id === match.id);
        uploaded[i] = { ...uploaded[i], ...reg };
        resultIds.push(match.id);
      } else if (match) {
        resultIds.push(match.id);
      } else {
        const id = `r-${nextId++}`;
        created.push({ ...reg, id, users: 0, createdAt: new Date().toISOString() });
        resultIds.push(id);
        createdIds.add(id);
      }
    }

    setState({ uploadedRegisters: [...created, ...uploaded], latestIds: resultIds });
    return resultIds.map((id) => ({ id, created: createdIds.has(id) }));
  },

  deleteRegisters(ids) {
    const s = getState();
    const idSet = new Set(ids);
    const removed = getRegisters(s).filter((r) => idSet.has(r.id));
    const seedIds = new Set(SEED_REGISTERS.map((r) => r.id));
    setState({
      uploadedRegisters: s.uploadedRegisters.filter((r) => !idSet.has(r.id)),
      deletedIds: [...s.deletedIds, ...ids.filter((id) => seedIds.has(id))],
      users: s.users.filter((u) => !idSet.has(u.registerId)),
    });
    attendanceActions.log(
      removed.map((r) => ({
        action: "Register Deleted",
        register: r.name,
        details: `Register deleted from Manage Registers${r.users ? ` with ${r.users} mapped ${r.users === 1 ? "user" : "users"}` : ""}`,
      })),
    );
  },

  setMappingRegisters(ids) {
    setState({ mappingIds: ids });
  },

  /** Enrollment date choice from the user mapping template stepper. */
  setMappingOptions(options) {
    setState({ mappingOptions: options });
  },

  /** Adds users, replacing any existing user with the same register + worker ID. */
  addUsers(incoming) {
    const s = getState();
    const key = (u) => `${u.registerId}|${u.workerId}`;
    const incomingKeys = new Set(incoming.map(key));
    const kept = s.users.filter((u) => !incomingKeys.has(key(u)));
    const added = incoming.map((u, i) => ({ ...u, id: `u-${Date.now().toString(36)}-${i}` }));
    setState({ users: [...kept, ...added] });
  },
};

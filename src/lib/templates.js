// Excel template generation, parsing and downloads for the attendance flow.
import { attendanceActions, getRegisters, getState } from "./attendance-store";

const BOUNDARY_COLUMNS = [
  { code: "NIGERIA_COUNTRY", label: "Country", width: 50 },
  { code: "NIGERIA_PROVINCE", label: "Province", width: 25 },
  { code: "NIGERIA_DISTRICT", label: "District", width: 25 },
  { code: "NIGERIA_ADMINISTRATIVEPOST", label: "Administrative Post", width: 25 },
  { code: "NIGERIA_LOCALITY", label: "Locality", width: 30 },
  { code: "NIGERIA_VILLAGE", label: "Village", width: 25 },
];

const BOUNDARY_CODE = "HCM_ADMIN_CONSOLE_BOUNDARY_CODE";
const REGISTER_ID = "HCM_ATTENDANCE_REGISTER_ID";
const REGISTER_SESSIONS = "HCM_ATTENDANCE_REGISTER_SESSIONS";
const ROW_ID = "HCM_ADMIN_CONSOLE____ROW_ID";

const REGISTER_COLUMNS = [
  ...BOUNDARY_COLUMNS,
  { code: BOUNDARY_CODE, label: "Service Boundary Code", width: 30, hidden: true },
  { code: REGISTER_ID, label: "Register ID", width: 40 },
  { code: REGISTER_SESSIONS, label: "Sessions", width: 20 },
];

const BOUNDARY_DATA_COLUMNS = [
  ...BOUNDARY_COLUMNS,
  { code: BOUNDARY_CODE, label: "Service Boundary Code", width: 80, hidden: true },
  { code: ROW_ID, label: "", width: 8, hidden: true },
];

const USER = {
  workerId: "HCM_ADMIN_CONSOLE_USER_WORKER_ID",
  name: "HCM_ADMIN_CONSOLE_USER_NAME",
  username: "UserName",
  roles: [1, 2, 3, 4, 5].map((n) => `HCM_ADMIN_CONSOLE_USER_ROLE_MULTISELECT_${n}`),
  boundary: "HCM_ADMIN_CONSOLE_BOUNDARY_NAME",
  boundaryCode: "HCM_ADMIN_CONSOLE_BOUNDARY_CODE_MANDATORY",
  enrollment: "HCM_ATTENDANCE_ATTENDEE_ENROLLMENT_DATE",
  deenrollment: "HCM_ATTENDANCE_ATTENDEE_DEENROLLMENT_DATE",
  teamCode: "HCM_ATTENDANCE_ATTENDEE_TEAM_CODE",
};

const userColumns = (withTeamCode) => [
  { code: USER.workerId, label: "User ID", width: 30 },
  { code: USER.name, label: "Name", width: 25 },
  { code: USER.username, label: "Username", width: 20 },
  ...USER.roles.map((code, i) => ({ code, label: `User Role ${i + 1}`, width: i === 0 ? 50 : 20 })),
  { code: USER.boundary, label: "Boundary", width: 25 },
  { code: USER.boundaryCode, label: "Boundary Code", width: 64, hidden: true },
  { code: REGISTER_ID, label: "Register ID", width: 64 },
  { code: USER.enrollment, label: "Enrollment Date", width: 20 },
  { code: USER.deenrollment, label: "De-enrollment Date", width: 20 },
  ...(withTeamCode ? [{ code: USER.teamCode, label: "Team Code", width: 15 }] : []),
  { code: ROW_ID, label: "", width: 8, hidden: true },
];

const USER_SHEETS = [
  { name: "Frontline Workers", teamCode: true, perRegister: 3, roles: ["DISTRIBUTOR", "FIELD_SUPPORT"] },
  { name: "Attendance Markers", teamCode: false, perRegister: 1, roles: ["WAREHOUSE_MANAGER", "TEAM_SUPERVISOR"] },
  { name: "Attendance Approvers", teamCode: false, perRegister: 1, roles: ["CAMPAIGN_SUPERVISOR"] },
];

const ROLE_OPTIONS = [
  "DISTRIBUTOR", "HEALTH_FACILITY_WORKER", "WAREHOUSE_MANAGER", "NATIONAL_SUPERVISOR",
  "DISTRICT_SUPERVISOR", "TEAM_SUPERVISOR", "PROVINCIAL_SUPERVISOR", "DASHBOARD_VIEWER",
  "PROXIMITY_SUPERVISOR", "CAMPAIGN_SUPERVISOR", "PAYMENT_EDITOR", "PAYMENT_REVIEWER",
  "PAYMENT_APPROVER", "FIELD_SUPPORT",
];

function registerInstructions({ levels, frequency, sessions }) {
  const chosen = [
    levels.length ? `Boundary levels: ${levels.join(", ")}` : null,
    frequency ? `Attendance: ${frequency} (Sessions = ${sessions})` : null,
  ].filter(Boolean);
  return [
    "Instructions for filling the Attendance Register template:",
    ...(chosen.length ? ["", "Your selections:", ...chosen.map((c) => `• ${c}`)] : []),
    "",
    "1. Fill at least one boundary column for each row",
    "2. Each register gets a new Register ID (BILL followed by 8 digits). You can edit it if needed.",
    "3. Ensure all Register IDs are unique",
    `4. Sessions is pre-filled with ${sessions} for every register. Change it per row if a register needs a different number.`,
    "5. Upload the completed file back to the system",
    "",
    "Note: Projects must be created before generating attendance registers.",
  ].join("\n");
}

const SAMPLE_BOUNDARY_PATH = ["Nigeria", "Plateau", "Kanam", "Dengi", "pl Dengi Primary Health Centre"];

const SAMPLE_VILLAGES = [
  { village: "ANGWAN GARKUWA", code: "NIGERIA_NI_09_14_18_01_64_ANGWAN_GARKUWA" },
  { village: "MAKABARTA A com 01", code: "NIGERIA_NI_09_14_18_01_63_MAKABARTA_A_COM_01" },
  { village: "GENERAL HOSPITAL AREA", code: "NIGERIA_NI_09_14_18_01_62_GENERAL_HOSPITAL_AREA" },
];

const SAMPLE_NAMES = [
  "Dwight", "Oscar", "Kevin", "Pam", "Michael", "Jim", "Angela", "Stanley", "Phyllis", "Andy",
  "Erin", "Toby", "Kelly", "Ryan", "Creed", "Meredith", "Darryl", "Holly", "Gabe", "Nellie",
];

const SAMPLE_ENROLLMENT_DATE = new Date(Date.UTC(2026, 7, 28));
const VALIDATION_LAST_ROW = 5002;

/** Excel column letter for a zero-based index (A, B, C…). */
export const columnLetter = (index) => String.fromCharCode(65 + index);

export const cellValue = (cell) => (typeof cell === "object" && cell && !(cell instanceof Date) && "value" in cell ? cell.value : cell);

/** Display text for a template cell; dates as dd/mm/yyyy. */
export function formatCell(cell) {
  const v = cellValue(cell);
  if (v == null) return "";
  if (v instanceof Date) {
    return `${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}/${v.getUTCFullYear()}`;
  }
  return String(v);
}

function toSheet(def) {
  const bold = (value) => (value ? { value, fontWeight: "bold" } : null);
  return {
    sheet: def.name,
    data: [
      def.columns.map((c) => bold(c.code)),
      def.columns.map((c) => (c.wrap ? { value: c.label, wrap: true, height: 170 } : bold(c.label))),
      ...def.rows,
    ],
    columns: def.columns.map((c) => ({ width: c.width ?? 20 })),
    stickyRowsCount: 2,
  };
}

/** Post-processes the xlsx XML: hides the code row, hidden columns, and adds dropdown validations. */
async function patchWorkbook(blob, sheets) {
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import("fflate");
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  sheets.forEach((def, i) => {
    const path = `xl/worksheets/sheet${i + 1}.xml`;
    const file = files[path];
    if (!file) return;
    let xml = strFromU8(file).replace('<row r="1">', '<row r="1" hidden="1">');
    def.columns.forEach((c, ci) => {
      if (c.hidden) {
        xml = xml.replace(`<col min="${ci + 1}" max="${ci + 1}" `, `<col min="${ci + 1}" max="${ci + 1}" hidden="1" `);
      }
    });
    if (def.lists?.length) {
      const validations = def.lists
        .map(({ columns, options }) => {
          const sqref = columns
            .map((code) => columnLetter(def.columns.findIndex((c) => c.code === code)))
            .map((col) => `${col}3:${col}${VALIDATION_LAST_ROW}`)
            .join(" ");
          return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${sqref}"><formula1>"${options.join(",")}"</formula1></dataValidation>`;
        })
        .join("");
      xml = xml.replace("</sheetData>", `</sheetData><dataValidations count="${def.lists.length}">${validations}</dataValidations>`);
    }
    files[path] = strToU8(xml);
  });
  return new Blob([zipSync(files)], { type: blob.type });
}

/** Builds the .xlsx for a workbook definition. */
export async function workbookBlob({ sheets }) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  return patchWorkbook(await writeXlsxFile(sheets.map(toSheet)).toBlob(), sheets);
}

/** The generated workbook as a File, so it can be uploaded as-is. */
export async function workbookFile(def) {
  const blob = await workbookBlob(def);
  return new File([blob], def.fileName, { type: blob.type });
}

/** Builds and downloads a workbook definition ({ fileName, sheets, audit }). */
export async function downloadWorkbook(def) {
  saveBlob(await workbookBlob(def), def.fileName);
  if (def.audit) attendanceActions.log([def.audit]);
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Reads an uploaded template. For each sheet, finds the code header row containing all
 * `requiredCodes`, and returns row accessors: get(code) and label(code).
 */
async function readTemplate(file, requiredCodes) {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error("Please upload the .xlsx template downloaded from this page.");
  }
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  let workbook;
  try {
    workbook = await readXlsxFile(file);
  } catch {
    throw new Error("This file couldn't be read. Please upload the downloaded .xlsx template.");
  }
  const text = (v) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());
  const sheets = [];
  for (const { data } of workbook) {
    const headerIndex = data.findIndex((row) => requiredCodes.every((code) => row.some((cell) => text(cell) === code)));
    if (headerIndex < 0) continue;
    const codes = (data[headerIndex] ?? []).map(text);
    const labels = (data[headerIndex + 1] ?? []).map(text);
    const col = (code) => codes.indexOf(code);
    sheets.push(
      data
        .slice(headerIndex + 2)
        .filter((row) => row.some((cell) => text(cell)))
        .map((row) => ({
          get: (code) => (col(code) < 0 ? "" : text(row[col(code)])),
          label: (code) => labels[col(code)] ?? code,
        })),
    );
  }
  if (!sheets.length) throw new Error("This doesn't look like the template from this page. Please download it and try again.");
  if (!sheets.some((rows) => rows.length)) throw new Error("The template has no rows. Fill it in and upload it again.");
  return sheets;
}

const sessionsPerDay = (frequency) => (frequency === "Twice a day" ? 2 : 1);

/* ---------- Attendance register template ---------- */

// What each register column expects, keyed by its header label.
export const REGISTER_COLUMN_GUIDE = {
  "Register ID": {
    required: false,
    help: "Auto-filled from the boundary. Must be unique.",
  },
  Sessions: { required: false, help: "Attendance sessions per day (1 or 2). Pre-filled." },
};

export const REGISTER_COLUMN_GROUPS = [
  {
    pattern: /^(Country|Province|District|Administrative Post|Locality|Village)$/,
    label: "Boundary (Country → Village)",
    required: true,
    help: "From Country down to the register's level.",
  },
];


// Fresh Register IDs ("BILL 16273678", ...) following the highest one in use, so a generated
// template always creates new registers (with no users) instead of matching existing ones.
function nextRegisterIds(count) {
  const numbers = getRegisters(getState()).map((r) => Number(/^BILL (\d{8})$/.exec(r.name)?.[1]) || 0);
  const start = Math.max(16273672, ...numbers) + 1;
  return Array.from({ length: count }, (_, i) => `BILL ${start + i}`);
}

export function buildRegisterTemplate() {
  const { templateLevels, templateFrequency } = getState();
  const sessions = sessionsPerDay(templateFrequency);
  const registerIds = nextRegisterIds(SAMPLE_VILLAGES.length);
  return {
    fileName: "Attendance_Register_Template.xlsx",
    audit: {
      action: "Template Downloaded",
      details: `Attendance register template downloaded · ${SAMPLE_VILLAGES.length} registers · ${sessions} ${sessions === 1 ? "session" : "sessions"} a day`,
    },
    sheets: [
      {
        name: "Instructions",
        guide: true,
        columns: [{ code: "HCM_ATTENDANCE_REGISTER_README_INSTRUCTIONS", label: registerInstructions({ levels: templateLevels, frequency: templateFrequency, sessions }), width: 100, wrap: true }],
        rows: [],
      },
      {
        name: "Attendance Registers",
        columns: REGISTER_COLUMNS,
        rows: SAMPLE_VILLAGES.map((v, i) => [...SAMPLE_BOUNDARY_PATH, v.village, v.code, registerIds[i], sessions]),
        lists: [{ columns: ["NIGERIA_COUNTRY"], options: ["Nigeria"] }],
      },
      {
        name: "Boundary Data",
        reference: true,
        columns: BOUNDARY_DATA_COLUMNS,
        rows: SAMPLE_VILLAGES.map((v) => [...SAMPLE_BOUNDARY_PATH, v.village, v.code, crypto.randomUUID()]),
      },
    ],
  };
}

export const downloadRegisterTemplate = () => downloadWorkbook(buildRegisterTemplate());

async function parseRegisterTemplate(file) {
  const [rows = []] = await readTemplate(file, [REGISTER_ID, BOUNDARY_CODE]);
  const registers = [];
  for (const row of rows) {
    const filled = BOUNDARY_COLUMNS.filter((c) => row.get(c.code));
    const deepest = filled[filled.length - 1];
    const name = row.get(REGISTER_ID) || row.get(BOUNDARY_CODE) || (deepest ? row.get(deepest.code) : "");
    if (!name) continue;
    const sessions = Number(row.get(REGISTER_SESSIONS)) || 1;
    registers.push({
      name,
      boundary: filled.map((c) => row.label(c.code)).join(", "),
      boundaryName: deepest ? row.get(deepest.code) : "",
      boundaryCode: row.get(BOUNDARY_CODE),
      frequency: sessions === 1 ? "Once" : sessions === 2 ? "Twice" : `${sessions} sessions`,
      officer: "",
    });
  }
  if (!registers.length) throw new Error("Every row needs a boundary or a Register ID.");
  return registers;
}

/** Checks an uploaded register file without saving. Returns { created, updated } counts. */
export async function checkRegisterTemplate(file) {
  const names = [...new Set((await parseRegisterTemplate(file)).map((r) => r.name))];
  const existing = new Set(getRegisters(getState()).map((r) => r.name));
  const updated = names.filter((n) => existing.has(n)).length;
  return { created: names.length - updated, updated };
}

/** Parses an uploaded register template and adds/updates registers. */
export async function uploadRegisterTemplate(file) {
  const registers = await parseRegisterTemplate(file);
  const results = attendanceActions.addRegisters(registers);
  attendanceActions.log(
    results.map(({ created }, i) => {
      const r = registers[i];
      return created
        ? {
            action: "Register Generated",
            register: r.name,
            details: `Created from ${file.name} · Boundary: ${r.boundaryName || r.boundary} · Attendance ${r.frequency.toLowerCase()} a day`,
          }
        : { action: "Register Edited", register: r.name, details: `Updated from re-uploaded ${file.name}` };
    }),
  );
}

/* ---------- User mapping template ---------- */

// What each user mapping column expects, keyed by its header label.
export const USER_COLUMN_GUIDE = {
  "User ID": { required: false, help: "Worker ID. Used to update the user later." },
  Name: { required: true, help: "Full name of the user." },
  Username: { required: false, help: "Mobile app login." },
  Boundary: { required: true, help: "Where the user works. Pre-filled." },
  "Register ID": { required: true, help: "Must match one of your selected registers." },
  "Enrollment Date": { required: true, help: "Date the user joins (dd/mm/yyyy)." },
  "De-enrollment Date": { required: false, help: "Date the user leaves. Blank if none." },
  "Team Code": { required: false, help: "Optional. Users with the same code are in the same team." },
};

// Columns collapsed into a single guide row.
export const USER_COLUMN_GROUPS = [
  {
    pattern: /^User Role \d$/,
    label: "User Role 1–5",
    required: true,
    // Only the first role column is required; roles 2–5 are optional.
    requiredColumns: ["User Role 1"],
    help: "Pick from the list. Role 1 is a must.",
  },
];


/**
 * One entry per visible column of a sheet (grouped columns collapse into one), with its
 * Excel letter range, guidance, and an example taken from the first sample row.
 */
export function describeColumns(sheet, guide = USER_COLUMN_GUIDE, groups = USER_COLUMN_GROUPS) {
  const sample = sheet.rows[0] ?? [];
  const out = [];
  sheet.columns.forEach((col, index) => {
    if (col.hidden) return;
    const group = groups.find((g) => g.pattern.test(col.label));
    const existing = group && out.find((r) => r.key === group.label);
    if (existing) {
      existing.last = index;
      return;
    }
    const info = group ?? guide[col.label] ?? {};
    out.push({
      key: group ? group.label : col.code,
      label: group ? group.label : col.label,
      first: index,
      last: index,
      required: !!info.required,
      help: info.help ?? "",
      example: formatCell(sample[index] ?? null),
    });
  });
  return out.map((c) => ({ ...c, letters: c.first === c.last ? columnLetter(c.first) : `${columnLetter(c.first)}–${columnLetter(c.last)}` }));
}

function mappingRegisters() {
  const s = getState();
  const all = getRegisters(s);
  const selected = all.filter((r) => s.mappingIds.includes(r.id));
  return selected.length ? selected : all.slice(0, 2);
}

const SAME_DATE = "Same date for all users";
const dateCell = (iso) => ({ value: new Date(`${iso}T00:00:00Z`), type: Date, format: "dd/mm/yyyy" });

export function buildUserMappingTemplate() {
  const registers = mappingRegisters();
  // Dates chosen in the stepper; a different date per user leaves the column blank to fill in Excel.
  const options = getState().mappingOptions;
  const enrollmentCell = !options
    ? { value: SAMPLE_ENROLLMENT_DATE, type: Date, format: "dd/mm/yyyy" }
    : options.enrollment === SAME_DATE && options.enrollmentDate
      ? dateCell(options.enrollmentDate)
      : null;
  const deenrollmentCell = options?.deenrollment === SAME_DATE && options.deenrollmentDate ? dateCell(options.deenrollmentDate) : null;
  let n = 0;
  const dataSheets = USER_SHEETS.map((sheet) => {
    const rows = [];
    registers.forEach((reg, ri) => {
      for (let i = 0; i < sheet.perRegister; i++, n++) {
        const name = SAMPLE_NAMES[n % SAMPLE_NAMES.length] ?? "User";
        const sample = SAMPLE_VILLAGES[ri % SAMPLE_VILLAGES.length];
        rows.push([
          `WR-demo-${367900 + n}`,
          name,
          `${name}${Math.floor(n / SAMPLE_NAMES.length) + 1}`,
          sheet.roles[i % sheet.roles.length] ?? null,
          null,
          null,
          null,
          null,
          reg.boundaryName || sample.village,
          reg.boundaryCode || sample.code,
          reg.name,
          enrollmentCell,
          deenrollmentCell,
          ...(sheet.teamCode ? [(i % 3) + 1] : []),
          crypto.randomUUID(),
        ]);
      }
    });
    return {
      name: sheet.name,
      columns: userColumns(sheet.teamCode),
      rows,
      lists: [{ columns: USER.roles, options: ROLE_OPTIONS }],
    };
  });
  return {
    fileName: "Attendee_Template.xlsx",
    sheets: dataSheets,
    audit: {
      action: "Template Downloaded",
      details: `User mapping template downloaded for ${registers.map((r) => r.name).join(", ")}`,
    },
  };
}

export const downloadUserMappingTemplate = () => downloadWorkbook(buildUserMappingTemplate());

/** Users from an uploaded mapping file; rows without a name or a known Register ID are skipped. */
async function parseUserMappingTemplate(file) {
  const sheets = await readTemplate(file, [USER.workerId, REGISTER_ID]);
  const byName = new Map(getRegisters(getState()).map((r) => [r.name.toLowerCase(), r]));
  const users = [];
  let skipped = 0;
  for (const row of sheets.flat()) {
    const register = byName.get(row.get(REGISTER_ID).toLowerCase());
    const name = row.get(USER.name);
    if (!register || !name) {
      skipped++;
      continue;
    }
    users.push({
      registerId: register.id,
      name,
      workerId: row.get(USER.workerId) || name,
      role: USER.roles.map(row.get).filter(Boolean).join(", "),
      boundary: row.get(USER.boundary) || register.boundaryName || register.boundary,
      teamCode: row.get(USER.teamCode),
      status: "Active",
    });
  }
  if (!users.length) throw new Error("No rows match an existing register. Check the Register ID column.");
  return { users, skipped, byName };
}

/** Checks an uploaded mapping file without saving. Returns { users, registers, skipped } counts. */
export async function checkUserMappingTemplate(file) {
  const { users, skipped } = await parseUserMappingTemplate(file);
  return { users: users.length, registers: new Set(users.map((u) => u.registerId)).size, skipped };
}

/** Parses an uploaded user mapping template and maps users to registers. */
export async function uploadUserMappingTemplate(file) {
  const { users, byName } = await parseUserMappingTemplate(file);
  attendanceActions.addUsers(users);
  const byRegister = new Map();
  for (const u of users) byRegister.set(u.registerId, [...(byRegister.get(u.registerId) ?? []), u]);
  const names = new Map([...byName.values()].map((r) => [r.id, r.name]));
  attendanceActions.log(
    [...byRegister].map(([id, list]) => ({
      action: "Users Mapped",
      register: names.get(id) ?? "",
      details: `${list.length} ${list.length === 1 ? "user" : "users"} mapped from ${file.name} · Roles: ${[
        ...new Set(list.flatMap((u) => u.role.split(", ")).filter(Boolean)),
      ].join(", ")}`,
    })),
  );
}

/* ---------- Simple single-sheet exports ---------- */

async function simpleSheet(sheetName, headers, rows) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  return writeXlsxFile(
    [headers.map((h) => ({ value: h, fontWeight: "bold" })), ...rows.map((row) => row.map((v) => (v === "" ? null : v)))],
    { sheet: sheetName, columns: headers.map((h) => ({ width: Math.max(14, h.length + 4) })), stickyRowsCount: 1 },
  ).toBlob();
}

export async function downloadSimpleSheet(fileName, sheetName, headers, rows, audit) {
  saveBlob(await simpleSheet(sheetName, headers, rows), fileName);
  if (audit) attendanceActions.log([audit]);
}

const REGISTER_EXPORT_HEADERS = [
  "Register ID", "Boundary Level", "Boundary", "Attendance Frequency", "Attendance Officer",
  "Number of Users", "User Name", "User ID", "Role", "Team Code", "Status",
];

function registerExportRows(register, users) {
  const base = [
    register.name,
    register.boundary,
    register.boundaryName || null,
    register.frequency,
    register.officer || null,
    register.users,
  ];
  const mapped = users.filter((u) => u.registerId === register.id);
  return mapped.length
    ? mapped.map((u) => [...base, u.name, u.workerId, u.role, u.teamCode || null, u.status])
    : [[...base, null, null, null, null, null]];
}

const safeFileName = (name) => name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "register";

/** Downloads registers either as one sheet (`single`) or one file each in a zip (`individual`). */
export async function downloadRegisters(registers, mode) {
  if (!registers.length) return;
  const { users } = getState();
  const countLabel = `${registers.length} ${registers.length === 1 ? "register" : "registers"}`;

  if (mode === "single" || registers.length === 1) {
    const rows = registers.flatMap((r) => registerExportRows(r, users));
    const fileName = registers.length === 1 ? `${safeFileName(registers[0].name)}.xlsx` : `Attendance_Registers_${registers.length}.xlsx`;
    saveBlob(await simpleSheet("Attendance Registers", REGISTER_EXPORT_HEADERS, rows), fileName);
    attendanceActions.log(
      registers.map((r) => ({
        action: "Register Downloaded",
        register: r.name,
        details: registers.length === 1 ? "Register downloaded" : `Downloaded in a single sheet with ${countLabel}`,
      })),
    );
    return;
  }

  const { zipSync } = await import("fflate");
  const files = {};
  for (const r of registers) {
    let name = `${safeFileName(r.name)}.xlsx`;
    for (let n = 2; files[name]; n++) name = `${safeFileName(r.name)}_${n}.xlsx`;
    const blob = await simpleSheet("Attendance Register", REGISTER_EXPORT_HEADERS, registerExportRows(r, users));
    files[name] = new Uint8Array(await blob.arrayBuffer());
  }
  saveBlob(new Blob([zipSync(files)], { type: "application/zip" }), `Attendance_Registers_${registers.length}.zip`);
  attendanceActions.log(
    registers.map((r) => ({
      action: "Register Downloaded",
      register: r.name,
      details: `Downloaded as an individual register (zip of ${countLabel})`,
    })),
  );
}

/** Re-downloads a file the user uploaded. */
export function downloadFile(file) {
  saveBlob(file, file.name);
}

/**
 * Help content, shared by the Help panel (suggested for this page) and the Help Center
 * (Documents, Videos, FAQs). Prototype content: titles and answers describe this attendance setup.
 */

export const TOPICS = [
  { id: "start", label: "Getting started" },
  { id: "registers", label: "Creating registers" },
  { id: "mapping", label: "Mapping users" },
  { id: "manage", label: "Managing registers" },
  { id: "audit", label: "Audit log" },
];
export const topicLabel = (t) => TOPICS.find((x) => x.id === t).label;

/** The topic each page's help comes from. */
const PAGE_TOPICS = [
  [/^\/attendance\/(customize|register-summary|upload)$/, "registers"],
  [/^\/attendance\/(map-template|map-summary|upload-mapping)$/, "mapping"],
  [/^\/attendance\/registers/, "manage"],
  [/^\/attendance\/audit-log$/, "audit"],
];
export const pageTopic = (path) => PAGE_TOPICS.find(([re]) => re.test(path))?.[1] ?? "start";

// Concepts people need to understand, phrased as the questions they actually ask.
export const FAQS = [
  {
    id: "register",
    topic: "start",
    q: "What is an attendance register?",
    a: "A list of the people working in one boundary, such as a ward or a settlement, much like a class attendance sheet with one sheet per classroom and one row per student. Each day, an attendance officer marks everyone on it Present or Absent.",
  },
  {
    id: "template",
    topic: "start",
    q: "What is a template, and why do I need one?",
    a: "A template is an Excel file the system creates for you, like a form that has been partly filled in for you with what it knows from your choices, such as boundaries, Register IDs and dates. You check it, add anything missing, and upload it back. It lets you set up many registers or users at once instead of one by one.",
  },
  {
    id: "mapping",
    topic: "mapping",
    q: "What does mapping users mean?",
    a: "Adding people to a register so their attendance can be marked there, like writing the students' names on the attendance sheet before the first day. Each person is linked to one register through its Register ID.",
  },
  {
    id: "enrollment",
    topic: "mapping",
    q: "What is an enrollment date?",
    a: "The day a person joins a register. Attendance can only be marked for them from that date onwards. A de-enrollment date is optional and is the day they leave.",
  },
  {
    id: "session",
    topic: "registers",
    q: "What is a session?",
    a: "One round of attendance in a day. “Once a day” means one session; “Twice a day” means two, for example morning and evening.",
  },
  {
    id: "active",
    topic: "manage",
    q: "What's the difference between users and active users?",
    a: "Users counts everyone ever mapped to a register. Active users are the people currently on it, so anyone who has been de-enrolled is left out.",
  },
  {
    id: "hidden",
    topic: "mapping",
    q: "Why can't I see some registers when mapping users?",
    a: "Registers that already have enrollment dates set can't be selected again, so they are hidden from that list.",
  },
  {
    id: "one-per-boundary",
    topic: "registers",
    q: "Why can't I create a register for boundaries that already have one?",
    a: "Each set of boundaries can only have one register. To change it, edit the existing register, or delete it in Manage Registers and create a new one.",
  },
];

/** How-to videos, one for each task in the attendance setup. */
export const TUTORIALS = [
  { id: "t1", topic: "start", length: "3 min", popular: true, title: "A tour of attendance setup", desc: "Where everything is, and what to do first." },
  { id: "t2", topic: "registers", length: "5 min", popular: true, title: "Create attendance registers", desc: "Customize the register template, download it and upload it back." },
  { id: "t3", topic: "registers", length: "4 min", title: "Fill in the register template", desc: "What each column means, and how to avoid upload errors." },
  { id: "t4", topic: "mapping", length: "5 min", popular: true, title: "Map users to registers", desc: "Pick registers, set enrollment dates and download the template." },
  { id: "t5", topic: "mapping", length: "4 min", title: "Fill in the user mapping template", desc: "Frontline workers, markers and approvers, each on their own sheet." },
  { id: "t6", topic: "mapping", length: "3 min", title: "Fix errors in an uploaded file", desc: "Find the rows with errors, correct them and upload the file again." },
  { id: "t7", topic: "manage", length: "3 min", title: "Manage your registers", desc: "Find, view, edit and delete registers." },
  { id: "t8", topic: "manage", length: "2 min", title: "Download a register", desc: "Download registers as a single Excel sheet or one file each." },
  { id: "t9", topic: "audit", length: "2 min", title: "Read the audit log", desc: "See who downloaded, created, edited or deleted a register, and when." },
];

export const DOCS = [
  { id: "d1", topic: "start", format: "PDF", title: "Attendance setup guide", desc: "Every step, from creating registers to mapping users." },
  { id: "d2", topic: "registers", format: "XLSX", title: "Register template sample", desc: "A filled-in example of the attendance register template." },
  { id: "d3", topic: "mapping", format: "XLSX", title: "User mapping template sample", desc: "A filled-in example with frontline workers, markers and approvers." },
  { id: "d4", topic: "mapping", format: "PDF", title: "Roles in attendance", desc: "What frontline workers, markers and approvers do." },
  { id: "d5", topic: "start", format: "PDF", title: "Upload errors explained", desc: "Each upload error, what causes it and how to fix it." },
];

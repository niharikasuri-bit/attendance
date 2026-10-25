import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Lightbulb, Search, X } from "lucide-react";

// Concepts people need to understand, phrased as the questions they actually ask.
const TOPICS = [
  {
    id: "register",
    q: "What is an attendance register?",
    a: "A list of the people working in one boundary, such as a ward or a settlement. Each day, an attendance officer marks everyone on it Present or Absent.",
    like: "a class attendance sheet: one sheet per classroom, one row per student.",
  },
  {
    id: "template",
    q: "What is a template, and why do I need one?",
    a: "A template is an Excel file the system creates for you, already filled in with what it knows from your choices, like boundaries, Register IDs and dates. You check it, add anything missing, and upload it back. It lets you set up many registers or users at once instead of one by one.",
    like: "a form that has been partly filled in for you.",
  },
  {
    id: "mapping",
    q: "What does mapping users mean?",
    a: "Adding people to a register so their attendance can be marked there. Each person is linked to one register through its Register ID.",
    like: "writing the students' names on the attendance sheet before the first day.",
  },
  {
    id: "roles",
    q: "Who are frontline workers, markers and approvers?",
    a: "Frontline workers are the people whose attendance is recorded. Attendance markers record it, and attendance approvers check and approve it. Each group has its own sheet in the user mapping template.",
  },
  {
    id: "enrollment",
    q: "What is an enrollment date?",
    a: "The day a person joins a register. Attendance can only be marked for them from that date onwards. A de-enrollment date is optional and is the day they leave.",
  },
  {
    id: "session",
    q: "What is a session?",
    a: "One round of attendance in a day. “Once a day” means one session; “Twice a day” means two, for example morning and evening.",
  },
  {
    id: "active",
    q: "What's the difference between users and active users?",
    a: "Users counts everyone ever mapped to a register. Active users are the people currently on it, so anyone who has been de-enrolled is left out.",
  },
  {
    id: "hidden",
    q: "Why can't I see some registers when mapping users?",
    a: "Registers that already have enrollment dates set can't be selected again, so they are hidden from that list.",
  },
  {
    id: "one-per-boundary",
    q: "Why can't I create a register for boundaries that already have one?",
    a: "Each set of boundaries can only have one register. To change it, edit the existing register, or delete it in Manage Registers and create a new one.",
  },
];

// Questions suggested for the page they're on; the rest sit under "More questions".
const PAGE_TOPICS = [
  [/^\/attendance\/(customize|register-summary|upload)$/, ["register", "template", "session", "one-per-boundary"]],
  [/^\/attendance\/(map-template|map-summary|upload-mapping)$/, ["mapping", "roles", "enrollment", "hidden"]],
  [/^\/attendance\/registers/, ["register", "active", "one-per-boundary", "enrollment"]],
  [/^\/attendance\/audit-log$/, ["register", "active", "mapping", "template"]],
];
const DEFAULT_TOPICS = ["register", "template", "mapping", "roles"];

/** A small scene for the top of the panel: someone at a laptop with a question bubble. Decorative. */
function HelpArt() {
  return (
    <svg className="mb-1 h-auto w-32" viewBox="0 0 220 140" aria-hidden="true" focusable="false">
      <ellipse cx="112" cy="128" rx="92" ry="8" fill="var(--primary)" fillOpacity="0.12" />
      <circle cx="58" cy="44" r="30" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="176" cy="82" r="22" fill="var(--primary)" fillOpacity="0.08" />
      {/* Desk and laptop */}
      <rect x="40" y="104" width="148" height="6" rx="3" fill="#3F3D56" />
      <rect x="98" y="72" width="62" height="32" rx="4" fill="#3F3D56" />
      <rect x="102" y="76" width="54" height="24" rx="2" fill="#fff" />
      <rect x="107" y="81" width="26" height="3" rx="1.5" fill="var(--primary)" />
      <rect x="107" y="87" width="40" height="3" rx="1.5" fill="#D6D6E3" />
      <rect x="107" y="93" width="32" height="3" rx="1.5" fill="#D6D6E3" />
      <path d="M92 104h74l-4 -4h-66z" fill="#2F2E41" />
      {/* Person */}
      <path d="M62 104c0-20 8-34 22-34s22 14 22 34z" fill="var(--primary)" />
      <circle cx="84" cy="56" r="11" fill="#FFB8A0" />
      <path d="M73 54c0-8 6-13 12-13 7 0 11 5 11 11-4-3-9-4-14-3-3 0-6 2-9 5z" fill="#2F2E41" />
      <path d="M96 86l14 6" stroke="#FFB8A0" strokeWidth="5" strokeLinecap="round" />
      {/* Question bubble */}
      <path
        d="M128 20h44a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-26l-10 9v-9h-8a10 10 0 0 1-10-10V30a10 10 0 0 1 10-10z"
        fill="#fff"
        stroke="var(--primary)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <text x="150" y="48" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--primary)" fontFamily="inherit">
        ?
      </text>
      <circle cx="196" cy="28" r="3" fill="var(--primary)" opacity="0.5" />
      <circle cx="30" cy="92" r="2.5" fill="var(--primary)" opacity="0.4" />
    </svg>
  );
}

function QuestionList({ id, topics, openId, onToggle }) {
  return (
    <ul className="rounded-xl border border-[#E6EAEE] bg-white px-1 py-0.5 shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      {topics.map((t) => {
        const isOpen = openId === t.id;
        return (
          <li key={t.id} className="border-t border-[#F1F1F1] first:border-0">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${id}-${t.id}`}
              onClick={() => onToggle(isOpen ? null : t.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-[11px] text-left text-[0.9375rem] hover:bg-[#F5F8FB] hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isOpen ? "font-bold text-heading" : "text-foreground"
              }`}
            >
              <span className="min-w-0 flex-1">{t.q}</span>
              {isOpen ? (
                <ChevronUp className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-[18px] shrink-0 text-[#B0B6BC]" aria-hidden="true" />
              )}
            </button>
            {isOpen && (
              <div id={`${id}-${t.id}`} className="px-2.5 pb-3 text-sm leading-[1.55] text-foreground">
                <p>{t.a}</p>
                {t.like && (
                  <p className="mt-2.5 flex items-start gap-1.5 rounded-md bg-info px-3 py-2 text-muted-foreground">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-heading">Think of it like</span> {t.like}
                    </span>
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const SECTION_HEADING = "mb-2.5 text-xs font-bold uppercase tracking-[0.05em] text-[#5F6B76]";

/** Help, beside the page, only when asked: "How can we help you?" with search, questions suggested for the
 *  page they're on, and the rest below. Search covers every question and answer. Escape closes it. */
export function HelpPanel({ id, onClose }) {
  const { pathname } = useLocation();
  const titleRef = useRef(null);
  const panelRef = useRef(null);
  useEffect(() => titleRef.current?.focus(), []);
  // Sit under the header, and slide up to the top of the window once the header scrolls away.
  useEffect(() => {
    const place = () => {
      if (panelRef.current) panelRef.current.style.top = `${Math.max(0, 60 - window.scrollY)}px`;
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    return () => window.removeEventListener("scroll", place);
  }, []);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const term = q.trim().toLowerCase();

  const path = pathname.replace(/\/+$/, "") || "/";
  const suggestedIds = PAGE_TOPICS.find(([re]) => re.test(path))?.[1] ?? DEFAULT_TOPICS;
  const suggested = suggestedIds.map((s) => TOPICS.find((t) => t.id === s));
  const more = TOPICS.filter((t) => !suggestedIds.includes(t.id));
  const hits = term ? TOPICS.filter((t) => `${t.q} ${t.a} ${t.like ?? ""}`.toLowerCase().includes(term)) : [];

  return (
    <aside
      id={id}
      ref={panelRef}
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className="fixed bottom-0 right-0 top-[60px] z-40 flex w-[380px] max-w-full animate-in slide-in-from-right-6 fade-in flex-col border-l border-border bg-[#F6F8FA] shadow-[-16px_0_40px_rgb(0_0_0/0.18)] min-[1000px]:shadow-[-12px_0_32px_rgb(0_0_0/0.06)] motion-reduce:animate-none"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="relative flex shrink-0 flex-col items-center bg-[linear-gradient(180deg,#E1ECF8_0%,#ECF2F9_55%,#F6F8FA_100%)] px-5 pb-5 pt-4 text-center">
          <button
            type="button"
            aria-label="Close help"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 grid size-9 place-items-center rounded-full bg-white text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12)] hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
          <HelpArt />
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1} className="text-xl font-bold text-heading outline-none">
            How can we help you?
          </h2>
          <p className="mb-3.5 mt-0.5 text-sm text-muted-foreground">Quick answers to common questions about attendance registers.</p>
          <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-input bg-white px-3.5 shadow-[0_2px_8px_rgb(16_24_40/0.06)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <label htmlFor={`${id}-q`} className="sr-only">
              Search help
            </label>
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id={`${id}-q`}
              type="search"
              placeholder="Search help"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <p className="sr-only" role="status">
          {term ? `${hits.length} ${hits.length === 1 ? "result" : "results"}` : ""}
        </p>

        <div className="flex flex-col gap-[22px] p-5">
          {term ? (
            hits.length ? (
              <section aria-labelledby={`${id}-r`}>
                <h3 id={`${id}-r`} className={SECTION_HEADING}>
                  Questions
                </h3>
                <QuestionList id={id} topics={hits} openId={openId} onToggle={setOpenId} />
              </section>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-white p-5 text-center text-[0.9375rem] text-muted-foreground">
                <p className="mb-1">
                  <strong className="text-foreground">No results for “{q.trim()}”</strong>
                </p>
                <p>Try other words, or look through the questions below.</p>
              </div>
            )
          ) : null}
          {(!term || !hits.length) && (
            <>
              <section aria-labelledby={`${id}-a`}>
                <h3 id={`${id}-a`} className={SECTION_HEADING}>
                  Suggested for this page
                </h3>
                <QuestionList id={id} topics={suggested} openId={openId} onToggle={setOpenId} />
              </section>
              <section aria-labelledby={`${id}-m`}>
                <h3 id={`${id}-m`} className={SECTION_HEADING}>
                  More questions
                </h3>
                <QuestionList id={id} topics={more} openId={openId} onToggle={setOpenId} />
              </section>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

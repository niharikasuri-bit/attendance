import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronUp, CirclePlay, FileText, MessageCircleQuestion, Search, X } from "lucide-react";
import { DOCS, FAQS, TUTORIALS, topicLabel } from "@/lib/help-content";

const TOPICS = FAQS;

// Questions suggested for the page they're on; search covers them all.
const PAGE_TOPICS = [
  [/^\/attendance\/(customize|register-summary|upload)$/, ["register", "template", "session", "one-per-boundary"]],
  [/^\/attendance\/(map-template|map-summary|upload-mapping)$/, ["mapping", "enrollment", "hidden"]],
  [/^\/attendance\/registers/, ["register", "active", "one-per-boundary", "enrollment"]],
  [/^\/attendance\/audit-log$/, ["register", "active", "mapping", "template"]],
];
const DEFAULT_TOPICS = ["register", "template", "mapping", "enrollment"];

/** A small scene for the top of the panel: someone at a laptop with a question bubble. Decorative. */
export function HelpArt({ className = "mb-1 h-auto w-44" }) {
  return (
    <svg className={className} viewBox="0 0 220 140" aria-hidden="true" focusable="false">
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
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Quick links into the Help Center, one per type of resource.
const QUICK = [
  { key: "documents", label: "Documents", hint: "Reference and downloads", icon: FileText, tone: "bg-[#E8F0FE] text-[#1D70B8]" },
  { key: "videos", label: "Tutorials", hint: "Step-by-step guides and videos", icon: CirclePlay, tone: "bg-[#FDECEC] text-[#B42318]" },
  { key: "faq", label: "FAQs", hint: "Common questions", icon: MessageCircleQuestion, tone: "bg-[#E7F4EC] text-[#00703C]" },
];

/** A document or video found by search, which opens it in the Help Center. */
function ResourceList({ items, onGo }) {
  return (
    <ul className="rounded-xl border border-[#E6EAEE] bg-white px-1 py-0.5 shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      {items.map((x) => (
        <li key={x.id} className="border-t border-[#F1F1F1] first:border-0">
          <button
            type="button"
            onClick={onGo}
            className="group flex w-full items-center gap-3 rounded-lg px-2 py-[11px] text-left text-[0.9375rem] text-foreground hover:bg-[#F5F8FB] hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {x.format ? (
              <span
                aria-hidden="true"
                className={`grid h-[26px] w-[22px] shrink-0 place-items-end justify-center rounded-[3px_7px_3px_3px] pb-0.5 text-[0.4375rem] font-extrabold text-white ${x.format === "PDF" ? "bg-[#D93025]" : "bg-[#188038]"}`}
              >
                {x.format}
              </span>
            ) : (
              <span aria-hidden="true" className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#1A73E8,#0B4B66)] text-white">
                <CirclePlay className="size-3.5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              {x.title}
              <span className="block text-xs text-muted-foreground">{x.length ? `${x.length} · ${topicLabel(x.topic)}` : topicLabel(x.topic)}</span>
            </span>
            <ChevronRight className="size-[18px] shrink-0 text-[#B0B6BC] group-hover:text-primary" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

const SECTION_HEADING = "mb-2.5 text-xs font-bold uppercase tracking-[0.05em] text-[#5F6B76]";

function QuickLinks({ id, items, onGo }) {
  return (
    <section aria-labelledby={`${id}-k`}>
      <h3 id={`${id}-k`} className={SECTION_HEADING}>
        Quick links
      </h3>
      <ul className="grid grid-cols-3 gap-2">
        {items.map((x) => (
          <li key={x.key}>
            <button
              type="button"
              onClick={() => onGo(x.key)}
              className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#E6EAEE] bg-white px-2 py-3.5 text-center text-sm font-bold leading-tight text-heading shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-shadow hover:border-primary/45 hover:shadow-[0_4px_12px_rgb(16_24_40/0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true" className={`grid size-10 place-items-center rounded-xl ${x.tone}`}>
                <x.icon className="size-5" />
              </span>
              {x.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Help, beside the page, only when asked: "How can we help you?" with search, questions suggested for the
 *  page they're on and quick links into the Help Center. Search covers every question, document
 *  and video. Escape closes it. */
export function HelpPanel({ id, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const go = (type) => {
    onClose();
    navigate(`/attendance/help${type ? `?type=${type}` : ""}`);
  };
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
  const hits = term ? TOPICS.filter((t) => `${t.q} ${t.a}`.toLowerCase().includes(term)) : [];
  // Searching covers everything: documents, videos and the quick links too, not just questions
  const docHits = term ? DOCS.filter((d) => `${d.title} ${d.desc} ${topicLabel(d.topic)}`.toLowerCase().includes(term)) : [];
  const vidHits = term ? TUTORIALS.filter((t) => `${t.title} ${t.desc} ${topicLabel(t.topic)}`.toLowerCase().includes(term)) : [];
  const quickShown = QUICK.filter((x) => !term || `${x.label} ${x.hint}`.toLowerCase().includes(term));
  const count = hits.length + docHits.length + vidHits.length + (term ? quickShown.length : 0);

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
      {/* Outside the scroll area, so it stays in place while the panel scrolls */}
      <button
        type="button"
        aria-label="Close help"
        onClick={onClose}
        className="absolute right-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-full bg-white text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12)] hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-5" />
      </button>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="relative flex shrink-0 flex-col items-center bg-[linear-gradient(180deg,#E1ECF8_0%,#ECF2F9_55%,#F6F8FA_100%)] px-5 pb-5 pt-4 text-center">
          <HelpArt />
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1} className="text-xl font-bold text-heading outline-none">
            How can we help you?
          </h2>
          <p className="mb-3.5 mt-0.5 text-sm text-muted-foreground">Find documents, short how-to videos and answers to common questions.</p>
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
          {term ? `${count} ${count === 1 ? "result" : "results"}` : ""}
        </p>

        <div className="flex flex-col gap-[22px] p-5">
          {term ? (
            <>
              {hits.length > 0 && (
                <section aria-labelledby={`${id}-r`}>
                  <h3 id={`${id}-r`} className={SECTION_HEADING}>
                    Questions
                  </h3>
                  <QuestionList id={id} topics={hits} openId={openId} onToggle={setOpenId} />
                </section>
              )}
              {docHits.length > 0 && (
                <section aria-labelledby={`${id}-d`}>
                  <h3 id={`${id}-d`} className={SECTION_HEADING}>
                    Documents
                  </h3>
                  <ResourceList items={docHits} onGo={() => go("documents")} />
                </section>
              )}
              {vidHits.length > 0 && (
                <section aria-labelledby={`${id}-v`}>
                  <h3 id={`${id}-v`} className={SECTION_HEADING}>
                    Videos
                  </h3>
                  <ResourceList items={vidHits} onGo={() => go("videos")} />
                </section>
              )}
              {quickShown.length > 0 && <QuickLinks id={id} items={quickShown} onGo={go} />}
              {!count && (
                <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-white p-5 text-center text-[0.9375rem] text-muted-foreground">
                  <p className="mb-1">
                    <strong className="text-foreground">No results for “{q.trim()}”</strong>
                  </p>
                  <p>Try other words, or look through the FAQs.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <section aria-labelledby={`${id}-a`}>
                <h3 id={`${id}-a`} className={SECTION_HEADING}>
                  Suggested for this page
                </h3>
                <QuestionList id={id} topics={suggested} openId={openId} onToggle={setOpenId} />
              </section>
              <QuickLinks id={id} items={QUICK} onGo={go} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

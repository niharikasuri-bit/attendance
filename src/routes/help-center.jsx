import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, CirclePlay, FileText, LayoutGrid, Lightbulb, MessageCircleQuestion, Search, SlidersHorizontal, X } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/app-shell";
import { HelpArt } from "@/components/help-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DOCS, FAQS, TOPICS, TUTORIALS, topicLabel } from "@/lib/help-content";

/**
 * The Help Center. A header with the illustration, then search and a Filters button that opens advanced
 * filters (topic, words in it, words in its name, popular only). The type of resource (All, Documents,
 * Videos, FAQs) sits below with counts. Documents and videos are equal cards; questions open in place.
 */
const RES = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "videos", label: "Videos", icon: CirclePlay },
  { id: "faq", label: "FAQs", icon: MessageCircleQuestion },
];
const NO_FILTERS = { topic: "all", words: "", name: "", popular: false };

const ITEMS = [
  ...DOCS.map((d) => ({ id: d.id, res: "documents", title: d.title, sub: d.desc, topic: d.topic, type: "Document", format: d.format })),
  ...TUTORIALS.map((t) => ({ id: t.id, res: "videos", title: t.title, sub: t.desc, topic: t.topic, type: "Video", length: t.length, popular: t.popular })),
  ...FAQS.map((f) => ({ id: f.id, res: "faq", title: f.q, sub: "", answer: f.a, like: f.like, topic: f.topic, type: "Question" })),
];

const has = (hay, text) =>
  text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.toLowerCase().includes(w));
const searchText = (i) => `${i.title} ${i.sub} ${i.answer ?? ""} ${i.type} ${topicLabel(i.topic)}`;

const FILE_COLORS = { PDF: ["bg-[#FCE8E6]", "bg-[#D93025]"], XLSX: ["bg-[#E6F4EA]", "bg-[#188038]"] };

export default function HelpCenter() {
  const uid = useId();
  const [params, setParams] = useSearchParams();
  const typeParam = params.get("type");
  const res = RES.some((r) => r.id === typeParam) ? typeParam : "all";
  const setRes = (r) => setParams(r === "all" ? {} : { type: r }, { replace: true });
  const [q, setQ] = useState("");
  const [f, setF] = useState(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [open, setOpen] = useState(null);
  const [rated, setRated] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Everything but the resource type, so each type can show its count
  const matching = ITEMS.filter(
    (i) =>
      has(searchText(i), q) &&
      (f.topic === "all" || i.topic === f.topic) &&
      has(`${i.title} ${i.sub} ${i.answer ?? ""}`, f.words) &&
      has(i.title, f.name) &&
      (!f.popular || i.popular),
  );
  const rows = matching.filter((i) => res === "all" || i.res === res);
  // When nothing shows, work out why: the words, the filters, or the type
  const bySearch = ITEMS.filter((i) => has(searchText(i), q)).length;
  const why = q.trim() && !bySearch ? "search" : !matching.length ? "filters" : "type";
  const cards = rows.filter((i) => i.res !== "faq");
  const faqs = rows.filter((i) => i.res === "faq");
  const countOf = (r) => (r === "all" ? matching.length : matching.filter((i) => i.res === r).length);

  // Active filters as removable chips
  const chips = [
    ...(f.topic !== "all" ? [{ key: "topic", label: `Topic: ${topicLabel(f.topic)}` }] : []),
    ...(f.words.trim() ? [{ key: "words", label: `Has the words: ${f.words.trim()}` }] : []),
    ...(f.name.trim() ? [{ key: "name", label: `Name contains: ${f.name.trim()}` }] : []),
    ...(f.popular ? [{ key: "popular", label: "Popular only" }] : []),
  ];
  const act = (i) => {
    if (i.res === "faq") setOpen(open === i.id ? null : i.id);
    else setToast(`${i.res === "documents" ? "Downloads" : "Videos"} aren’t available in this prototype yet`);
  };

  const crumbs = [{ label: "Home", to: "/" }, { label: "Attendance Setup & Management", to: "/attendance" }, { label: "Help Center" }];
  const secondaryBtn =
    "inline-flex h-10 items-center justify-center rounded-md border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-white pb-14">
        <header className="bg-[linear-gradient(180deg,#E1ECF8_0%,#EBF2FA_45%,#F7FAFD_75%,#fff_100%)] px-6 pb-6 pt-4">
          <Breadcrumb items={crumbs} />
          <div className="flex flex-col items-center pt-2 text-center">
            <HelpArt className="mb-2 h-auto w-[210px]" />
            <h1 className="font-condensed text-[1.75rem] font-bold text-heading">How can we help you?</h1>
            <p className="mt-2 max-w-[560px] text-[1.0625rem] leading-normal text-muted-foreground">
              Find documents, short how-to videos and answers to common questions about setting up attendance registers.
            </p>
          </div>
        </header>

        <section className="px-6 pt-6 lg:px-10" aria-labelledby={`${uid}-res`}>
          <h2 id={`${uid}-res`} className="sr-only">
            Resources
          </h2>
          {/* Search and filters, then the type of resource with the count, then what's applied */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#C9D0D6] bg-white px-3.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <label htmlFor={`${uid}-q`} className="sr-only">
                Search the Help Center
              </label>
              <Search className="size-5 shrink-0 text-[#6B7782]" aria-hidden="true" />
              <input
                id={`${uid}-q`}
                type="search"
                placeholder="Search documents, videos and questions"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(null);
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button type="button" aria-haspopup="dialog" onClick={() => setFiltersOpen(true)} className={`${secondaryBtn} h-12 shrink-0 gap-2 px-[18px] font-bold`}>
              <SlidersHorizontal className="size-[18px]" aria-hidden="true" />
              Filters
              {chips.length > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold text-white">{chips.length}</span>}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-[#DADCE0] bg-white p-1" role="group" aria-label="Type of resource">
              {RES.map((r) => {
                const on = res === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setRes(r.id);
                      setOpen(null);
                    }}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      on ? "bg-primary font-bold text-white" : "font-medium text-[#3C4043] hover:bg-[#F1F3F4]"
                    }`}
                  >
                    <r.icon className={`size-[18px] ${on ? "text-white" : "text-[#5F6368]"}`} aria-hidden="true" />
                    {r.label}
                    <span className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold ${on ? "bg-white/25 text-white" : "bg-[#F1F3F4] text-[#5F6368]"}`}>{countOf(r.id)}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-[#5F6368]" role="status">
              {rows.length} {rows.length === 1 ? "resource" : "resources"}
            </p>
          </div>

          {/* Filters set in the Filters dialog, each removable. The type and search already show above. */}
          {chips.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span key={c.key} className="inline-flex h-8 items-center gap-1 rounded-lg bg-selected-bg pl-3 pr-1 text-sm font-medium text-heading">
                  {c.label}
                  <button
                    type="button"
                    aria-label={`Remove ${c.label}`}
                    onClick={() => setF({ ...f, [c.key]: NO_FILTERS[c.key] })}
                    className="grid size-6 place-items-center rounded-full hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => setF(NO_FILTERS)} className="h-8 rounded-lg px-3 text-sm font-bold text-primary hover:bg-selected-bg">
                Clear filters
              </button>
            </div>
          )}

          {rows.length ? (
            <>
              {cards.length > 0 && (
                <ul className="mt-5 grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                  {cards.map((i) => (
                    <li key={i.id} className="flex flex-col overflow-hidden rounded-xl border border-[#DADCE0] bg-white transition-shadow hover:border-[#C4C7C5] hover:shadow-[0_1px_3px_rgb(60_64_67/0.2),0_4px_8px_rgb(60_64_67/0.1)]">
                      <button type="button" onClick={() => act(i)} className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        <span
                          aria-hidden="true"
                          className={`relative mx-2 mt-2 grid h-28 place-items-center rounded-lg ${i.res === "documents" ? FILE_COLORS[i.format][0] : "bg-[linear-gradient(135deg,#1A73E8,#0B4B66)]"}`}
                        >
                          {i.res === "documents" ? (
                            <span className={`grid h-14 w-11 place-items-end justify-center rounded-[4px_14px_4px_4px] pb-[7px] text-[0.6875rem] font-extrabold tracking-[0.04em] text-white shadow-md ${FILE_COLORS[i.format][1]}`}>
                              {i.format}
                            </span>
                          ) : (
                            <CirclePlay className="size-[34px] text-white" />
                          )}
                          {i.length && <span className="absolute bottom-2 right-2 rounded bg-black/60 px-[7px] py-px text-xs font-bold text-white">{i.length}</span>}
                          {i.popular && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-px text-xs font-bold text-heading">Popular</span>}
                        </span>
                        <span className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
                          <strong className="line-clamp-2 text-[0.9375rem] font-semibold leading-[1.35] text-[#202124]">{i.title}</strong>
                          {i.sub && <span className="line-clamp-2 text-[0.8125rem] leading-[1.4] text-[#5F6368]">{i.sub}</span>}
                          {/* Its type in a blue tag, its topic in a grey one */}
                          <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                            <span className="inline-flex h-6 items-center rounded-full bg-[#E8F0FE] px-2.5 text-xs font-bold text-[#0B57D0]">{i.type}</span>
                            <span className="inline-flex h-6 items-center rounded-full bg-[#F1F3F4] px-2.5 text-xs font-medium text-[#3C4043]">{topicLabel(i.topic)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Questions in the FAQ style: an accordion */}
              {faqs.length > 0 && (
                <section className={cards.length ? "mt-9" : "mt-5"} aria-labelledby={`${uid}-faqh`}>
                  <h2 id={`${uid}-faqh`} className="mb-2 flex items-center gap-2 text-lg font-bold text-heading">
                    Frequently asked questions <span className="rounded-full bg-[#F1F3F4] px-2 py-px text-xs text-[#5F6368]">{faqs.length}</span>
                  </h2>
                  <ul className="overflow-hidden rounded-xl border border-[#DADCE0] bg-white">
                    {faqs.slice(0, res === "faq" ? faqs.length : 6).map((i) => {
                      const isOpen = open === i.id;
                      return (
                        <li key={i.id} className="border-t border-[#E8EAED] first:border-0">
                          <h3>
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={`${uid}-a-${i.id}`}
                              onClick={() => act(i)}
                              className={`flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                                isOpen ? "bg-selected-bg" : "hover:bg-[#F8F9FA]"
                              }`}
                            >
                              <span className={`min-w-0 flex-1 text-base ${isOpen ? "font-bold text-heading" : "font-medium text-[#202124]"}`}>{i.title}</span>
                              <span className="shrink-0 rounded-full bg-[#F1F3F4] px-2.5 py-0.5 text-xs font-medium text-[#5F6368]">{topicLabel(i.topic)}</span>
                              {isOpen ? <ChevronUp className="size-5 shrink-0 text-primary" aria-hidden="true" /> : <ChevronDown className="size-5 shrink-0 text-[#5F6368]" aria-hidden="true" />}
                            </button>
                          </h3>
                          {isOpen && (
                            <div id={`${uid}-a-${i.id}`} className="bg-selected-bg px-5 pb-[18px] pt-1">
                              <p className="max-w-[75ch] text-[0.9375rem] leading-relaxed text-[#202124]">{i.answer}</p>
                              {i.like && (
                                <p className="mt-2.5 flex max-w-[75ch] items-start gap-1.5 rounded-md bg-info px-3 py-2 text-sm text-muted-foreground">
                                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                                  <span>
                                    <span className="font-semibold text-heading">Think of it like</span> {i.like}
                                  </span>
                                </p>
                              )}
                              <div className="mt-2.5 flex items-center gap-2 text-[0.8125rem] text-[#5F6368]">
                                {rated[i.id] ? (
                                  <p role="status" className="font-bold text-[#188038]">
                                    Thanks for letting us know.
                                  </p>
                                ) : (
                                  <>
                                    <span>Was this helpful?</span>
                                    {["Yes", "No"].map((l) => (
                                      <button
                                        key={l}
                                        type="button"
                                        onClick={() => setRated({ ...rated, [i.id]: true })}
                                        className="h-7 rounded-full border border-[#DADCE0] bg-white px-3 text-[0.8125rem] text-[#3C4043] hover:border-primary hover:text-primary"
                                      >
                                        {l}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {res !== "faq" && faqs.length > 6 && (
                    <button type="button" onClick={() => (setRes("faq"), setOpen(null))} className="mt-2.5 h-8 rounded-lg px-3 text-sm font-bold text-primary hover:bg-selected-bg">
                      See all {faqs.length} questions
                    </button>
                  )}
                </section>
              )}
            </>
          ) : (
            <div className="mx-auto mt-7 flex max-w-[560px] flex-col items-center rounded-2xl border border-dashed border-[#DADCE0] bg-[#FAFBFC] px-6 py-10 text-center">
              <span className={`mb-3.5 grid size-16 place-items-center rounded-full ${why === "filters" ? "bg-selected-bg text-primary" : "bg-[#E8F0FE] text-[#1A73E8]"}`} aria-hidden="true">
                {why === "filters" ? <SlidersHorizontal className="size-7" /> : <Search className="size-7" />}
              </span>
              {why === "search" && (
                <>
                  <h3 className="text-xl font-bold text-heading">No results for “{q.trim()}”</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    Nothing in the Help Center uses those words. Check the spelling, or try a shorter or more general word.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Try:</span>
                    {["register", "template", "mapping", "enrollment", "upload"].map((w) => (
                      <button key={w} type="button" onClick={() => setQ(w)} className="h-[30px] rounded-full border border-[#DADCE0] bg-white px-3 text-[0.8125rem] text-heading hover:border-primary hover:text-primary">
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5">
                    <button type="button" className={secondaryBtn} onClick={() => setQ("")}>
                      Clear search
                    </button>
                  </div>
                </>
              )}
              {why === "filters" && (
                <>
                  <h3 className="text-xl font-bold text-heading">Your filters hide every result</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {q.trim() ? `“${q.trim()}” has ${bySearch} ${bySearch === 1 ? "result" : "results"}, ` : "There are resources here, "}
                    but none match {chips.map((c) => c.label).join(" and ")}. Remove a filter to see them.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <button type="button" className={secondaryBtn} onClick={() => setF(NO_FILTERS)}>
                      Clear filters
                    </button>
                    <button type="button" className={secondaryBtn} onClick={() => setFiltersOpen(true)}>
                      Change filters
                    </button>
                  </div>
                </>
              )}
              {why === "type" && (
                <>
                  <h3 className="text-xl font-bold text-heading">No {RES.find((r) => r.id === res).label.toLowerCase()} match</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    There {matching.length === 1 ? "is 1 result" : `are ${matching.length} results`} in other types
                    {q.trim() ? ` for “${q.trim()}”` : ""}.
                  </p>
                  <div className="mt-5">
                    <button type="button" className={secondaryBtn} onClick={() => setRes("all")}>
                      Show all types
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      <FiltersDialog
        open={filtersOpen}
        value={f}
        onApply={(v) => {
          setF(v);
          setOpen(null);
          setFiltersOpen(false);
        }}
        onOpenChange={setFiltersOpen}
      />

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#202124] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

/** Advanced filters in a dialog, laid out like Drive's advanced search: label on the left, field on the right. */
function FiltersDialog({ open, value, onApply, onOpenChange }) {
  const uid = useId();
  const [d, setD] = useState(value);
  useEffect(() => {
    if (open) setD(value);
  }, [open, value]);
  const field = "h-11 rounded-lg border border-input bg-white px-3.5 text-base text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] gap-0 bg-white p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply(d);
          }}
        >
          <div className="border-b border-border px-6 py-4 pr-14">
            <DialogTitle className="text-xl font-bold text-heading">Filters</DialogTitle>
          </div>
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-x-5 gap-y-4 px-6 py-5 max-sm:grid-cols-1">
            <label htmlFor={`${uid}-topic`} className="text-[0.9375rem] font-bold">
              Topic
            </label>
            <select id={`${uid}-topic`} value={d.topic} onChange={(e) => setD({ ...d, topic: e.target.value })} className={field}>
              <option value="all">Any topic</option>
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <label htmlFor={`${uid}-words`} className="text-[0.9375rem] font-bold">
              Has the words
            </label>
            <input id={`${uid}-words`} value={d.words} placeholder="Words found in the title, description or answer" onChange={(e) => setD({ ...d, words: e.target.value })} className={field} />
            <label htmlFor={`${uid}-name`} className="text-[0.9375rem] font-bold">
              Name contains
            </label>
            <input id={`${uid}-name`} value={d.name} placeholder="Part of the title" onChange={(e) => setD({ ...d, name: e.target.value })} className={field} />
            <span className="text-[0.9375rem] font-bold">Show</span>
            <label className="inline-flex items-center gap-2.5 text-[0.9375rem]">
              <input type="checkbox" checked={d.popular} onChange={(e) => setD({ ...d, popular: e.target.checked })} className="size-[18px] accent-primary" />
              Popular only
            </label>
          </div>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <button type="button" onClick={() => setD(NO_FILTERS)} className="h-8 rounded-lg px-3 text-sm font-bold text-primary hover:bg-selected-bg">
              Reset
            </button>
            <button type="submit" className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-95">
              Apply filters
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

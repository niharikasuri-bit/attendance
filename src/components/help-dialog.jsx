import { useEffect, useId, useState } from "react";
import { ChevronDown, Lightbulb, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// Concepts people need to understand, phrased as the questions they actually ask.
const TOPICS = [
  {
    q: "What is an attendance register?",
    a: "A list of the people working in one boundary, such as a ward or a settlement. Each day, an attendance officer marks everyone on it Present or Absent.",
    like: "a class attendance sheet: one sheet per classroom, one row per student.",
  },
  {
    q: "What is a template, and why do I need one?",
    a: "A template is an Excel file the system creates for you, already filled in with what it knows from your choices, like boundaries, Register IDs and dates. You check it, add anything missing, and upload it back. It lets you set up many registers or users at once instead of one by one.",
    like: "a form that has been partly filled in for you.",
  },
  {
    q: "What does mapping users mean?",
    a: "Adding people to a register so their attendance can be marked there. Each person is linked to one register through its Register ID.",
    like: "writing the students' names on the attendance sheet before the first day.",
  },
  {
    q: "Who are frontline workers, markers and approvers?",
    a: "Frontline workers are the people whose attendance is recorded. Attendance markers record it, and attendance approvers check and approve it. Each group has its own sheet in the user mapping template.",
  },
  {
    q: "What is an enrollment date?",
    a: "The day a person joins a register. Attendance can only be marked for them from that date onwards. A de-enrollment date is optional and is the day they leave.",
  },
  {
    q: "What is a session?",
    a: "One round of attendance in a day. “Once a day” means one session; “Twice a day” means two, for example morning and evening.",
  },
  {
    q: "What's the difference between users and active users?",
    a: "Users counts everyone ever mapped to a register. Active users are the people currently on it, so anyone who has been de-enrolled is left out.",
  },
  {
    q: "Why can't I see some registers when mapping users?",
    a: "Registers that already have enrollment dates set can't be selected again, so they are hidden from that list.",
  },
  {
    q: "Why can't I create a register for boundaries that already have one?",
    a: "Each set of boundaries can only have one register. To change it, edit the existing register, or delete it in Manage Registers and create a new one.",
  },
];

function Topic({ topic, open, onToggle }) {
  const id = useId();
  return (
    <li className="border-b border-border last:border-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-1 py-3.5 text-left text-sm font-semibold text-heading hover:text-primary"
        >
          {topic.q}
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div id={id} className="px-1 pb-4 text-sm leading-relaxed text-foreground">
          <p>{topic.a}</p>
          {topic.like && (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-md bg-info px-3 py-2 text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                <span className="font-semibold text-heading">Think of it like</span> {topic.like}
              </span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function HelpDialog({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  // Start fresh each time: no search, first question open.
  useEffect(() => {
    if (open) {
      setQuery("");
      setOpenIndex(0);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = TOPICS.map((t, i) => ({ ...t, i })).filter((t) => !q || `${t.q} ${t.a}`.toLowerCase().includes(q));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden bg-white p-0">
        <div className="border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogTitle className="text-xl font-bold text-heading">How can we help?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">Quick answers to common questions about attendance registers.</DialogDescription>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions"
              aria-label="Search help questions"
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-1">
          {shown.length ? (
            <ul>
              {shown.map((t) => (
                <Topic key={t.q} topic={t} open={q ? true : openIndex === t.i} onToggle={() => setOpenIndex(openIndex === t.i ? -1 : t.i)} />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No questions match “{query.trim()}”.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

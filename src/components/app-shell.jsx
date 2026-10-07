import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronDown, CircleHelp, Copy, FileText, History, House, LayoutGrid, Search } from "lucide-react";
import { HelpDialog } from "@/components/help-dialog";

const RAIL_ICONS = [Search, House, Copy, LayoutGrid, FileText, BookOpen];

function NavRail({ activeIndex = 1 }) {
  return (
    <nav className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border bg-rail py-3">
      {RAIL_ICONS.map((Icon, i) => (
        <button
          key={i}
          aria-label="Navigation item"
          className={`flex size-8 items-center justify-center rounded-sm transition-colors ${
            i === activeIndex ? "bg-primary text-primary-foreground" : "text-heading hover:bg-secondary"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </nav>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {item.to && !last ? (
              <Link to={item.to} className="text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <div className="h-1 w-full bg-accent" />
      <header className="flex h-14 items-center justify-between border-b border-border bg-topbar px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-accent">HCM</div>
          <Link to="/" className="text-[15px] font-bold tracking-tight text-foreground hover:opacity-80">
            DIGIT HCM
          </Link>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <button className="flex items-center gap-1 transition-colors hover:text-foreground">
            City <ChevronDown className="size-3.5" />
          </button>
          <button className="flex items-center gap-1 transition-colors hover:text-foreground">
            English <ChevronDown className="size-3.5" />
          </button>
          <div className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">A</div>
          <span className="text-sm font-semibold text-heading">DIGIT</span>
        </div>
      </header>
      <div className="flex flex-1">
        <NavRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-end gap-4 border-b border-border bg-secondary px-6 py-2.5">
            <button
              onClick={() => setHelpOpen(true)}
              aria-haspopup="dialog"
              className="flex items-center gap-1.5 text-sm font-medium text-primary underline hover:no-underline"
            >
              <CircleHelp className="size-4.5" /> Help
            </button>
            <Link
              to="/attendance/audit-log"
              className="flex items-center gap-1.5 rounded-md border border-primary bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary/50"
            >
              <History className="size-4" /> Audit Log
            </Link>
          </div>
          {children}
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

/** Fixed bottom action bar used on every flow step. */
export function FlowFooter({ children, className = "border-t border-border bg-card px-6 py-4" }) {
  return (
    <footer className={`fixed bottom-0 left-11 right-0 z-30 ${className}`}>
      <div className="flex w-full items-center justify-between">{children}</div>
    </footer>
  );
}

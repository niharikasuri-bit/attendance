import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Lock } from "lucide-react";
import { AppShell, Breadcrumb, FlowFooter } from "@/components/app-shell";
import { COLUMN_TONES, SheetTable } from "@/components/upload-instructions";
import { backButtonClass, primaryButtonClass } from "@/components/flow-controls";

const LEGEND = ["auto", "required", "optional"];

/**
 * Review step before generating a template: a preview of the template with its columns
 * colour-coded as auto-filled, required or optional.
 *
 * `templateName`: e.g. "Attendance Register Template".
 * `prefilled`: column labels the template fills in from the user's selections.
 */
export function TemplateReview({ crumb, templateName, workbook, guide, groups, backTo, generateTo, prefilled = [] }) {
  const navigate = useNavigate();
  const sheets = workbook.sheets.filter((s) => !s.guide);
  const [active, setActive] = useState(0);
  const sheet = sheets[active];

  // Colour-code each column of a fillable sheet; reference sheets stay neutral.
  const toneFor = (column) => {
    if (!sheet || sheet.reference) return null;
    const group = groups.find((g) => g.pattern.test(column.label));
    const label = group ? group.label : column.label;
    const info = group ?? guide[label] ?? {};
    const required = group?.requiredColumns ? group.requiredColumns.includes(column.label) : !!info.required;
    const tone = prefilled.includes(label) ? "auto" : required ? "required" : "optional";
    const format = column.label === "Register ID" ? "BILL XXXXXXXX" : undefined;
    return { tone, format, help: tone === "auto" ? "Filled in from your selections." : info.help };
  };

  // Which colours appear on the sheet being shown (the legend lists only those).
  const counts = (sheet?.columns ?? []).filter((c) => !c.hidden).reduce((acc, c) => {
    const tone = toneFor(c)?.tone;
    return tone ? { ...acc, [tone]: (acc[tone] ?? 0) + 1 } : acc;
  }, {});

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-28 pt-4">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Attendance Setup & Management", to: "/attendance" },
            { label: crumb, to: backTo },
            { label: "Template Preview" },
          ]}
        />
        <h1 className="mt-3 font-condensed text-3xl font-bold text-heading">Preview Your {templateName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is a preview of your template. It includes columns we've filled in for you, columns you need to complete, and columns that are optional.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 rounded-md bg-chip px-3 py-2" role="note">
            <Lock className="size-4 shrink-0 text-heading" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-heading">Read-only preview</p>
              <p className="text-xs text-muted-foreground">You can edit the file in Excel after you generate and download it.</p>
            </div>
          </div>
          <ul
            className="inline-flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-md border border-border bg-info-bg px-3 py-2"
            aria-label="Column colours"
          >
            {LEGEND.filter((tone) => counts[tone]).map((tone) => (
              <li key={tone} className="flex items-center gap-2 text-sm font-medium text-heading">
                <span className={`size-3 rounded-sm ${COLUMN_TONES[tone].swatch}`} aria-hidden="true" />
                {COLUMN_TONES[tone].label}
              </li>
            ))}
          </ul>
        </div>

        {/* The preview itself, styled like the Excel file. */}
        <section aria-label="Template preview" className="mt-3 overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <div className="max-h-[420px] overflow-auto bg-card">{sheet && <SheetTable sheet={sheet} toneFor={toneFor} minRows={8} />}</div>
          {sheets.length > 1 && (
            <div role="tablist" aria-label="Sheets" className="flex flex-wrap gap-1 border-t border-border bg-muted px-3 py-2">
              {sheets.map((s, i) => (
                <button
                  key={s.name}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    i === active ? "border-primary bg-card text-primary" : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </section>
        <p className="mt-2 text-xs text-muted-foreground">Hover a column header to see what goes in it.</p>
      </main>

      <FlowFooter>
        <Link to={backTo} className={backButtonClass}>
          <ChevronLeft className="size-4" /> Back
        </Link>
        <button onClick={() => navigate(generateTo)} className={primaryButtonClass}>
          Generate Template
        </button>
      </FlowFooter>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Download, Eye, FilePenLine, Info, Loader2, Upload, ClipboardPen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cellValue, columnLetter, downloadWorkbook, formatCell } from "@/lib/templates";

const MIN_PREVIEW_ROWS = 12;

const CHANGES_NOTE = {
  title: "Need to make changes?",
  text: "Download the template, edit it in Excel, then upload the updated file on this page.",
};

/** Info box in the preview: what to do with the generated file. */
function PreviewNote({ title, text }) {
  return (
    <div role="note" className="mx-6 my-3 flex items-start gap-2.5 rounded-md border border-info-foreground/20 bg-info px-4 py-3 text-sm text-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-info-foreground" aria-hidden="true" />
      <div>
        <p className="font-semibold text-heading">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// Header colours for colour-coded column types (see SheetTable `toneFor`).
export const COLUMN_TONES = {
  auto: { label: "Auto-filled", header: "bg-green-50 text-green-900", bar: "var(--color-green-600)", swatch: "bg-green-600" },
  required: { label: "Required to be filled", header: "bg-amber-50 text-amber-900", bar: "var(--color-amber-500)", swatch: "bg-amber-500" },
  optional: { label: "Optional", header: "bg-muted text-muted-foreground", bar: "var(--color-gray-300)", swatch: "bg-gray-300" },
};

/**
 * One sheet of a workbook definition as a spreadsheet: column letters, header labels,
 * rows (numbered from 3, as in Excel) and some blank rows. `toneFor(column)` may return
 * { tone: "auto" | "required" | "optional", help } to colour-code that column's header.
 */
export function SheetTable({ sheet, toneFor, minRows = MIN_PREVIEW_ROWS }) {
  const columns = sheet.columns.map((c, index) => ({ ...c, index, ...(toneFor?.(c) ?? {}) })).filter((c) => !c.hidden);
  const rows = sheet.rows;
  const blankRows = Math.max(minRows - rows.length, 3);
  return (
    <table className="min-w-full border-separate border-spacing-0 text-xs text-foreground">
      <thead className="sticky top-0 z-20">
        <tr>
          <th className="sticky left-0 z-30 w-10 min-w-10 border-b border-r border-border bg-muted" />
          {columns.map((c) => (
            <th
              key={c.code}
              style={c.tone ? { boxShadow: `inset 0 3px 0 ${COLUMN_TONES[c.tone].bar}` } : undefined}
              className="border-b border-r border-border bg-muted px-2 py-1 text-center font-medium text-muted-foreground"
            >
              {columnLetter(c.index)}
            </th>
          ))}
          <th className="w-full border-b border-border bg-muted" />
        </tr>
        <tr>
          <th className="sticky left-0 z-30 border-b border-r border-border bg-muted px-2 py-1.5 text-center font-medium text-muted-foreground">2</th>
          {columns.map((c) => (
            <th
              key={c.code}
              title={c.help ? `${COLUMN_TONES[c.tone]?.label ?? ""}: ${c.help}` : undefined}
              style={{ minWidth: c.wrap ? 560 : Math.min(c.width ?? 20, 32) * 6 }}
              className={`border-b-2 border-r border-b-muted-foreground/40 border-r-border px-2 py-1.5 text-left align-top font-bold ${
                c.tone ? COLUMN_TONES[c.tone].header : "bg-selected-bg text-heading"
              } ${c.wrap ? "whitespace-pre-wrap font-normal leading-relaxed" : "whitespace-nowrap"}`}
            >
              {c.label}
              {c.format && <span className="font-normal text-muted-foreground"> ({c.format})</span>}
              {c.tone && <span className="sr-only"> ({COLUMN_TONES[c.tone].label})</span>}
            </th>
          ))}
          <th className="border-b-2 border-b-muted-foreground/40 bg-card" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            <td className="sticky left-0 z-10 border-b border-r border-border bg-muted px-2 py-1.5 text-center text-muted-foreground">{ri + 3}</td>
            {columns.map((c) => {
              const cell = row[c.index] ?? null;
              const numeric = typeof cellValue(cell) === "number";
              return (
                <td key={c.code} className={`whitespace-nowrap border-b border-r border-border px-2 py-1.5 ${numeric ? "text-right tabular-nums" : ""}`}>
                  {formatCell(cell)}
                </td>
              );
            })}
            <td className="border-b border-border" />
          </tr>
        ))}
        {Array.from({ length: blankRows }, (_, i) => (
          <tr key={`blank-${i}`}>
            <td className="sticky left-0 z-10 border-b border-r border-border bg-muted px-2 py-1.5 text-center text-muted-foreground">
              {rows.length + i + 3}
            </td>
            {columns.map((c) => (
              <td key={c.code} className="border-b border-r border-border px-2 py-1.5">
                {" "}
              </td>
            ))}
            <td className="border-b border-border" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Read-only, spreadsheet-style preview of a generated workbook definition.
 * With `onConfirm`, Upload (primary) hands the generated file to the uploader; without it,
 * the file has to be filled in first, so Download is the only action. `note`: { title, text }.
 */
export function TemplatePreviewDialog({ workbook, title, onClose, onConfirm, summary = [], note = CHANGES_NOTE }) {
  const [active, setActive] = useState(0);
  const [confirming, setConfirming] = useState(false);
  // Instruction tabs stay in the downloaded file but aren't part of the register preview.
  const sheets = workbook ? workbook.sheets.filter((s) => !s.guide) : [];
  const [error, setError] = useState(null);

  useEffect(() => {
    setActive(Math.max(0, sheets.findIndex((s) => s.rows.length)));
    setError(null);
  }, [workbook]);

  const confirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      await onConfirm(workbook);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const sheet = sheets[active];

  return (
    <Dialog open={!!workbook} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-[min(72rem,calc(100vw-3rem))] flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-border px-6 py-4 pr-12">
          <DialogTitle className="text-xl font-bold text-heading">{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-sm bg-green-700 text-[8px] font-bold text-white">.xlsx</span>
            <span className="font-bold text-heading">{workbook?.fileName}</span>
            {summary.length > 0
              ? summary.map((item) => (
                  <span key={item} className="rounded-xs bg-chip px-2 py-0.5 text-[11px] font-semibold text-heading">
                    {item}
                  </span>
                ))
              : <span>· Preview of the generated template with sample data.</span>}
          </DialogDescription>
        </DialogHeader>

        <PreviewNote title={note.title} text={note.text} />

        {sheet && (
          <div className="min-h-0 flex-1 overflow-auto bg-card">
            <SheetTable sheet={sheet} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted px-4 py-2">
          <div role="tablist" aria-label="Sheets" className="flex flex-wrap items-center gap-1">
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
          {onConfirm ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={() => workbook && void downloadWorkbook(workbook)}
                className="flex items-center gap-2 rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <Download className="size-4" /> Download Generated Template
              </button>
              <button
                onClick={() => void confirm()}
                disabled={confirming}
                className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
              >
                {confirming ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {confirming ? "Preparing…" : "Upload Generated Template"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => workbook && void downloadWorkbook(workbook)}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
              >
                <Download className="size-4" /> Download Generated Template
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// `fill`: the template must be filled in before upload (e.g. user mapping), not just reviewed.
const uploadSteps = (resultHint, fill) => [
  { icon: Eye, title: "Review the generated template", text: <>Select <strong className="font-semibold">View Generated Template</strong> to check what's already filled in.</> },
  fill
    ? {
        icon: ClipboardPen,
        title: "Add required details",
        text: <>Select <strong className="font-semibold">Download Generated Template</strong> and fill in the required details for each user in Excel. Keep the column headers and the .xlsx format.</>,
      }
    : {
        icon: FilePenLine,
        title: "Make changes if needed",
        text: <>Select <strong className="font-semibold">Download Generated Template</strong> and edit it in Excel. Keep the column headers and the .xlsx format.</>,
      },
  {
    icon: Upload,
    title: "Upload and confirm",
    text: (
      <>
        {fill ? "Add the filled file below" : "Add the generated or edited file below"}, check {resultHint}, then select <strong className="font-semibold">Confirm Upload</strong>.
      </>
    ),
  },
];

/** "How to proceed with upload": three step cards joined by arrows, above the upload area. */
export function NextStepNote({ resultHint = "the result shown", fill = false }) {
  return (
    <section aria-labelledby="upload-steps-title" className="mt-4 rounded-lg border border-border bg-card px-4 py-3">
      <h2 id="upload-steps-title" className="text-base font-bold text-heading">
        How to proceed with upload?
      </h2>
      <ol className="mt-2 flex flex-col items-stretch gap-1 md:flex-row md:items-center">
        {uploadSteps(resultHint, fill).map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="contents">
            {i > 0 && (
              <span className="flex shrink-0 items-center justify-center text-muted-foreground/60" aria-hidden="true">
                <ArrowRight className="hidden size-3.5 md:block" />
                <ArrowDown className="size-3.5 md:hidden" />
              </span>
            )}
            <div className="flex flex-1 items-start gap-2 self-stretch rounded-md border border-border bg-info-bg px-3 py-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-heading">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </span>
                <span className="block text-xs leading-snug text-muted-foreground">{text}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

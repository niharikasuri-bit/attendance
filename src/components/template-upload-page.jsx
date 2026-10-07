import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CircleAlert, CircleCheck, Download, Eye, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { AppShell, Breadcrumb, FlowFooter } from "@/components/app-shell";
import { NextStepNote, TemplatePreviewDialog } from "@/components/upload-instructions";
import { backButtonClass } from "@/components/flow-controls";
import { downloadFile, workbookFile } from "@/lib/templates";

const outlineSmall =
  "flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary bg-white px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5";

const outlineHeaderButton =
  "flex items-center gap-2 whitespace-nowrap rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5";
const solidHeaderButton =
  "flex items-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95";

// File-check result: a full-width box with a coloured left bar.
const CHECK_STYLES = {
  checking: "border-border border-l-muted-foreground/40 bg-muted font-medium text-muted-foreground",
  ready: "border-green-700/60 border-l-green-700 bg-green-50 text-green-800",
  error: "border-red-600/50 border-l-red-600 bg-red-50 text-red-700",
};

function FileBadge() {
  return <div className="flex size-8 items-center justify-center rounded-sm bg-green-700 text-[9px] font-bold text-white">.xlsx</div>;
}

/**
 * Shared "download template → fill → upload" step, used for both the register template
 * and the user mapping template.
 *
 * - `confirmFromPreview`: the preview's Upload puts the generated file in the uploader, ready to confirm.
 * - `check(file)` validates a file without saving; `describeCheck(result)` turns it into the line shown in the uploader.
 * - `resultHint`: what that line tells the user, used in the "Upload and confirm" step.
 * - `previewSummary`: short chips shown under the preview title.
 * - `generatedModal.viewLabel` set: the "generated" popup has just one CTA that opens the preview.
 */
export function TemplateUploadPage({
  title,
  previewTitle,
  confirmFromPreview = false,
  previewSummary,
  previewNote,
  buildTemplate,
  downloadTemplate,
  upload,
  check,
  describeCheck,
  resultHint,
  onUploaded,
  backTo,
  showGeneratedModal,
  generatedModal,
  success,
  successFooter,
}) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  // { status: "checking" | "ready" | "error", message }
  const [checkState, setCheckState] = useState(null);

  const pickFile = (f) => {
    setFile(f);
    setError(null);
  };

  // Check each new file as soon as it lands in the uploader, so problems show before confirming.
  useEffect(() => {
    if (!file || !check) return setCheckState(null);
    let cancelled = false;
    setCheckState({ status: "checking" });
    check(file).then(
      (result) => !cancelled && setCheckState({ status: "ready", message: describeCheck(result) }),
      (e) => !cancelled && setCheckState({ status: "error", message: e instanceof Error ? e.message : "This file couldn't be checked." }),
    );
    return () => {
      cancelled = true;
    };
  }, [file]);

  const finishUpload = async (f) => {
    await upload(f);
    setDone(true);
    onUploaded?.();
  };

  // From the preview: put the generated workbook in the uploader, then confirm as usual.
  const useGeneratedFile = async (workbook) => {
    pickFile(await workbookFile(workbook));
    setPreview(null);
  };

  const confirmUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await finishUpload(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragging(true);
    else if (e.type === "dragleave") setDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
  };

  const onInput = (e) => {
    if (e.target.files?.[0]) pickFile(e.target.files[0]);
  };

  const reset = () => {
    setDone(false);
    setFile(null);
  };

  return (
    <AppShell>
      <main className="min-w-0 flex-1 bg-muted/40 px-6 pb-28 pt-4">
        <div className="w-full">
          <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Attendance Setup & Management", to: "/attendance" }, { label: title }]} />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {!done && <h1 className="font-condensed text-3xl font-bold text-heading">{title}</h1>}
            {!done && (
              // The primary action sits on the right. When the generated file can be uploaded
              // from the preview, viewing it is the primary action; otherwise downloading is.
              <div className="flex items-center gap-3">
                {confirmFromPreview ? (
                  <>
                    <button onClick={() => void downloadTemplate()} className={outlineHeaderButton}>
                      <Download className="size-4" /> Download Generated Template
                    </button>
                    <button onClick={() => setPreview(buildTemplate())} className={solidHeaderButton}>
                      <Eye className="size-4" /> View Generated Template
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setPreview(buildTemplate())} className={outlineHeaderButton}>
                      <Eye className="size-4" /> View Generated Template
                    </button>
                    <button onClick={() => void downloadTemplate()} className={solidHeaderButton}>
                      <Download className="size-4" /> Download Generated Template
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!done && <NextStepNote resultHint={resultHint} fill={!confirmFromPreview} />}

          {done ? (
            <div className={success.cardClass}>
              {success.header}
              <div className="border-t border-border p-6">
                <p className="text-base leading-relaxed text-foreground">{success.message}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileBadge />
                    <span className="truncate text-sm font-bold text-heading">{file?.name}</span>
                  </div>
                  <button onClick={() => file && downloadFile(file)} className={outlineSmall}>
                    <Download className="size-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
          ) : file ? (
            <div className="relative mt-6 rounded-lg bg-card p-4 shadow-sm">
              <button
                onClick={() => pickFile(null)}
                aria-label="Remove file"
                className="absolute right-3 top-3 text-heading transition-colors hover:text-destructive"
              >
                <X className="size-4" />
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileBadge />
                  <span className="truncate text-sm font-bold text-heading">{file.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`${outlineSmall} cursor-pointer`}>
                    <Upload className="size-3.5" /> Re-Upload
                    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onInput} />
                  </label>
                  <button onClick={() => downloadFile(file)} className={outlineSmall}>
                    <Download className="size-3.5" /> Download
                  </button>
                </div>
              </div>
              {checkState && (
                <p
                  role="status"
                  className={`mt-3 flex items-center gap-2 rounded-lg border border-l-4 px-4 py-2.5 text-sm font-semibold ${CHECK_STYLES[checkState.status]}`}
                >
                  {checkState.status === "checking" && <Loader2 className="size-4 animate-spin" />}
                  {checkState.status === "ready" && <CircleCheck className="size-4" />}
                  {checkState.status === "error" && <CircleAlert className="size-4" />}
                  {checkState.status === "checking" ? "Checking file…" : checkState.message}
                </p>
              )}
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div
              className={`mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card px-6 py-14 text-center transition-colors ${
                dragging ? "border-primary bg-primary/[0.03]" : "border-border"
              }`}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Drag and drop your filled excel sheet or{" "}
                <label className="cursor-pointer font-medium text-primary hover:underline">
                  browse in my files
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onInput} />
                </label>
              </p>
            </div>
          )}
        </div>
      </main>

      <FlowFooter>
        {done ? (
          <>
            <button onClick={reset} className={backButtonClass}>
              <RotateCcw className="size-4" /> {successFooter.againLabel}
            </button>
            <Link
              to={successFooter.nextTo}
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
            >
              {successFooter.nextLabel}
            </Link>
          </>
        ) : (
          <>
            <Link to={backTo} className={backButtonClass}>
              <ChevronLeft className="size-4" /> Back
            </Link>
            <button
              disabled={!file || uploading || (check && checkState?.status !== "ready")}
              onClick={() => void confirmUpload()}
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="size-4" /> Confirm Upload
            </button>
          </>
        )}
      </FlowFooter>

      {showGeneratedModal && modalOpen && !done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setModalOpen(false)}>
          <div
            className={`w-full ${generatedModal.viewLabel ? "max-w-md" : "max-w-xl"} overflow-hidden rounded-xl bg-card shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pb-1 pt-8 text-center">
              <div className="success-pop mx-auto flex size-14 items-center justify-center rounded-full bg-green-700 ring-8 ring-green-100">
                <svg viewBox="0 0 24 24" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path className="success-check" d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className={`mt-5 font-condensed font-bold text-heading ${generatedModal.viewLabel ? "text-xl" : "text-2xl"}`}>
                {generatedModal.title}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-center text-sm leading-relaxed text-muted-foreground">{generatedModal.message}</p>
              {generatedModal.summary?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {generatedModal.summary.map((item) => (
                    <span key={item} className="rounded-xs bg-chip px-2 py-1 text-xs font-semibold text-heading">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {generatedModal.viewLabel ? (
                <button
                  autoFocus
                  onClick={() => {
                    setModalOpen(false);
                    setPreview(buildTemplate());
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Eye className="size-4" /> {generatedModal.viewLabel}
                </button>
              ) : (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setPreview(buildTemplate());
                    }}
                    className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    <Eye className="size-4" /> View Generated Template
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      downloadTemplate();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
                  >
                    <Download className="size-4" /> Download Generated Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TemplatePreviewDialog
        workbook={preview}
        title={previewTitle}
        summary={previewSummary}
        note={previewNote}
        onClose={() => setPreview(null)}
        onConfirm={confirmFromPreview ? useGeneratedFile : undefined}
      />
    </AppShell>
  );
}

import { useMemo } from "react";
import { CircleCheck } from "lucide-react";
import { TemplateUploadPage } from "@/components/template-upload-page";
import { useAttendanceStore } from "@/lib/attendance-store";
import { buildRegisterTemplate, checkRegisterTemplate, downloadRegisterTemplate, uploadRegisterTemplate } from "@/lib/templates";
import { REGISTER_GENERATED_KEY } from "./attendance-home";

const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

/** "3 registers uploaded" */
function describeRegisterCheck({ created, updated }) {
  return `${plural(created + updated, "register")} uploaded`;
}

export default function UploadRegisters() {
  const { templateLevels, templateFrequency } = useAttendanceStore();
  const frequency = templateFrequency ?? "Once a day";
  const registerCount = useMemo(() => buildRegisterTemplate().sheets.find((s) => !s.guide && !s.reference)?.rows.length ?? 0, [templateFrequency]);
  const summary = [plural(registerCount, "register"), ...(templateLevels.length ? [templateLevels.join(", ")] : []), frequency];

  return (
    <TemplateUploadPage
      title="Upload Populated Register Template"
      previewTitle="Generated Attendance Register Template"
      confirmFromPreview
      previewSummary={summary}
      buildTemplate={buildRegisterTemplate}
      downloadTemplate={downloadRegisterTemplate}
      upload={uploadRegisterTemplate}
      check={checkRegisterTemplate}
      describeCheck={describeRegisterCheck}
      resultHint="how many registers are uploaded"
      onUploaded={() => {
        try {
          localStorage.setItem(REGISTER_GENERATED_KEY, "true");
        } catch {
          // ignore
        }
      }}
      backTo="/attendance/register-summary"
      showGeneratedModal
      generatedModal={{
        title: "Attendance Register Template Generated",
        message: "Your attendance register is ready. Review it, then upload it, or download it if you need to make changes.",
      }}
      success={{
        cardClass: "mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        header: (
          <div className="bg-success px-8 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-foreground/20">
              <CircleCheck className="size-7 text-success-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-condensed text-3xl font-bold text-success-foreground">Attendance Registers Added Successfully!</h2>
          </div>
        ),
        message: (
          <>
            The populated register template you uploaded has been added successfully. Download a copy now, and manage it anytime from <strong className="font-semibold">Manage Registers</strong>.
          </>
        ),
      }}
      successFooter={{ againLabel: "Create Another Register", nextLabel: "Map Users to Register", nextTo: "/attendance/map-template?preselect=latest" }}
    />
  );
}

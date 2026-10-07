import { CircleCheck } from "lucide-react";
import { TemplateUploadPage } from "@/components/template-upload-page";
import { useAttendanceStore } from "@/lib/attendance-store";
import { buildUserMappingTemplate, checkUserMappingTemplate, downloadUserMappingTemplate, uploadUserMappingTemplate } from "@/lib/templates";

const SAME_DATE = "Same date for all users";

const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

const enrollmentText = (o) => (o?.enrollment === SAME_DATE ? `${formatDate(o.enrollmentDate)} for all` : "Per user");

/** "15 users mapped to 3 registers", plus any rows that were skipped. */
function describeMappingCheck({ users, registers, skipped }) {
  const main = `${plural(users, "user")} mapped to ${plural(registers, "register")}`;
  return skipped ? `${main} · ${plural(skipped, "row")} skipped (no name or unknown Register ID)` : main;
}

export default function UploadMapping() {
  const { mappingIds, mappingOptions } = useAttendanceStore();
  const registerCount = mappingIds.length;

  return (
    <TemplateUploadPage
      title="Upload Populated User Mapping Template"
      previewTitle="Generated User Mapping Template"
      previewNote={{
        title: "Info",
        text: "Download the template, fill in the required details for each user in Excel, then upload the filled file on this page.",
      }}
      previewSummary={[plural(registerCount, "register"), `Enrollment: ${enrollmentText(mappingOptions)}`]}
      buildTemplate={buildUserMappingTemplate}
      downloadTemplate={downloadUserMappingTemplate}
      upload={uploadUserMappingTemplate}
      check={checkUserMappingTemplate}
      describeCheck={describeMappingCheck}
      resultHint="how many users are mapped"
      backTo="/attendance/map-summary"
      showGeneratedModal
      generatedModal={{
        title: "User Mapping Template Generated",
        message: "Your user mapping template is ready. Review it, then download it and add your users' details before uploading.",
      }}
      success={{
        cardClass: "mt-6 overflow-hidden rounded-lg bg-card shadow-sm",
        header: (
          <div className="bg-green-700 px-8 py-16 text-center">
            <CircleCheck className="mx-auto size-12 text-white" strokeWidth={1.5} />
            <h2 className="mt-4 font-condensed text-3xl font-bold text-white">Users Mapped Successfully!</h2>
          </div>
        ),
        message: (
          <>
            The populated user mapping template you uploaded has been added successfully. Download a copy now, and manage it anytime from <strong className="font-semibold">Manage Registers</strong>.
          </>
        ),
      }}
      successFooter={{ againLabel: "Map More Users", nextLabel: "Go to Manage Registers", nextTo: "/attendance/registers" }}
    />
  );
}

import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { TemplateReview } from "@/components/template-review";
import { useAttendanceStore } from "@/lib/attendance-store";
import { REGISTER_COLUMN_GROUPS, REGISTER_COLUMN_GUIDE, buildRegisterTemplate } from "@/lib/templates";

export default function RegisterSummary() {
  const store = useAttendanceStore();
  const workbook = useMemo(() => buildRegisterTemplate(), [store.templateFrequency, store.templateLevels]);

  // Nothing chosen yet (e.g. opened directly): start the customize steps.
  if (!store.templateLevels.length || !store.templateFrequency) return <Navigate to="/attendance/customize" replace />;

  return (
    <TemplateReview
      crumb="Customize your Attendance Register Template"
      templateName="Attendance Register Template"
      backTo="/attendance/customize?step=1"
      generateTo="/attendance/upload"
      workbook={workbook}
      guide={REGISTER_COLUMN_GUIDE}
      groups={REGISTER_COLUMN_GROUPS}
      prefilled={["Register ID", "Sessions"]}
    />
  );
}

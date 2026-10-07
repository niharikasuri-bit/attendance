import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { TemplateReview } from "@/components/template-review";
import { getRegisters, useAttendanceStore } from "@/lib/attendance-store";
import { USER_COLUMN_GROUPS, USER_COLUMN_GUIDE, buildUserMappingTemplate } from "@/lib/templates";

const SAME_DATE = "Same date for all users";

export default function MapSummary() {
  const store = useAttendanceStore();
  const registers = useMemo(() => getRegisters(store).filter((r) => store.mappingIds.includes(r.id)), [store]);
  const options = store.mappingOptions;
  const workbook = useMemo(() => buildUserMappingTemplate(), [store.mappingIds, options]);

  // Nothing chosen yet (e.g. opened directly): start the stepper.
  if (!registers.length || !options) return <Navigate to="/attendance/map-template" replace />;

  return (
    <TemplateReview
      crumb="Customize your User Mapping Template"
      templateName="User Mapping Template"
      backTo="/attendance/map-template?step=1"
      generateTo="/attendance/upload-mapping"
      workbook={workbook}
      guide={USER_COLUMN_GUIDE}
      groups={USER_COLUMN_GROUPS}
      prefilled={["Register ID", "Boundary", ...(options.enrollment === SAME_DATE ? ["Enrollment Date"] : [])]}
    />
  );
}

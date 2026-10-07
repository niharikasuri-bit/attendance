import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import CampaignSetup from "./routes/campaign-setup";
import AttendanceHome from "./routes/attendance-home";
import CustomizeTemplate from "./routes/customize-template";
import RegisterSummary from "./routes/register-summary";
import UploadRegisters from "./routes/upload-registers";
import MapTemplate from "./routes/map-template";
import MapSummary from "./routes/map-summary";
import UploadMapping from "./routes/upload-mapping";
import ManageRegisters from "./routes/manage-registers";
import ViewRegister from "./routes/view-register";
import AuditLog from "./routes/audit-log";

const TITLES = {
  "/": "Campaign Setup",
  "/attendance": "Attendance Setup & Management",
  "/attendance/customize": "Customize Attendance Register Template",
  "/attendance/register-summary": "Preview Your Attendance Register Template",
  "/attendance/upload": "Upload Populated Register Template",
  "/attendance/map-template": "Customize User Mapping Template",
  "/attendance/map-summary": "Preview Your User Mapping Template",
  "/attendance/upload-mapping": "Upload Populated User Mapping Template",
  "/attendance/registers": "Manage Registers",
  "/attendance/audit-log": "Attendance Audit Log",
};

function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    const title = TITLES[path] ?? (path.startsWith("/attendance/registers/") ? "View Register" : null);
    document.title = title ? `${title} | DIGIT HCM` : "DIGIT HCM";
    window.scrollTo(0, 0);
  }, [pathname]);
}

// Register selection now lives in the first step of the user mapping template.
function MapUsersRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/attendance/map-template${search}`} replace />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useDocumentTitle();
  return (
    <Routes>
      <Route path="/" element={<CampaignSetup />} />
      <Route path="/attendance" element={<AttendanceHome />} />
      <Route path="/attendance/new-register" element={<Navigate to="/attendance/customize" replace />} />
      <Route path="/attendance/customize" element={<CustomizeTemplate />} />
      <Route path="/attendance/register-summary" element={<RegisterSummary />} />
      <Route path="/attendance/upload" element={<UploadRegisters />} />
      <Route path="/attendance/map-users" element={<MapUsersRedirect />} />
      <Route path="/attendance/map-template" element={<MapTemplate />} />
      <Route path="/attendance/map-summary" element={<MapSummary />} />
      <Route path="/attendance/upload-mapping" element={<UploadMapping />} />
      <Route path="/attendance/registers" element={<ManageRegisters />} />
      <Route path="/attendance/registers/:registerId" element={<ViewRegister />} />
      <Route path="/attendance/audit-log" element={<AuditLog />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

# Attendance Bulk Register (DIGIT HCM)

Local, editable copy of https://attendance-bulk-register.vercel.app: the campaign setup page plus the full
attendance register flow (generate template → upload registers → map users → manage / view registers → audit log).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Stack

React 19 · Vite · Tailwind CSS v4 · React Router · Radix UI (dialog, alert dialog, dropdown) · lucide-react ·
`write-excel-file` / `read-excel-file` / `fflate` for the real `.xlsx` templates.

## Structure

| Path | What it is |
| --- | --- |
| `src/styles.css` | Theme tokens (orange primary, navy headings, Roboto / Roboto Condensed) |
| `src/lib/attendance-store.js` | Prototype data (seed registers, users, audit log), persisted to `localStorage` |
| `src/lib/templates.js` | Excel template generation, upload parsing, register exports |
| `src/components/` | App shell, template preview dialog, shared upload page, filters, form controls |
| `src/routes/` | One file per screen |

## Routes

| URL | Screen |
| --- | --- |
| `/` | Campaign Setup |
| `/attendance` | First-time users: empty state with intro modal. Returning users are sent to `/attendance/registers`. |
| `/attendance/customize` | Customize Register Template (boundary levels → frequency) |
| `/attendance/register-summary` | Review Attendance Register Template (selections + template columns) |
| `/attendance/upload` | Upload Populated Register Template |
| `/attendance/map-template` | Customize User Mapping Template (registers → enrollment date) |
| `/attendance/map-summary` | Review User Mapping Template (selections + template columns) |
| `/attendance/upload-mapping` | Upload Populated User Mapping Template |
| `/attendance/registers` | Manage Registers: the main screen for returning users (search + filters, users / active users, bulk map users, download, delete; Create New Register and Map Users to Registers actions) |
| `/attendance/registers/:id` | View Register |
| `/attendance/audit-log` | Audit Log |

## Reset the prototype

Clear the `attendancePrototypeData` and `attendanceRegisterGenerated` keys from localStorage
(DevTools → Application → Local Storage), then reload.

## Differences from the deployed original

- React Router instead of TanStack Start (same URLs and query params).
- PostHog analytics removed.

import { Link } from "react-router-dom";
import { CircleHelp, ClipboardList, CloudUpload, Fingerprint, ListChecks, MapPinned, PackagePlus, Pencil } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/app-shell";

const DELIVERY_COPY =
  "Add key details about how the resources will be delivered. This includes setting the delivery dates, the number of cycles and rounds, and any rules or conditions that need to be followed. These settings help make sure the campaign runs smoothly and reaches the right people at the right time.";

const TASKS = [
  {
    icon: MapPinned,
    title: "Select your Boundaries for the campaign",
    description:
      "Select the boundaries where you want to run the campaign. The areas you choose will determine where facilities and resources are allocated and how the campaign activities are planned.",
    action: "Select Boundaries",
  },
  { icon: PackagePlus, title: "Define your Delivery Strategy", description: DELIVERY_COPY, action: "Start Planning Deliveries" },
  {
    icon: ClipboardList,
    title: "Setup your mobile app",
    description: "Configure your mobile app to fit campaign needs. Create and manage forms, customize the interface, choose features and adjust key settings.",
    action: "Setup your App",
  },
  { icon: CloudUpload, title: "Upload Data", description: DELIVERY_COPY, action: "Upload Data" },
  {
    icon: Fingerprint,
    title: "Configure Attendance",
    description: "Set up attendance for your campaign by marking non-working days, selecting how attendance will be captured, and creating registers to map users.",
    action: "Setup Attendance",
    to: "/attendance",
  },
  { icon: ListChecks, title: "Define Checklists", description: DELIVERY_COPY, action: "Define Checklists", disabled: true },
];

export default function CampaignSetup() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 px-6 pb-12 pt-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between text-xs">
            <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Module selection" }]} />
            <button className="flex items-center gap-1 text-primary hover:underline">
              Help <CircleHelp className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
                Campaign Name 1
                <Pencil className="size-4 text-primary" />
              </h1>
              <p className="mt-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                21 August - 30 August, 2025
                <Pencil className="size-3 text-primary" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm border border-primary/60 bg-primary/5 px-3 py-1.5 text-xs text-primary">Seasonal Malaria Chemoprevention (SMC)</span>
              <span className="rounded-sm border border-border bg-card px-3 py-1.5 text-xs text-heading">Multiround</span>
            </div>
          </div>

          <p className="mt-4 max-w-4xl text-xs leading-relaxed text-muted-foreground">
            Complete the tasks below one by one to set up your campaign. Your progress will be saved as a draft until you click <strong className="font-semibold">Create Campaign</strong>. You can
            edit these details anytime before the campaign begins.
          </p>

          <div className="mt-5 space-y-3">
            {TASKS.map((task) => {
              const buttonClass = `w-[190px] shrink-0 rounded-sm px-4 py-2 text-center text-xs font-medium transition-colors ${
                task.disabled ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:brightness-95"
              }`;
              return (
                <section key={task.title} className={`rounded-sm border border-border bg-card px-5 py-4 ${task.disabled ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <task.icon className={`size-6 shrink-0 ${task.disabled ? "text-muted-foreground" : "text-primary"}`} strokeWidth={1.75} />
                      <h2 className={`text-base font-bold ${task.disabled ? "text-muted-foreground" : "text-heading"}`}>{task.title}</h2>
                    </div>
                    {task.disabled ? (
                      <button disabled className={buttonClass}>
                        {task.action}
                      </button>
                    ) : task.to ? (
                      <Link to={task.to} className={buttonClass}>
                        {task.action}
                      </Link>
                    ) : (
                      <button className={buttonClass}>{task.action}</button>
                    )}
                  </div>
                  <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted-foreground">{task.description}</p>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

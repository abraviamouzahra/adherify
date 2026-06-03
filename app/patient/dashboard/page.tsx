"DASHBOARD PAGE FOR PATIENT ROLE"
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type ScheduleItem = {
  id: string;
  time?: string;
  dose?: string;
  status?: string;
  instruction?: string;
  medicine?: {
    name?: string;
  };
  medication?: {
    name?: string;
  };
  medicine_name?: string;
  medication_name?: string;
  name?: string;
};

type CurrentUser = {
  id?: string;
  email?: string;
  username?: string;
  full_name?: string;
  patientProfile?: {
    full_name?: string;
    age?: number;
    main_disease?: string;
    whatsapp_number?: string;
  };
};

const TODAY_SCHEDULES_ENDPOINT = "/patient/schedules/today";

function getMedicineName(item?: ScheduleItem) {
  if (!item) return "-";

  return (
    item.medicine?.name ||
    item.medication?.name ||
    item.medicine_name ||
    item.medication_name ||
    item.name ||
    "-"
  );
}

function normalizeStatus(status?: string) {
  if (!status) return "UPCOMING";
  return status.toUpperCase();
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "WAITING_VERIFICATION") return "Waiting";
  if (normalized === "SCHEDULED") return "Scheduled";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function statusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "APPROVED" || normalized === "SCHEDULED") {
    return "bg-green-50 text-green-700";
  }

  if (normalized === "PENDING" || normalized === "WAITING_VERIFICATION") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function countByStatus(schedules: ScheduleItem[], target: string) {
  return schedules.filter((item) => normalizeStatus(item.status) === target)
    .length;
}

function DashboardGridIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function UploadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M20 16.5a4 4 0 0 0-4-4h-1.2A6 6 0 0 0 3 14a4 4 0 0 0 4 4h1" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PillIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 20.5 20.5 10.5a5 5 0 0 0-7-7L3.5 13.5a5 5 0 0 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17H9" />
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6c.39-.18.72-.5.9-.9V3a2 2 0 1 1 4 0v.09c.18.4.5.72.9.9.39.18.84.21 1.25.09a1.7 1.7 0 0 0 .67-.42l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.42.67c-.12.41-.09.86.09 1.25.18.4.5.72.9.9H21a2 2 0 1 1 0 4h-.09c-.4.18-.72.5-.9.9Z" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function MinusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

function ChevronLeft({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${active
        ? "bg-slate-50 text-[#0b2740]"
        : "text-slate-500 hover:bg-slate-50 hover:text-[#0b2740]"
        } ${collapsed ? "justify-center" : "gap-4"}`}
      title={collapsed ? label : undefined}
    >
      <span className={`${active ? "text-blue-500" : ""}`}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

function StatCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: number;
  tone: "green" | "red" | "yellow" | "slate";
  icon: React.ReactNode;
}) {
  const toneClass = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-500",
    yellow: "bg-amber-50 text-amber-500",
    slate: "bg-slate-100 text-slate-500",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-[#0b2740]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-500">{icon}</div>
        <div>
          <p className="font-bold text-[#0b2740]">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

export default function PatientDashboardPage() {
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [schedulesFromApi, setSchedulesFromApi] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {

    async function fetchCurrentUser() {
      try {
        const data = await apiFetch("/auth/me", {
          method: "GET",
        });

        setCurrentUser(data?.user || data);
      } catch (err) {
        console.log("Failed to fetch patient profile:", err);
        setCurrentUser(null);
      }
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiFetch(TODAY_SCHEDULES_ENDPOINT, {
          method: "GET",
        });

        const schedules = Array.isArray(data)
          ? data
          : data?.data ||
          data?.schedules ||
          data?.todaySchedules ||
          data?.today_schedules ||
          [];

        setSchedulesFromApi(Array.isArray(schedules) ? schedules : []);
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil jadwal hari ini."
        );
        setSchedulesFromApi([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    fetchDashboardData();
    fetchCurrentUser();
  }, []);

  const schedules = schedulesFromApi;

  const nextMedication = schedules[0];

  const patientName =
    currentUser?.patientProfile?.full_name ||
    currentUser?.full_name ||
    currentUser?.username ||
    currentUser?.email?.split("@")[0] ||
    "Patient";

  const patientInitial =
    patientName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  const approvedCount = useMemo(
    () => countByStatus(schedules, "APPROVED"),
    [schedules]
  );

  const rejectedCount = useMemo(
    () => countByStatus(schedules, "REJECTED"),
    [schedules]
  );

  const waitingCount = useMemo(
    () =>
      countByStatus(schedules, "WAITING_VERIFICATION") +
      countByStatus(schedules, "PENDING"),
    [schedules]
  );

  const missedCount = useMemo(
    () => countByStatus(schedules, "MISSED"),
    [schedules]
  );

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  return (
    <ProtectedPage allowedRole="PATIENT">
      <main className="min-h-screen bg-[#f8fbff] text-[#0b2740]">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`fixed left-0 top-0 z-30 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 xl:block ${sidebarBaseWidthClass}`}
        >
          <div className="relative flex h-full flex-col px-5 py-7">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="absolute -right-4 top-8 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
            >
              {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>

            {/* LOGO AREA - placeholder */}
            <div className={`mb-10 flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3 px-2"}`}>
              <img
                src="/logo-adherify.png"
                alt="Adherify"
                className="h-12 w-auto"
              />
            </div>

            <nav className="space-y-2">
              <NavItem
                icon={<DashboardGridIcon />}
                label="Dashboard"
                active
                collapsed={isSidebarCollapsed}
              />
              <NavItem
                icon={<CalendarIcon />}
                label="Today's Schedules"
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/patient/schedules")}
              />
              <NavItem
                icon={<ClockIcon />}
                label="History"
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/patient/history")}
              />
            </nav>

            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0b2740] ${isSidebarCollapsed ? "justify-center" : "gap-4"
                  }`}
                title={isSidebarCollapsed ? "Log out" : undefined}
              >
                <span className="text-lg">↪</span>
                {!isSidebarCollapsed && <span>Log out</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section
          className={`min-h-screen px-5 pb-24 pt-6 transition-all duration-300 md:px-8 lg:px-10 xl:px-10 xl:pb-10 ${sidebarWidthClass}`}
        >
          <div className="mx-auto max-w-[1180px]">
            {/* HEADER */}
            <header className="mb-8 flex items-center justify-between">
              <div className="xl:hidden">
                {/* MOBILE/TABLET LOGO PLACEHOLDER */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#07324a] text-[#07324a]">
                    ✓
                  </div>
                  <span className="text-2xl font-bold text-[#07324a]">adherify</span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                    {patientInitial}
                  </div>
                  <span className="hidden text-sm font-semibold md:block">
                    {patientName}
                  </span>
                </div>
              </div>
            </header>

            <section className="mb-6">
              <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                Hi, {patientName}
              </h1>
              <p className="mt-2 text-base text-slate-500 md:text-lg">
                Here&apos;s your medication summary for today.
              </p>
            </section>

            {apiError && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                API jadwal belum terbaca: {apiError}.
              </div>
            )}

            {/* TOP GRID */}
            <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
              {/* NEXT MEDICATION */}
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <p className="text-sm font-semibold text-slate-500 md:text-base">
                  Next Medication
                </p>



                <div className="mt-5 grid gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
                  <div>
                    <h2 className="text-[26px] font-bold tracking-tight text-[#0b2740] md:text-[34px]">
                      {getMedicineName(nextMedication)}
                    </h2>

                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-7 w-7 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-500">Next at</p>
                          <p className="text-xl font-bold text-[#0b2740]">
                            {nextMedication?.time || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="hidden h-10 w-px bg-slate-200 md:block" />

                      <div className="flex items-center gap-3">
                        <span className="text-3xl text-slate-500">╫</span>
                        <div>
                          <p className="text-sm text-slate-500">Instruction</p>
                          <p className="text-xl font-bold text-[#0b2740]">
                            {nextMedication?.instruction || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${statusStyle(
                          nextMedication?.status
                        )}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {statusLabel(nextMedication?.status)}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push("/patient/schedules")}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#07324a] px-6 text-sm font-semibold text-white md:w-[280px]"
                    >
                      View today&apos;s schedules <span>›</span>
                    </button>
                  </div>

                  {/* MEDICINE IMAGE */}
                  <div className="hidden lg:flex lg:justify-center">
                    <div className="relative flex h-[230px] w-[260px] items-center justify-center overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-50 via-white to-blue-50">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/70 blur-xl" />
                      <div className="absolute bottom-[-28px] left-8 h-24 w-24 rounded-full bg-cyan-100/70 blur-xl" />

                      <img
                        src="/foto-jam-obat-rmv.png"
                        alt="Medication reminder illustration"
                        className="relative z-10 h-[210px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.14)]"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* LATEST STATUS */}
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <p className="text-sm font-semibold text-slate-500 md:text-base">
                  Latest Status
                </p>

                <div className="mt-6 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <CheckIcon className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-[18px] font-bold text-[#0b2740] md:text-[20px]">
                      All good!
                    </h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-500">
                      You&apos;re on track with your medication plan. Keep it up!
                    </p>
                  </div>
                </div>

                <div className="my-6 h-px bg-slate-200" />

                <div className="flex items-center gap-3">
                  <ClockIcon className="h-6 w-6 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Last updated</p>
                    <p className="font-semibold text-[#0b2740]">
                      Today, 07:15 AM
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* SCHEDULES + RIGHT AREA */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              {/* TODAY'S SCHEDULES */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-[#0b2740]">
                    Today&apos;s Schedules
                  </h2>
                  <button
                    onClick={() => router.push("/patient/schedules")}
                    className="text-sm font-semibold text-[#07324a]"
                  >
                    View all <span className="ml-1">›</span>
                  </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">
                      Loading schedules...
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Belum ada jadwal obat hari ini.
                    </div>
                  ) : (
                    schedules.map((item, index) => (
                      <div
                        key={item.id}
                        className={`grid gap-4 px-4 py-4 md:grid-cols-[64px_1.15fr_1fr_auto] md:items-center ${index !== schedules.length - 1
                          ? "border-b border-slate-200"
                          : ""
                          }`}
                      >
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${index === 0
                            ? "bg-blue-50 text-blue-500"
                            : index === 1
                              ? "bg-amber-50 text-amber-500"
                              : "bg-purple-50 text-purple-500"
                            }`}
                        >
                          {index === 0 ? (
                            <PillIcon className="h-7 w-7" />
                          ) : (
                            <MinusIcon className="h-7 w-7" />
                          )}
                        </div>

                        <div>
                          <h3 className="text-[18px] font-bold text-[#0b2740]">
                            {getMedicineName(item)}
                          </h3>
                          <p className="mt-1 text-slate-500">
                            {item.dose || "-"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <ClockIcon className="h-6 w-6 text-slate-500" />
                          <div>
                            <p className="font-bold text-[#0b2740]">
                              {item.time || "-"}
                            </p>
                            <p className="text-slate-500">
                              {item.instruction || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 md:justify-end">
                          <span
                            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                          <button className="text-xl text-slate-400">›</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* RIGHT COLUMN */}
              <section className="space-y-6">
                <div>
                  <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#0b2740]">
                    Your Progress Overview
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      title="Approved"
                      value={approvedCount}
                      tone="green"
                      icon={<CheckIcon className="h-6 w-6" />}
                    />
                    <StatCard
                      title="Rejected"
                      value={rejectedCount}
                      tone="red"
                      icon={<XIcon className="h-6 w-6" />}
                    />
                    <StatCard
                      title="Waiting Verification"
                      value={waitingCount}
                      tone="yellow"
                      icon={<ClockIcon className="h-6 w-6" />}
                    />
                    <StatCard
                      title="Missed"
                      value={missedCount}
                      tone="slate"
                      icon={<MinusIcon className="h-6 w-6" />}
                    />
                  </div>
                </div>

              </section>
            </div>
          </div>
        </section>

        {/* MOBILE BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-3 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
          <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
            <DashboardGridIcon className="h-6 w-6" />
            Dashboard
          </button>

          <button
            onClick={() => router.push("/patient/schedules")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <CalendarIcon className="h-6 w-6" />
            Schedules
          </button>

          <button
            onClick={() => router.push("/patient/history")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <ClockIcon className="h-6 w-6" />
            History
          </button>
        </nav>
      </main>
    </ProtectedPage>
  );
}
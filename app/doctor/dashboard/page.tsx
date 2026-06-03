"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type RecentItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
};

type Patient = {
  id: string;
  user_id?: string;
  full_name?: string;
  age?: number;
  main_disease?: string;
  whatsapp_number?: string;
  created_at?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

type Medication = {
  id: string;
  name: string;
  slot_number?: number;
  stock?: number;
  created_at?: string;
};

type Schedule = {
  id: string;
  patient_id?: string;
  medicine_id?: string;
  dose?: string;
  time?: string;
  status?: string;
  created_at?: string;
  medicine?: {
    id?: string;
    name?: string;
  };
};

type Verification = {
  id: string;
  patient_id?: string;
  schedule_id?: string;
  verification_status?: string;
  status?: string;
  created_at?: string;
  verified_at?: string | null;
  rejection_reason?: string | null;
  schedule?: {
    time?: string;
    dose?: string;
    medicine?: {
      name?: string;
    };
  };
};

type CurrentUser = {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
};

const PATIENTS_ENDPOINT = "/patients";
const MEDICATIONS_ENDPOINT = "/medications";
const SCHEDULES_ENDPOINT = "/schedules";
const VERIFICATIONS_ENDPOINT = "/doctor/verifications";

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: T[] }).data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }

  return [];
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getMedicationName(schedule: Schedule) {
  return schedule.medicine?.name || "-";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DashboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function UserPlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M19 8v6M16 11h6" />
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

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
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

function UploadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M20 16.5a4 4 0 0 0-4-4h-1.2A6 6 0 0 0 3 14a4 4 0 0 0 4 4h1" />
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
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.1L14.2 3h-4.4l-.4 2.8a7 7 0 0 0-2 1.1l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.1l.4 2.8h4.4l.4-2.8a7 7 0 0 0 2-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
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
  active,
  collapsed,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  badge?: number;
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
      <span className={active ? "text-blue-500" : ""}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {!collapsed && badge ? (
        <span className="ml-auto rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  tone: "blue" | "purple" | "yellow" | "green" | "red";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    yellow: "bg-amber-50 text-amber-500",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-500",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-[#0b2740]">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "blue" | "purple" | "green" | "yellow";
  onClick?: () => void;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    green: "bg-green-50 text-green-600",
    yellow: "bg-amber-50 text-amber-500",
  }[tone];

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-[#0b2740]">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-500" />
    </button>
  );
}

function StatusPill({ status }: { status?: string }) {
  const normalized = status?.toLowerCase() || "";

  if (normalized.includes("approved")) {
    return (
      <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
        Approved
      </span>
    );
  }

  if (normalized.includes("reject")) {
    return (
      <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
        Rejected
      </span>
    );
  }

  if (normalized.includes("waiting")) {
    return (
      <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        Waiting Verification
      </span>
    );
  }

  if (normalized.includes("schedule")) {
    return (
      <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600">
        Schedule
      </span>
    );
  }

  if (normalized.includes("patient")) {
    return (
      <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
        Patient
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
      Info
    </span>
  );
}

function ActivityRow({
  icon,
  title,
  subtitle,
  meta,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
}) {
  return (
    <div className="grid grid-cols-[56px_1fr_auto_24px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{subtitle}</p>
        <h3 className="mt-1 font-bold text-[#0b2740]">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{meta}</p>
      </div>

      <StatusPill status={status} />

      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  );
}

export default function DoctorDashboardPage() {
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setApiError("");

        const [patientsRes, medicationsRes, schedulesRes, verificationsRes] =
          await Promise.allSettled([
            apiFetch(PATIENTS_ENDPOINT, { method: "GET" }),
            apiFetch(MEDICATIONS_ENDPOINT, { method: "GET" }),
            apiFetch(SCHEDULES_ENDPOINT, { method: "GET" }),
            apiFetch(VERIFICATIONS_ENDPOINT, { method: "GET" }),
          ]);

        if (patientsRes.status === "fulfilled") {
          setPatients(normalizeArray<Patient>(patientsRes.value));
        } else {
          setPatients([]);
        }

        if (medicationsRes.status === "fulfilled") {
          setMedications(normalizeArray<Medication>(medicationsRes.value));
        } else {
          setMedications([]);
        }

        if (schedulesRes.status === "fulfilled") {
          setSchedules(normalizeArray<Schedule>(schedulesRes.value));
        } else {
          setSchedules([]);
        }

        if (verificationsRes.status === "fulfilled") {
          setVerifications(normalizeArray<Verification>(verificationsRes.value));
        } else {
          setVerifications([]);
        }

        const hasFailed = [
          patientsRes,
          medicationsRes,
          schedulesRes,
          verificationsRes,
        ].some((result) => result.status === "rejected");

        if (hasFailed) {
          setApiError("Sebagian data dashboard belum bisa dimuat.");
        }
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Dashboard gagal dimuat.");
        setPatients([]);
        setMedications([]);
        setSchedules([]);
        setVerifications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const waitingVerificationCount = verifications.filter((item) => {
    const status = (item.verification_status || item.status || "").toUpperCase();
    return status === "WAITING_VERIFICATION";
  }).length;

  const approvedCount = verifications.filter((item) => {
    const status = (item.verification_status || item.status || "").toUpperCase();
    return status === "APPROVED";
  }).length;

  const rejectedCount = verifications.filter((item) => {
    const status = (item.verification_status || item.status || "").toUpperCase();
    return status === "REJECTED";
  }).length;

  const activeScheduleCount = schedules.length;
  const totalPatientCount = patients.length;
  const totalMedicationCount = medications.length;

  const displayName =
    currentUser?.username || currentUser?.email || "User";

  const displayRole =
    currentUser?.role === "DOCTOR" ? "Medical Staff" : "Account";

  const userInitials = getInitials(displayName);

  const recentActivity = useMemo<RecentItem[]>(() => {
    const recentPatients = patients.slice(0, 2).map((patient) => ({
      id: `patient-${patient.id}`,
      title: patient.full_name || patient.user?.email || "-",
      subtitle: "Patient record",
      meta: patient.created_at ? formatDateTime(patient.created_at) : "-",
      status: "Patient",
    }));

    const recentSchedules = schedules.slice(0, 2).map((schedule) => ({
      id: `schedule-${schedule.id}`,
      title: getMedicationName(schedule),
      subtitle: "Medication schedule",
      meta: schedule.time || schedule.created_at ? `${schedule.time || "-"} • ${formatDateTime(schedule.created_at)}` : "-",
      status: schedule.status || "Schedule",
    }));

    const recentVerifications = verifications.slice(0, 2).map((verification) => ({
      id: `verification-${verification.id}`,
      title: verification.schedule?.medicine?.name || "Consumption proof",
      subtitle: "Verification request",
      meta: formatDateTime(verification.created_at || verification.verified_at),
      status: verification.verification_status || verification.status || "Verification",
    }));

    return [...recentVerifications, ...recentSchedules, ...recentPatients].slice(0, 4);
  }, [patients, schedules, verifications]);

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  return (
    <ProtectedPage allowedRole="DOCTOR">
      <main className="min-h-screen bg-[#f8fbff] text-[#0b2740]">
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

            {/* LOGO PLACEHOLDER */}
            <div
              className={`mb-10 flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3 px-2"
                }`}
            >
              <img
                src="/logo-adherify.png"
                alt="Adherify"
                className="h-12 w-auto"
              />
            </div>

            <nav className="space-y-2">
              <NavItem
                icon={<DashboardIcon />}
                label="Dashboard"
                active
                collapsed={isSidebarCollapsed}
              />
              <NavItem
                icon={<UserIcon />}
                label="Patients"
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/doctor/patients")}
              />
              <NavItem
                icon={<PillIcon />}
                label="Medications"
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/doctor/medications")}
              />
              <NavItem
                icon={<CalendarIcon />}
                label="Schedules"
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/doctor/schedules")}
              />
              <NavItem
                icon={<ShieldIcon />}
                label="Verifications"
                badge={waitingVerificationCount > 0 ? waitingVerificationCount : undefined}
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/doctor/verifications")}
              />
            </nav>

            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0b2740] ${isSidebarCollapsed ? "justify-center" : "gap-4"
                  }`}
              >
                <span className="text-lg">↪</span>
                {!isSidebarCollapsed && <span>Log out</span>}
              </button>
            </div>
          </div>
        </aside>

        <section
          className={`min-h-screen px-5 pb-24 pt-6 transition-all duration-300 md:px-8 lg:px-10 xl:px-10 xl:pb-10 ${sidebarWidthClass}`}
        >
          <div className="mx-auto max-w-[1180px]">
            <header className="mb-8 flex items-center justify-between">
              <div className="xl:hidden">
                {/* LOGO PLACEHOLDER */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#07324a] text-[#07324a]">
                    ✓
                  </div>
                  <span className="text-2xl font-bold text-[#07324a]">
                    adherify
                  </span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">

                <div className="flex items-center gap-3">
                  {/* DOCTOR IMAGE PLACEHOLDER */}
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {userInitials}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-[#0b2740]">{displayName}</p>
                    <p className="text-xs text-slate-500">Medical Staff</p>
                  </div>
                </div>
              </div>
            </header>

            <section className="mb-6">
              <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                Hi, {displayName}
              </h1>
              <p className="mt-3 text-base text-slate-500 md:text-lg">
                Here&apos;s your clinic overview for today.
              </p>
            </section>

            {apiError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Sebagian data dashboard belum bisa dimuat: {apiError}
              </div>
            )}

            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                      <ClockIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0b2740]">
                        Waiting Verification
                      </p>
                      <p className="mt-3 text-[54px] font-bold leading-none text-amber-500">
                        {waitingVerificationCount ?? 0}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 max-w-md text-base leading-7 text-slate-500">
                    {waitingVerificationCount > 0
                      ? "Patient uploads are waiting for your review."
                      : "No patient uploads are waiting for review right now."}
                  </p>

                  <button
                    onClick={() => router.push("/doctor/verifications")}
                    className="mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-full bg-[#07324a] px-8 py-4 text-sm font-bold text-white md:w-[300px]"
                  >
                    Review Verifications <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* HERO IMAGE PLACEHOLDER */}
                {/* HERO IMAGE */}
                <div className="hidden h-[240px] items-center justify-center lg:flex">
                  <img
                    src="/foto-dashboard-rmv.png"
                    alt="Doctor dashboard medication illustration"
                    className="h-[240px] w-auto object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </section>

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                icon={<UserIcon className="h-7 w-7" />}
                title="Total Patients"
                value={totalPatientCount}
                subtitle="Patients registered"
                tone="blue"
              />
              <StatCard
                icon={<PillIcon className="h-7 w-7" />}
                title="Total Medications"
                value={totalMedicationCount}
                subtitle="Medication records"
                tone="purple"
              />
              <StatCard
                icon={<CalendarIcon className="h-7 w-7" />}
                title="Active Schedules"
                value={activeScheduleCount}
                subtitle="Medication schedules"
                tone="green"
              />
              <StatCard
                icon={<CheckIcon className="h-7 w-7" />}
                title="Approved Today"
                value={approvedCount}
                subtitle="Approved consumptions"
                tone="green"
              />
              <StatCard
                icon={<XIcon className="h-7 w-7" />}
                title="Rejected Today"
                value={rejectedCount}
                subtitle="Rejected consumptions"
                tone="red"
              />
              <StatCard
                icon={<ClockIcon className="h-7 w-7" />}
                title="Waiting Verification"
                value={waitingVerificationCount}
                subtitle="Needs doctor review"
                tone="yellow"
              />
            </section>

            <section className="mb-7">
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#0b2740]">
                Quick Actions
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <QuickAction
                  icon={<UserPlusIcon className="h-7 w-7" />}
                  title="Add Patient"
                  subtitle="Register a new patient"
                  tone="blue"
                  onClick={() => router.push("/doctor/patients")}
                />
                <QuickAction
                  icon={<PillIcon className="h-7 w-7" />}
                  title="Add Medication"
                  subtitle="Add a new medication"
                  tone="purple"
                  onClick={() => router.push("/doctor/medications")}
                />
                <QuickAction
                  icon={<CalendarIcon className="h-7 w-7" />}
                  title="Create Schedule"
                  subtitle="Create a new schedule"
                  tone="green"
                  onClick={() => router.push("/doctor/schedules")}
                />
                <QuickAction
                  icon={<ShieldIcon className="h-7 w-7" />}
                  title="View Verifications"
                  subtitle="Review pending items"
                  tone="yellow"
                  onClick={() => router.push("/doctor/verifications")}
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-[#0b2740]">
                  Recent Activity
                </h2>
                <button className="flex items-center gap-2 text-sm font-bold text-[#07324a]">
                  View all <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">
                    Loading dashboard...
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Belum ada aktivitas terbaru.
                  </div>
                ) : (
                  recentActivity.map((item, index) => {
                    const icon =
                      item.status?.toLowerCase().includes("patient") ? (
                        <UserIcon className="h-7 w-7" />
                      ) : item.status?.toLowerCase().includes("schedule") ? (
                        <CalendarIcon className="h-7 w-7" />
                      ) : item.status?.toLowerCase().includes("approved") ? (
                        <CheckIcon className="h-7 w-7" />
                      ) : item.status?.toLowerCase().includes("waiting") ? (
                        <UploadIcon className="h-7 w-7" />
                      ) : (
                        <ShieldIcon className="h-7 w-7" />
                      );

                    return (
                      <ActivityRow
                        key={`${item.id}-${index}`}
                        icon={icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        meta={item.meta}
                        status={item.status}
                      />
                    );
                  })
                )}
              </div>
            </section>

            <section className="mt-7 rounded-3xl border border-slate-200 bg-[#f3f8fc] p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <CheckIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0b2740]">
                    Today&apos;s Monitoring
                  </h3>
                  <p className="mt-1 text-slate-500">
                    {approvedCount > 0
                      ? `You have approved ${approvedCount} consumptions.`
                      : "No approved consumptions recorded yet."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-5 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
          <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
            <DashboardIcon className="h-6 w-6" />
            Dashboard
          </button>
          <button
            onClick={() => router.push("/doctor/patients")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <UserIcon className="h-6 w-6" />
            Patients
          </button>
          <button
            onClick={() => router.push("/doctor/schedules")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <CalendarIcon className="h-6 w-6" />
            Schedules
          </button>
          <button
            onClick={() => router.push("/doctor/verifications")}
            className="relative flex flex-col items-center justify-center gap-1"
          >
            <ShieldIcon className="h-6 w-6" />
            <span className="absolute right-7 top-3 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {waitingVerificationCount ?? 0}
            </span>
            Verifications
          </button>
          <button className="flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">•••</span>
            More
          </button>
        </nav>
      </main>
    </ProtectedPage>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Verification = {
  id: string;
  schedule_id?: string;
  patient_id?: string;
  proof_image?: string;
  verification_status?: string;
  status?: string;
  note?: string;
  patient_note?: string;
  rejection_reason?: string | null;
  created_at?: string;
  uploaded_at?: string;
  verified_by_id?: string | null;
  verified_at?: string | null;

  patient?: {
    id?: string;
    full_name?: string;
    name?: string;
    age?: number;
    gender?: string;
    user?: {
      email?: string;
      username?: string;
    };
  };

  patientProfile?: {
    full_name?: string;
    age?: number;
  };

  schedule?: {
    id?: string;
    time?: string;
    dose?: string;
    medicine?: {
      id?: string;
      name?: string;
    };
    medication?: {
      id?: string;
      name?: string;
    };
  };

  medicine?: {
    id?: string;
    name?: string;
  };

  medication?: {
    id?: string;
    name?: string;
  };

  patient_name?: string;
  medication_name?: string;
  medicine_name?: string;
  schedule_time?: string;
  dose?: string;
};

type Patient = {
  id: string;
  user_id?: string;
  full_name?: string;
  age?: number;
  main_disease?: string;
  whatsapp_number?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

type CurrentUser = {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
};

const WAITING_VERIFICATIONS_ENDPOINT = "/doctor/verifications";
const APPROVE_ENDPOINT = (id: string) => `/doctor/consumptions/${id}/approve`;
const REJECT_ENDPOINT = (id: string) => `/doctor/consumptions/${id}/reject`;


function normalizeStatus(status?: string) {
  if (!status) return "WAITING_VERIFICATION";
  return status.toUpperCase();
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "WAITING_VERIFICATION") return "Waiting";
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function statusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "APPROVED") return "bg-green-50 text-green-700";
  if (normalized === "REJECTED") return "bg-red-50 text-red-600";
  if (normalized === "WAITING_VERIFICATION") return "bg-amber-50 text-amber-700";

  return "bg-slate-100 text-slate-600";
}

function getPatientName(item: Verification, patients: Patient[]) {
  const directName =
    item.patient?.full_name ||
    item.patient?.name ||
    item.patient_name ||
    item.patientProfile?.full_name;

  if (directName) return directName;

  const matchedPatient = patients.find((patient) => {
    return (
      patient.user_id === item.patient_id ||
      patient.user?.id === item.patient_id ||
      patient.id === item.patient_id
    );
  });

  return matchedPatient?.full_name || "Patient";
}

function getPatientAge(item: Verification, patients: Patient[]) {
  const directAge = item.patient?.age || item.patientProfile?.age;

  if (directAge) return `${directAge} years`;

  const matchedPatient = patients.find((patient) => {
    return (
      patient.user_id === item.patient_id ||
      patient.user?.id === item.patient_id ||
      patient.id === item.patient_id
    );
  });

  return matchedPatient?.age ? `${matchedPatient.age} years` : "";
}

function getMedicationName(item: Verification) {
  return (
    item.schedule?.medicine?.name ||
    item.schedule?.medication?.name ||
    item.medicine?.name ||
    item.medication?.name ||
    item.medication_name ||
    item.medicine_name ||
    "-"
  );
}

function getDose(item: Verification) {
  return item.schedule?.dose || item.dose || "-";
}

function getScheduleTime(item: Verification) {
  return item.schedule?.time || item.schedule_time || "";
}

function getPatientNote(item: Verification) {
  return item.patient_note || item.note || "-";
}

function getUploadedTime(item: Verification) {
  const dateValue = item.uploaded_at || item.created_at;

  if (!dateValue) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(time?: string) {
  if (!time) return "08:00 AM";

  if (time.includes("AM") || time.includes("PM")) return time;

  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = minuteRaw || "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
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

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17H9" />
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
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

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

function ChevronDown({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
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

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${statusStyle(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

export default function DoctorVerificationsPage() {
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [verificationsFromApi, setVerificationsFromApi] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("WAITING_VERIFICATION");

  const [rejectTarget, setRejectTarget] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [rejectError, setRejectError] = useState("");

  const verifications = verificationsFromApi;

  const [patientsFromApi, setPatientsFromApi] = useState<Patient[]>([]);

  const filteredVerifications = useMemo(() => {
    const q = search.toLowerCase().trim();

    return verifications.filter((item) => {
      const patientName = getPatientName(item, patientsFromApi).toLowerCase();
      const medicationName = getMedicationName(item).toLowerCase();

      const matchSearch =
        !q || patientName.includes(q) || medicationName.includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        normalizeStatus(item.verification_status || item.status) === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [verifications, patientsFromApi, search, statusFilter]);

  const waitingCount = verifications.filter(
    (item) => normalizeStatus(item.verification_status || item.status) === "WAITING_VERIFICATION"
  ).length;

  const approvedCount = verifications.filter(
    (item) => normalizeStatus(item.verification_status || item.status) === "APPROVED"
  ).length;

  const rejectedCount = verifications.filter(
    (item) => normalizeStatus(item.verification_status || item.status) === "REJECTED"
  ).length;

  const displayName = currentUser?.username || currentUser?.email || "User";
  const displayRole = currentUser?.role === "DOCTOR" ? "Medical Staff" : "Account";
  const userInitials = getInitials(displayName);

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  async function fetchVerifications() {
    try {
      setLoading(true);
      setApiError("");

      const data = await apiFetch(WAITING_VERIFICATIONS_ENDPOINT, {
        method: "GET",
      });

      const result = Array.isArray(data)
        ? data
        : data?.data || data?.verifications || data?.items || [];

      setVerificationsFromApi(Array.isArray(result) ? result : []);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data verifikasi."
      );
      setVerificationsFromApi([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatients() {
    try {
      const data = await apiFetch("/patients");

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.patients)
            ? data.patients
            : [];

      setPatientsFromApi(list);
    } catch (err) {
      console.log("Failed to fetch patients for verification names:", err);
      setPatientsFromApi([]);
    }
  }

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
    fetchVerifications();
    fetchPatients();
  }, []);

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  async function handleApprove(item: Verification) {
    try {
      setActionLoadingId(item.id);

      await apiFetch(APPROVE_ENDPOINT(item.id), {
        method: "PATCH",
      });

      setVerificationsFromApi((prev) =>
        prev.map((verification) =>
          verification.id === item.id
            ? { ...verification, verification_status: "APPROVED", status: "APPROVED" }
            : verification
        )
      );

      await fetchVerifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal approve verification.");
    } finally {
      setActionLoadingId("");
    }
  }

  function getProofImageUrl(path?: string | null) {
    if (!path) return "";

    if (path.startsWith("http")) return path;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const normalizedPath = path.replaceAll("\\", "/").replace(/^\/+/, "");

    return `${baseUrl}/${normalizedPath}`;
  }

  function openRejectModal(item: Verification) {
    setRejectTarget(item);
    setRejectReason("");
    setRejectError("");
  }

  function closeRejectModal() {
    setRejectTarget(null);
    setRejectReason("");
    setRejectError("");
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;

    if (!rejectReason.trim()) {
      setRejectError("Reason for rejection wajib diisi.");
      return;
    }

    try {
      setActionLoadingId(rejectTarget.id);
      setRejectError("");

      await apiFetch(REJECT_ENDPOINT(rejectTarget.id), {
        method: "PATCH",
        body: JSON.stringify({
          rejection_reason: rejectReason,
        }),
      });

      setVerificationsFromApi((prev) =>
        prev.map((verification) =>
          verification.id === rejectTarget.id
            ? {
              ...verification,
              verification_status: "REJECTED",
              status: "REJECTED",
              rejection_reason: rejectReason,
            }
            : verification
        )
      );

      closeRejectModal();
      await fetchVerifications();
    } catch (err) {
      setRejectError(
        err instanceof Error ? err.message : "Gagal reject verification."
      );
    } finally {
      setActionLoadingId("");
    }
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
                collapsed={isSidebarCollapsed}
                onClick={() => router.push("/doctor/dashboard")}
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
                active
                badge={waitingCount > 0 ? waitingCount : undefined}
                collapsed={isSidebarCollapsed}
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
                  <span className="text-2xl font-bold text-[#07324a]">adherify</span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <button className="relative text-slate-500">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-blue-500" />
                </button>

                <div className="flex items-center gap-3">
                  {/* DOCTOR IMAGE PLACEHOLDER */}
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {userInitials}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-[#0b2740]">Doctor</p>
                    <p className="text-xs text-slate-500">Medical Staff</p>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 rotate-90 text-slate-500 md:block" />
                </div>
              </div>
            </header>

            <section className="mb-6">
              <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                Patient Verifications
              </h1>
              <p className="mt-3 text-base text-slate-500 md:text-lg">
                Review patient verification requests.
              </p>
            </section>

            {apiError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Verification data belum terbaca: {apiError}.
              </div>
            )}

            <section className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
                  <div>
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                        <ClockIcon className="h-9 w-9" />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-[#0b2740]">
                          Waiting Verifications
                        </h2>
                        <p className="mt-2 text-5xl font-bold text-amber-500">
                          {waitingCount}
                        </p>
                        <p className="mt-2 text-slate-500">
                          Pending your review
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* HERO IMAGE PLACEHOLDER */}
                  <div className="hidden h-[170px] items-center justify-center rounded-full bg-slate-50 text-center text-sm text-slate-400 md:flex">
                    verification
                    <br />
                    illustration placeholder
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-[#0b2740]">Today&apos;s Verifications</h2>
                  <button className="text-sm font-bold text-blue-600">View all</button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-slate-500">
                      <ClockIcon className="h-5 w-5 text-amber-500" />
                      Waiting
                    </span>
                    <span className="font-bold">{waitingCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-slate-500">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                      Approved
                    </span>
                    <span className="font-bold">{approvedCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-slate-500">
                      <XIcon className="h-5 w-5 text-red-500" />
                      Rejected
                    </span>
                    <span className="font-bold">{rejectedCount}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6 grid gap-4 xl:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient or medication..."
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-13 pr-4 text-sm font-medium outline-none focus:border-[#07324a]"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-[52px] w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-[#0b2740] outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="WAITING_VERIFICATION">Waiting</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>

              <button
                onClick={fetchVerifications}
                className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
              >
                Refresh
              </button>

              <button
                onClick={() => setStatusFilter("WAITING_VERIFICATION")}
                className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
              >
                Review All
              </button>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden xl:block">
                {loading ? (
                  <div className="p-10 text-center text-slate-500">
                    Loading verifications...
                  </div>
                ) : filteredVerifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    No verifications found.
                  </div>
                ) : (
                  filteredVerifications.map((item) => {
                    const patientName = getPatientName(item, patientsFromApi);
                    const patientAge = getPatientAge(item, patientsFromApi);
                    const medicationName = getMedicationName(item);
                    const status = item.verification_status || item.status;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1.2fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr_1.3fr] items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                            {getInitials(patientName)}
                          </div>

                          <div>
                            <h3 className="font-bold text-[#0b2740]">
                              {patientName}
                            </h3>
                            {patientAge && (
                              <p className="mt-1 text-sm text-slate-500">
                                {patientAge}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Medication
                          </p>
                          <p className="mt-1 font-bold text-[#0b2740]">
                            {medicationName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {getDose(item)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Schedule
                          </p>
                          <p className="mt-1 font-bold text-[#0b2740]">
                            {getScheduleTime(item) ? formatTime(getScheduleTime(item)) : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Uploaded
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0b2740]">
                            {getUploadedTime(item)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Proof
                          </p>

                          {/* PROOF IMAGE PLACEHOLDER */}
                          <div className="mt-2 flex h-16 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-[10px] text-slate-400">
                            {getProofImageUrl(item.proof_image) ? (
                              <img
                                src={getProofImageUrl(item.proof_image)}
                                alt="Proof"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "No proof"
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Patient Note
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {getPatientNote(item)}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <StatusBadge status={status} />

                          {normalizeStatus(status) === "WAITING_VERIFICATION" && (
                            <>
                              <button
                                onClick={() => handleApprove(item)}
                                disabled={actionLoadingId === item.id}
                                className="h-10 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-bold text-green-700 disabled:opacity-60"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => openRejectModal(item)}
                                disabled={actionLoadingId === item.id}
                                className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-4 p-4 xl:hidden">
                {loading ? (
                  <div className="py-8 text-center text-slate-500">
                    Loading verifications...
                  </div>
                ) : filteredVerifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No verifications found.
                  </div>
                ) : (
                  filteredVerifications.map((item) => {
                    const patientName = getPatientName(item, patientsFromApi);
                    const patientAge = getPatientAge(item, patientsFromApi);
                    const medicationName = getMedicationName(item);
                    const status = item.verification_status || item.status;

                    return (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                              {getInitials(patientName)}
                            </div>

                            <div>
                              <h3 className="text-xl font-bold text-[#0b2740]">
                                {patientName}
                              </h3>

                              {patientAge && (
                                <p className="mt-1 text-sm text-slate-500">
                                  {patientAge}
                                </p>
                              )}

                              <p className="mt-1 text-lg font-semibold text-[#0b2740]">
                                {medicationName}
                              </p>
                              <p className="mt-2 text-slate-500">{getDose(item)}</p>
                            </div>
                          </div>

                          <StatusBadge status={status} />
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_160px]">
                          <div>
                            <p className="flex items-center gap-2 text-slate-500">
                              <CalendarIcon className="h-5 w-5" />
                              Today, {formatTime(getScheduleTime(item))}
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-slate-500">
                              <UploadIcon className="h-5 w-5" />
                              Uploaded {getUploadedTime(item)}
                            </p>
                            <p className="mt-4 text-slate-500">
                              <span className="font-bold text-[#0b2740]">
                                Patient note:
                              </span>{" "}
                              {getPatientNote(item)}
                            </p>
                          </div>

                          {/* PROOF IMAGE PLACEHOLDER */}
                          <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm text-slate-400">
                            {getProofImageUrl(item.proof_image) ? (
                              <img
                                src={getProofImageUrl(item.proof_image)}
                                alt="Proof"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "No proof"
                            )}
                          </div>
                        </div>

                        {normalizeStatus(status) === "WAITING_VERIFICATION" && (
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={actionLoadingId === item.id}
                              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 text-sm font-bold text-green-700 disabled:opacity-60"
                            >
                              <CheckIcon className="h-5 w-5" />
                              Approve
                            </button>

                            <button
                              onClick={() => openRejectModal(item)}
                              disabled={actionLoadingId === item.id}
                              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 disabled:opacity-60"
                            >
                              <XIcon className="h-5 w-5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                Showing {filteredVerifications.length} of {verifications.length} verifications
              </div>
            </section>
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-5 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
          <button
            onClick={() => router.push("/doctor/dashboard")}
            className="flex flex-col items-center justify-center gap-1"
          >
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

          <button className="relative flex flex-col items-center justify-center gap-1 text-[#07324a]">
            <ShieldIcon className="h-6 w-6" />
            {waitingCount > 0 && (
              <span className="absolute right-7 top-3 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {waitingCount}
              </span>
            )}
            Verifications
          </button>

          <button className="flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">•••</span>
            More
          </button>
        </nav>

        {rejectTarget && (
          <div className="fixed inset-0 z-40 flex items-end bg-black/20 xl:items-center xl:justify-center">
            <div className="w-full rounded-t-[32px] border border-red-100 bg-white p-6 shadow-2xl xl:max-w-[520px] xl:rounded-3xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <XIcon className="h-7 w-7" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-red-700">
                      Reject Verification
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Please provide a reason for rejecting this verification.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeRejectModal}
                  className="text-2xl text-slate-500"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="text-slate-500">Patient</p>
                <p className="font-bold text-[#0b2740]">
                  {rejectTarget ? getPatientName(rejectTarget, patientsFromApi) : "-"}
                </p>

                <p className="mt-3 text-slate-500">Medication</p>
                <p className="font-bold text-[#0b2740]">
                  {getMedicationName(rejectTarget)}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                  Reason for rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={250}
                  placeholder="Enter reason for rejection..."
                  className="h-32 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-red-500"
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {rejectReason.length}/250
                </p>
              </div>

              {rejectError && (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {rejectError}
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                The patient may be asked to re-upload their proof.
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={closeRejectModal}
                  className="h-12 rounded-2xl border border-slate-300 bg-white px-8 text-sm font-bold text-[#0b2740]"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === rejectTarget.id}
                  className="h-12 rounded-2xl bg-red-600 px-8 text-sm font-bold text-white disabled:opacity-60"
                >
                  {actionLoadingId === rejectTarget.id
                    ? "Rejecting..."
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedPage>
  );
}
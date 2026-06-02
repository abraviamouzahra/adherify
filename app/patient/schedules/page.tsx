"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  medicine?: { name?: string };
  medication?: { name?: string };
  medicine_name?: string;
  medication_name?: string;
  name?: string;

  proof_image?: string;
  verification_status?: string;
  consumption_id?: string;
  rejection_reason?: string | null;
};

const TODAY_SCHEDULES_ENDPOINT = "/patient/schedules/today";
const UPLOAD_CONSUMPTION_ENDPOINT = "/patient/consumptions";

/*
  Kalau endpoint Dika beda, ganti di atas.
  Kemungkinan lain:
  TODAY_SCHEDULES_ENDPOINT = "/my-schedules/today"
  UPLOAD_CONSUMPTION_ENDPOINT = "/consumptions"
*/



function getMedicineName(item?: ScheduleItem) {
  if (!item) return "Medication";
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
  if (normalized === "WAITING_VERIFICATION") return "Waiting Verification";
  if (normalized === "SCHEDULED") return "Scheduled";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function statusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "APPROVED" || normalized === "SCHEDULED") {
    return "bg-green-50 text-green-700";
  }

  if (normalized === "PENDING") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "WAITING_VERIFICATION") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalized === "REJECTED" || normalized === "MISSED") {
    return "bg-red-50 text-red-600";
  }

  return "bg-slate-100 text-slate-600";
}

function canUploadProof(status?: string) {
  const normalized = normalizeStatus(status);
  return normalized === "PENDING" || normalized === "SCHEDULED" || normalized === "UPCOMING";
}

function canConfirm(status?: string) {
  const normalized = normalizeStatus(status);
  return normalized === "PENDING" || normalized === "SCHEDULED" || normalized === "UPCOMING";
}

function countStatus(schedules: ScheduleItem[], status: string) {
  return schedules.filter((item) => normalizeStatus(item.status) === status).length;
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
      <path d="M18 6 6 18M6 6l12 12" />
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

function StatCard({
  icon,
  title,
  value,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  tone: "blue" | "green" | "yellow";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-600",
    yellow: "bg-amber-50 text-amber-500",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-[#0b2740]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
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
    </button>
  );
}

export default function PatientSchedulesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [schedulesFromApi, setSchedulesFromApi] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    async function fetchSchedules() {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiFetch(TODAY_SCHEDULES_ENDPOINT, { method: "GET" });

        const schedules = Array.isArray(data)
          ? data
          : data?.data ||
          data?.schedules ||
          data?.todaySchedules ||
          data?.today_schedules ||
          [];

        setSchedulesFromApi(Array.isArray(schedules) ? schedules : []);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Gagal mengambil jadwal.");
        setSchedulesFromApi([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, []);

  const schedules = schedulesFromApi;

  const totalToday = schedules.length;
  const scheduledCount =
    countStatus(schedules, "SCHEDULED") + countStatus(schedules, "APPROVED");

  const pendingCount = countStatus(schedules, "PENDING");
  const waitingCount = countStatus(schedules, "WAITING_VERIFICATION");

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  function openUpload(schedule: ScheduleItem) {
    setSelectedSchedule(schedule);
    setIsUploadOpen(true);
    setProofFile(null);
    setProofPreview("");
    setUploadError("");
  }

  function closeUpload() {
    setIsUploadOpen(false);
    setSelectedSchedule(null);
    setProofFile(null);
    setProofPreview("");  
    setUploadError("");
  }

  function handleFileChange(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar JPG atau PNG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 10MB.");
      return;
    }

    setUploadError("");
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmitProof() {
    if (!selectedSchedule) {
      setUploadError("Jadwal belum dipilih.");
      return;
    }

    if (!proofFile) {
      setUploadError("Upload foto bukti terlebih dahulu.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("schedule_id", selectedSchedule.id);
      formData.append("proof_image", proofFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${UPLOAD_CONSUMPTION_ENDPOINT}`,
        {
          method: "POST",
          headers: token
            ? {
              Authorization: `Bearer ${token}`,
            }
            : undefined,
          body: formData,
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Upload bukti gagal.");
      }

      setSchedulesFromApi((prev) =>
        prev.map((item) =>
          item.id === selectedSchedule.id
            ? { ...item, status: "WAITING_VERIFICATION" }
            : item
        )
      );

      closeUpload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload bukti gagal.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ProtectedPage allowedRole="PATIENT">
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
            <div className={`mb-10 flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3 px-2"}`}>
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
                onClick={() => router.push("/patient/dashboard")}
              />

              <NavItem
                icon={<CalendarIcon />}
                label="Today's Schedules"
                active
                collapsed={isSidebarCollapsed}
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                    P
                  </div>
                  <span className="hidden text-sm font-semibold md:block">Patient</span>
                  <ChevronRight className="hidden h-4 w-4 rotate-90 text-slate-500 md:block" />
                </div>
              </div>
            </header>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                  Today&apos;s Schedules
                </h1>
                <p className="mt-3 text-base text-slate-500 md:text-lg">
                  Confirm each dose and upload proof when needed.
                </p>
              </div>

              <button
                onClick={() => router.push("/patient/history")}
                className="flex h-12 w-fit items-center gap-3 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
              >
                <ClockIcon />
                View History
              </button>
            </div>

            {apiError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Jadwal belum bisa dimuat: {apiError}
              </div>
            )}

            <section className="mb-6 grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<CalendarIcon className="h-7 w-7" />}
                title="Total today"
                value={totalToday}
                tone="blue"
              />
              <StatCard
                icon={<ClockIcon className="h-7 w-7" />}
                title="Pending"
                value={pendingCount}
                tone="yellow"
              />
              <StatCard
                icon={<ClockIcon className="h-7 w-7" />}
                title="Waiting verification"
                value={waitingCount}
                tone="yellow"
              />
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#0b2740]">
                Today&apos;s Medication
              </h2>

              <div className="space-y-4">
                {loading ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading schedules...
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Belum ada jadwal obat hari ini.
                  </div>
                ) : (
                  schedules.map((item, index) => {
                    const normalized = normalizeStatus(item.status);

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="grid gap-5 md:grid-cols-[72px_1.2fr_1.1fr_auto] md:items-center">
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${normalized === "MISSED"
                              ? "bg-red-50 text-red-500"
                              : index === 0
                                ? "bg-blue-50 text-blue-500"
                                : index === 1
                                  ? "bg-amber-50 text-amber-500"
                                  : "bg-purple-50 text-purple-500"
                              }`}
                          >
                            {normalized === "MISSED" ? (
                              <XIcon className="h-8 w-8" />
                            ) : index === 0 ? (
                              <PillIcon className="h-8 w-8" />
                            ) : (
                              <MinusIcon className="h-8 w-8" />
                            )}
                          </div>

                          <div>
                            <h3 className="text-xl font-bold text-[#0b2740]">
                              {getMedicineName(item)}
                            </h3>
                            <p className="mt-1 text-slate-500">
                              {item.dose || "-"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-5">
                            <div className="flex items-center gap-3">
                              <ClockIcon className="h-6 w-6 text-slate-500" />
                              <div>
                                <p className="font-bold">{item.time || "-"}</p>
                                <p className="text-slate-500">
                                  {item.instruction || "-"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${statusStyle(
                                item.status
                              )}`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {statusLabel(item.status)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-3 md:min-w-[210px]">
                            {canUploadProof(item.status) && (
                              <button
                                onClick={() => openUpload(item)}
                                className="h-11 rounded-xl border border-[#07324a] bg-white px-5 text-sm font-bold text-[#07324a] hover:bg-slate-50"
                              >
                                Upload Proof
                              </button>
                            )}

                            {canConfirm(item.status) && (
                              <button
                                onClick={() => openUpload(item)}
                                className="h-11 rounded-xl bg-[#07324a] px-5 text-sm font-bold text-white hover:bg-[#062a3e]"
                              >
                                Confirm Consumption
                              </button>
                            )}

                            {normalized === "WAITING_VERIFICATION" && (
                              <button disabled className="h-11 rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-400">
                                Under review
                              </button>
                            )}

                            {normalized === "MISSED" && (
                              <button disabled className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-400">
                                Mark as Taken
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-[#f3f8fc] p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                    <CheckIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0b2740]">Keep it consistent!</h3>
                    <p className="mt-1 text-slate-500">
                      Taking your medications on time helps you achieve the best possible results.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* MOBILE BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-3 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <DashboardIcon className="h-6 w-6" />
            Dashboard
          </button>

          <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
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

        {/* UPLOAD MODAL / BOTTOM SHEET */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-40 flex items-end bg-black/20 xl:items-center xl:justify-center">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl xl:max-w-[520px] xl:rounded-3xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#151821]">
                    Upload Consumption Proof
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload a clear photo of your medication or any relevant proof.
                    Once submitted, the status will change to{" "}
                    <span className="font-bold text-amber-600">Waiting Verification.</span>
                  </p>
                </div>

                <button onClick={closeUpload} className="text-slate-500">
                  <XIcon className="h-7 w-7" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center"
                >
                  <UploadIcon className="h-10 w-10 text-blue-500" />
                  <p className="mt-4 font-bold text-[#0b2740]">
                    Drag & drop an image here
                  </p>
                  <p className="mt-1 text-slate-500">or tap to browse</p>
                  <p className="mt-4 text-sm text-slate-400">JPG, PNG up to 10MB</p>
                </button>

                {proofPreview && (
                  <div>
                    <p className="mb-3 text-sm font-bold text-[#0b2740]">Preview</p>
                    <div className="relative h-[120px] w-[150px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview("");
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>


              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-[#0b2740]">
                Status will change to{" "}
                <span className="font-bold text-amber-600">Waiting Verification</span>.
              </div>

              {uploadError && (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {uploadError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                <button
                  onClick={closeUpload}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-8 text-sm font-bold text-[#0b2740]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={uploading}
                  className="h-12 rounded-xl bg-[#07324a] px-8 text-sm font-bold text-white disabled:opacity-60"
                >
                  {uploading ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedPage>
  );
}
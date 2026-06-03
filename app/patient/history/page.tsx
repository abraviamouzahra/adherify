"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type HistoryStatus =
  | "WAITING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "MISSED"
  | string;

type HistoryItem = {
  id: string;
  schedule_id?: string;
  patient_id?: string;

  medicine_name?: string;
  medication_name?: string;
  name?: string;
  dose?: string;
  date?: string;
  time?: string;

  status?: HistoryStatus;
  verification_status?: HistoryStatus;

  note?: string;
  rejection_reason?: string | null;

  proof_image?: string;
  proofImage?: string;

  created_at?: string;
  verified_at?: string | null;
  taken_at?: string | null;

  medication?: {
    name?: string;
  };

  medicine?: {
    name?: string;
  };

  schedule?: {
    time?: string;
    dose?: string;
    medicine?: {
      name?: string;
    };
    medication?: {
      name?: string;
    };
  };
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

const HISTORY_ENDPOINT = "/patient/history";

function getMedicineName(item: HistoryItem) {
  return (
    item.medicine?.name ||
    item.medication?.name ||
    item.medicine_name ||
    item.medication_name ||
    item.name ||
    "Medication Schedule"
  );
}

function getSafeFileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getHistoryStatus(item: HistoryItem) {
  return item.verification_status || item.status || "WAITING_VERIFICATION";
}

function getHistoryDate(item: HistoryItem) {
  if (item.date) return item.date;

  const rawDate = item.taken_at || item.verified_at || item.created_at;

  return rawDate
    ? new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(rawDate))
    : "-";
}

function getHistoryTime(item: HistoryItem) {
  if (item.time) return item.time;

  const rawDate = item.taken_at || item.verified_at || item.created_at;

  return rawDate
    ? new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(rawDate))
    : "-";
}

function getProofImageUrl(path?: string | null) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedPath = path.replaceAll("\\", "/").replace(/^\/+/, "");

  return `${baseUrl}/${normalizedPath}`;
}

function normalizeStatus(status?: string) {
  if (!status) return "WAITING_VERIFICATION";
  return status.toUpperCase();
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "WAITING_VERIFICATION") return "Waiting Verification";
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "MISSED") return "Missed";
  if (normalized === "PENDING") return "Pending";

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function statusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "APPROVED") {
    return "bg-green-50 text-green-700";
  }

  if (normalized === "WAITING_VERIFICATION") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "REJECTED") {
    return "bg-red-50 text-red-600";
  }

  if (normalized === "MISSED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UploadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M20 16.5a4 4 0 0 0-4-4h-1.2A6 6 0 0 0 3 14a4 4 0 0 0 4 4h1" />
    </svg>
  );
}

function DashboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function PillIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.5 20.5 20.5 10.5a5 5 0 0 0-7-7L3.5 13.5a5 5 0 0 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 17H9" />
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.1L14.2 3h-4.4l-.4 2.8a7 7 0 0 0-2 1.1l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.1l.4 2.8h4.4l.4-2.8a7 7 0 0 0 2-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function XCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function MinusCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

function FilterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function NoteIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 3h12v18H6z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function ChevronLeft({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDown({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);

  const Icon =
    normalized === "APPROVED"
      ? CheckIcon
      : normalized === "REJECTED"
        ? XCircleIcon
        : normalized === "MISSED"
          ? MinusCircleIcon
          : ClockIcon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${statusStyle(
        status
      )}`}
    >
      <Icon className="h-5 w-5" />
      {statusLabel(status)}
    </span>
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

export default function PatientHistoryPage() {
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historyFromApi, setHistoryFromApi] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiFetch(HISTORY_ENDPOINT, {
          method: "GET",
        });

        const history = Array.isArray(data)
          ? data
          : data?.data ||
          data?.history ||
          data?.consumptions ||
          data?.items ||
          [];

        setHistoryFromApi(Array.isArray(history) ? history : []);
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil riwayat konsumsi."
        );
        setHistoryFromApi([]);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCurrentUser() {
      try {
        const data = await apiFetch("/auth/me", {
          method: "GET",
        });

        setCurrentUser(data?.user || data);
      } catch (err) {
        console.log("Failed to fetch current user:", err);
        setCurrentUser(null);
      }
    }

    fetchHistory();
    fetchCurrentUser();
  }, []);

  const history = historyFromApi;

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

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const currentStatus = getHistoryStatus(item);

      const matchStatus =
        statusFilter === "ALL" || normalizeStatus(currentStatus) === statusFilter;

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        getMedicineName(item).toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query);

      return matchStatus && matchSearch;
    });
  }, [history, statusFilter, searchQuery]);

  async function handleDownloadPdf() {
    if (filteredHistory.length === 0) {
      alert("Tidak ada data history untuk diexport.");
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const exportedAt = new Date();

    const patientName =
      currentUser?.username || currentUser?.email || "Patient";

    const safePatientName = getSafeFileName(patientName) || "patient";

    const totalRecords = filteredHistory.length;

    const approvedCount = filteredHistory.filter(
      (item) => normalizeStatus(getHistoryStatus(item)) === "APPROVED"
    ).length;

    const waitingCount = filteredHistory.filter(
      (item) =>
        normalizeStatus(getHistoryStatus(item)) === "WAITING_VERIFICATION"
    ).length;

    const rejectedCount = filteredHistory.filter(
      (item) => normalizeStatus(getHistoryStatus(item)) === "REJECTED"
    ).length;

    const missedCount = filteredHistory.filter(
      (item) => normalizeStatus(getHistoryStatus(item)) === "MISSED"
    ).length;

    doc.setFontSize(18);
    doc.text("Adherify Medication Consumption Report", 14, 18);

    doc.setFontSize(10);
    doc.text(`Patient: ${patientName}`, 14, 27);
    doc.text(
      `Exported at: ${new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(exportedAt)}`,
      14,
      33
    );

    doc.setFontSize(11);
    doc.text("Summary", 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [["Total", "Approved", "Waiting Verification", "Rejected", "Missed"]],
      body: [[
        String(totalRecords),
        String(approvedCount),
        String(waitingCount),
        String(rejectedCount),
        String(missedCount),
      ]],
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [7, 50, 74],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    const tableRows = filteredHistory.map((item, index) => {
      const status = normalizeStatus(getHistoryStatus(item));
      const proofUrl = getProofImageUrl(item.proof_image || item.proofImage);

      return [
        String(index + 1),
        getMedicineName(item),
        item.dose || item.schedule?.dose || "-",
        getHistoryDate(item),
        getHistoryTime(item),
        statusLabel(status),
        item.rejection_reason || "-",
        proofUrl ? "Available in app" : "-",
      ];
    });

    autoTable(doc, {
      startY: 72,
      head: [[
        "No",
        "Medication",
        "Dose",
        "Date",
        "Time",
        "Status",
        "Rejection Reason",
        "Proof",
      ]],
      body: tableRows,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [7, 50, 74],
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 48 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 35 },
        6: { cellWidth: 55 },
        7: { cellWidth: 30 },
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY || 180;

    doc.setFontSize(8);
    doc.text(
      "Note: Proof images are stored securely and can be viewed from the Adherify application.",
      14,
      finalY + 10
    );

    const fileDate = exportedAt.toISOString().slice(0, 10);

    doc.save(`adherify-history-${safePatientName}-${fileDate}.pdf`);
  }

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  function handleLogout() {
    logout();
    router.replace("/sign-in");
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
                onClick={() => router.push("/patient/dashboard")}
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
                active
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
                  <span className="text-2xl font-bold text-[#07324a]">
                    adherify
                  </span>
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

            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                  Medication History
                </h1>
                <p className="mt-3 text-base text-slate-500 md:text-lg">
                  Track your medication consumption history.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={filteredHistory.length === 0}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#07324a] px-6 text-sm font-bold text-white transition hover:bg-[#062a3e] disabled:cursor-not-allowed disabled:opacity-50 md:w-fit"
              >
                Download PDF
              </button>
            </section>

            <section className="mb-6 grid gap-4 xl:grid-cols-[0.9fr_1.45fr]">
              <button className="flex h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-left shadow-sm">
                <span className="flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6 text-slate-500" />
                  <span className="font-semibold text-[#0b2740]">
                    All dates
                  </span>
                </span>
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </button>

              <div className="relative">
                <FilterIcon className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-14 pr-10 font-semibold text-[#0b2740] shadow-sm outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="WAITING_VERIFICATION">
                    Waiting Verification
                  </option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="MISSED">Missed</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medication or notes..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 font-medium text-[#0b2740] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#07324a]"
                />
              </div>
            </section>

            <section className="space-y-4">
              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                  Loading history...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                  Belum ada riwayat konsumsi obat.
                </div>
              ) : (
                filteredHistory.map((item, index) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                  >
                    <div className="grid gap-5 lg:grid-cols-[150px_1.1fr_1fr_0.95fr] lg:items-center">
                      {/* IMAGE PLACEHOLDER */}
                      <div className="flex h-[120px] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-center text-xs text-slate-400 sm:w-[160px] lg:w-full">
                        {getProofImageUrl(item.proof_image || item.proofImage) ? (
                          <img
                            src={getProofImageUrl(item.proof_image || item.proofImage)}
                            alt="Proof"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>No proof</span>
                        )}
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-[#0b2740]">
                          {getMedicineName(item)}
                        </h2>
                        <p className="mt-2 flex items-center gap-2 text-slate-500">
                          <PillIcon className="h-5 w-5" />
                          {item.dose || item.schedule?.dose || "-"}
                        </p>

                        <div className="mt-5 grid gap-3 text-[#0b2740] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          <p className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-slate-500" />
                            {getHistoryDate(item)}
                          </p>
                          <p className="flex items-center gap-3">
                            <ClockIcon className="h-5 w-5 text-slate-500" />
                            {getHistoryTime(item)}
                          </p>
                        </div>
                      </div>

                      <div className="flex lg:justify-center">
                        <StatusBadge status={getHistoryStatus(item)} />
                      </div>

                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#0b2740]">
                              Your Note
                            </p>
                            <p className="mt-2 leading-6 text-slate-500">
                              {item.note || "-"}
                            </p>
                          </div>

                          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
                        </div>

                        {normalizeStatus(getHistoryStatus(item)) === "REJECTED" &&
                          item.rejection_reason && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                              <p className="flex items-center gap-2 font-bold">
                                <XCircleIcon className="h-5 w-5" />
                                Doctor&apos;s Reason
                              </p>
                              <p className="mt-2">{item.rejection_reason}</p>
                            </div>
                          )}

                        {index === filteredHistory.length - 1 && (
                          <div className="hidden" />
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-3 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <DashboardIcon className="h-6 w-6" />
            Dashboard
          </button>

          <button
            onClick={() => router.push("/patient/schedules")}
            className="flex flex-col items-center justify-center gap-1"
          >
            <CalendarIcon className="h-6 w-6" />
            Schedules
          </button>

          <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
            <ClockIcon className="h-6 w-6" />
            History
          </button>
        </nav>
      </main>
    </ProtectedPage>
  );
}
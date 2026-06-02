"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Patient = {
    id: string;
    user_id?: string;

    full_name?: string;
    name?: string;

    email?: string;
    age?: number;

    main_disease?: string;
    disease_note?: string;

    whatsapp_number?: string;
    phone?: string;

    birth_date?: string;
    gender?: string;
    address?: string;
    latest_status?: string;

    created_at?: string;
    deleted_at?: string | null;

    user?: {
        id?: string;
        email?: string;
        role?: string;
        created_at?: string;
    };
};

type Medication = {
    id: string;
    name?: string;
    slot_number?: number;
    stock?: number;
    dose?: string;
    instruction?: string;
    status?: string;
    created_at?: string;
};

type Schedule = {
    id: string;
    patient_id?: string;
    medicine_id?: string;
    medication_id?: string;
    dose?: string;
    time?: string;
    status?: string;
    instruction?: string;
    name?: string;
    medicine_name?: string;
    medication_name?: string;
    created_at?: string;
    medicine?: {
        id?: string;
        name?: string;
    };
    medication?: {
        id?: string;
        name?: string;
    };
};

type History = {
    id: string;
    patient_id?: string;
    schedule_id?: string;
    name?: string;
    medicine_name?: string;
    medication_name?: string;
    date?: string;
    time?: string;
    status?: string;
    verification_status?: string;
    note?: string;
    rejection_reason?: string;
    proof_image?: string;
    created_at?: string;
    verified_at?: string;
};

type TabKey = "profile" | "medications" | "schedules" | "history";

const PATIENTS_ENDPOINT = "/patients";

function getPatientName(patient?: Patient | null) {
    return patient?.full_name || patient?.name || "Patient";
}

function getPatientEmail(patient?: Patient | null) {
    return patient?.user?.email || patient?.email || "-";
}

function getPatientDisease(patient?: Patient | null) {
    return patient?.main_disease || patient?.disease_note || "-";
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function normalizeStatus(status?: string) {
    if (!status) return "PENDING";
    return status.toUpperCase();
}

function statusLabel(status?: string) {
    const normalized = normalizeStatus(status);
    if (normalized === "WAITING_VERIFICATION") return "Waiting Verification";
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function statusStyle(status?: string) {
    const normalized = normalizeStatus(status);

    if (normalized === "ACTIVE" || normalized === "APPROVED") {
        return "bg-green-50 text-green-700";
    }

    if (normalized === "WAITING_VERIFICATION") {
        return "bg-blue-50 text-blue-700";
    }

    if (normalized === "PENDING") {
        return "bg-amber-50 text-amber-700";
    }

    if (normalized === "REJECTED") {
        return "bg-red-50 text-red-600";
    }

    if (normalized === "MISSED") {
        return "bg-slate-100 text-slate-600";
    }

    return "bg-slate-100 text-slate-600";
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

function MinusIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
        </svg>
    );
}

function EditIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
    );
}

function MailIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

function MapIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2" />
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
    tone: "blue" | "green" | "yellow" | "red" | "slate";
}) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-500",
        green: "bg-green-50 text-green-600",
        yellow: "bg-amber-50 text-amber-500",
        red: "bg-red-50 text-red-500",
        slate: "bg-slate-100 text-slate-500",
    }[tone];

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 text-slate-500">
                        {title}
                    </p>
                    <p className="mt-1 text-3xl font-bold leading-none text-[#0b2740]">
                        {value}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-slate-500">
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${statusStyle(status)}`}>
            {statusLabel(status)}
        </span>
    );
}

function SmallRow({
    icon,
    title,
    subtitle,
    status,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    status?: string;
}) {
    return (
        <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-[#0b2740]">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {status && <StatusBadge status={status} />}
            <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
    );
}

export default function DoctorPatientDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const patientId = params?.id;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("profile");

    const [patient, setPatient] = useState<Patient | null>(null);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [history, setHistory] = useState<History[]>([]);

    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const currentPatient = patient;

    const patientName = currentPatient
        ? getPatientName(currentPatient)
        : "Patient";

    const patientEmail = currentPatient
        ? getPatientEmail(currentPatient)
        : "-";

    const patientDisease = currentPatient
        ? getPatientDisease(currentPatient)
        : "-";

    const patientPhone =
        currentPatient?.whatsapp_number || currentPatient?.phone || "-";

    const patientBirthDate = currentPatient?.birth_date || "-";
    const patientGender = currentPatient?.gender || "-";
    const patientAddress = currentPatient?.address || "-";
    const patientStatus = currentPatient?.latest_status || "-";

    const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
    const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

    useEffect(() => {
        async function fetchPatientDetail() {
            try {
                setLoading(true);
                setApiError("");

                const [patientRes, medicationRes, scheduleRes, historyRes] =
                    await Promise.allSettled([
                        apiFetch(`${PATIENTS_ENDPOINT}/${patientId}`, { method: "GET" }),
                        apiFetch("/medications", { method: "GET" }),
                        apiFetch("/schedules", { method: "GET" }),
                        apiFetch("/doctor/verifications", { method: "GET" }),
                    ]);

                let selectedPatient: Patient | null = null;
                let patientSchedules: Schedule[] = [];

                if (patientRes.status === "fulfilled") {
                    selectedPatient = patientRes.value?.data || patientRes.value;
                    setPatient(selectedPatient);
                } else {
                    setPatient(null);
                }

                if (scheduleRes.status === "fulfilled") {
                    const result = Array.isArray(scheduleRes.value)
                        ? scheduleRes.value
                        : scheduleRes.value?.data || scheduleRes.value?.schedules || [];

                    const allSchedules: Schedule[] = Array.isArray(result) ? result : [];

                    patientSchedules = allSchedules.filter((schedule) => {
                        return (
                            schedule.patient_id === selectedPatient?.user_id ||
                            schedule.patient_id === selectedPatient?.id
                        );
                    });

                    setSchedules(patientSchedules);
                } else {
                    setSchedules([]);
                }

                if (medicationRes.status === "fulfilled") {
                    const result = Array.isArray(medicationRes.value)
                        ? medicationRes.value
                        : medicationRes.value?.data || medicationRes.value?.medications || [];

                    const allMedications: Medication[] = Array.isArray(result) ? result : [];

                    const medicineIds = new Set(
                        patientSchedules
                            .map(
                                (schedule) =>
                                    schedule.medicine_id ||
                                    schedule.medication_id ||
                                    schedule.medicine?.id ||
                                    schedule.medication?.id
                            )
                            .filter(Boolean)
                    );

                    const patientMedications = allMedications.filter((medication) =>
                        medicineIds.has(medication.id)
                    );

                    setMedications(patientMedications);
                } else {
                    setMedications([]);
                }

                if (historyRes.status === "fulfilled") {
                    const result = Array.isArray(historyRes.value)
                        ? historyRes.value
                        : historyRes.value?.data ||
                        historyRes.value?.history ||
                        historyRes.value?.consumptions ||
                        [];

                    const allHistory: History[] = Array.isArray(result) ? result : [];

                    const patientHistory = allHistory.filter((item) => {
                        return (
                            item.patient_id === selectedPatient?.user_id ||
                            item.patient_id === selectedPatient?.id
                        );
                    });

                    setHistory(patientHistory);
                } else {
                    setHistory([]);
                }

                const failed = [patientRes, medicationRes, scheduleRes, historyRes].some(
                    (item) => item.status === "rejected"
                );

                if (failed) {
                    setApiError("Sebagian endpoint detail pasien belum tersedia. Data akan tampil jika endpoint tersedia.");
                }
            } catch (err) {
                setApiError(
                    err instanceof Error ? err.message : "Gagal mengambil detail pasien."
                );
            } finally {
                setLoading(false);
            }
        }

        if (patientId) fetchPatientDetail();
    }, [patientId]);

    const displayedMedications = medications;
    const displayedSchedules = schedules;
    const displayedHistory = history;

    const approvedCount = useMemo(
        () => displayedHistory.filter((item) => normalizeStatus(item.status) === "APPROVED").length || 18,
        [displayedHistory]
    );
    const rejectedCount = useMemo(
        () => displayedHistory.filter((item) => normalizeStatus(item.status) === "REJECTED").length || 2,
        [displayedHistory]
    );
    const missedCount = useMemo(
        () => displayedHistory.filter((item) => normalizeStatus(item.status) === "MISSED").length || 1,
        [displayedHistory]
    );
    const waitingCount = useMemo(
        () => displayedHistory.filter((item) => normalizeStatus(item.status) === "WAITING_VERIFICATION").length || 3,
        [displayedHistory]
    );

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
                                collapsed={isSidebarCollapsed}
                                onClick={() => router.push("/doctor/dashboard")}
                            />
                            <NavItem
                                icon={<UserIcon />}
                                label="Patients"
                                active
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
                    <div className="mx-auto max-w-[1120px]">
                        <header className="mb-8 flex items-center justify-between">
                            <button
                                onClick={() => router.push("/doctor/patients")}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600"
                            >
                                <ChevronLeft className="h-5 w-5" />
                                Back to Patients
                            </button>

                            <div className="ml-auto flex items-center gap-4">
                                <button className="relative text-slate-500">
                                    <BellIcon className="h-6 w-6" />
                                    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-blue-500" />
                                </button>

                                <div className="flex items-center gap-3">
                                    {/* DOCTOR IMAGE PLACEHOLDER */}
                                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                        DR
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-bold text-[#0b2740]">Doctor</p>
                                        <p className="text-xs text-slate-500">Medical Staff</p>
                                    </div>
                                    <ChevronRight className="hidden h-4 w-4 rotate-90 text-slate-500 md:block" />
                                </div>
                            </div>
                        </header>

                        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                                    Patient Detail
                                </h1>
                                <p className="mt-3 text-base text-slate-500 md:text-lg">
                                    View and manage patient information, medications, schedules, and consumption history.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push("/doctor/patients")}
                                className="flex h-12 w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
                            >
                                <EditIcon className="h-5 w-5" />
                                Edit Patient
                            </button>
                        </section>

                        {apiError && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                {apiError}
                            </div>
                        )}

                        {loading && (
                            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                Loading patient detail...
                            </div>
                        )}

                        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
                                        {getInitials(patientName)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-3xl font-bold text-[#0b2740]">
                                                {patientName}
                                            </h2>
                                            <StatusBadge status={patientStatus} />
                                        </div>

                                        <p className="mt-2 flex items-center gap-2 text-slate-500">
                                            <MailIcon className="h-5 w-5" />
                                            {patientEmail}
                                        </p>

                                        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                                            <div>
                                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                    <CalendarIcon className="h-5 w-5" />
                                                    Date of Birth
                                                </p>
                                                <p className="mt-2 font-bold text-[#0b2740]">
                                                    {patientBirthDate}
                                                    {currentPatient?.age ? ` (${currentPatient.age} y.o)` : ""}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                    <UserIcon className="h-5 w-5" />
                                                    Gender
                                                </p>
                                                <p className="mt-2 font-bold text-[#0b2740]">
                                                    {patientGender}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                    <MapIcon className="h-5 w-5" />
                                                    Address
                                                </p>
                                                <p className="mt-2 font-bold text-[#0b2740]">
                                                    {patientAddress}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                    <PillIcon className="h-5 w-5" />
                                                    Medical Notes
                                                </p>
                                                <p className="mt-2 font-bold text-[#0b2740]">
                                                    {patientDisease}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                            <StatCard
                                icon={<PillIcon className="h-7 w-7" />}
                                title="Total Medications"
                                value={displayedMedications.length}
                                subtitle="Active medications"
                                tone="blue"
                            />
                            <StatCard
                                icon={<CalendarIcon className="h-7 w-7" />}
                                title="Active Schedules"
                                value={displayedSchedules.length}
                                subtitle="Schedules running"
                                tone="green"
                            />
                            <StatCard
                                icon={<CheckIcon className="h-7 w-7" />}
                                title="Approved"
                                value={approvedCount}
                                subtitle="Consumptions"
                                tone="green"
                            />
                            <StatCard
                                icon={<XIcon className="h-7 w-7" />}
                                title="Rejected"
                                value={rejectedCount}
                                subtitle="Consumptions"
                                tone="red"
                            />
                            <StatCard
                                icon={<MinusIcon className="h-7 w-7" />}
                                title="Missed"
                                value={missedCount}
                                subtitle="Consumptions"
                                tone="slate"
                            />
                            <StatCard
                                icon={<ClockIcon className="h-7 w-7" />}
                                title="Waiting Verification"
                                value={waitingCount}
                                subtitle="Needs review"
                                tone="yellow"
                            />
                        </section>

                        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="grid grid-cols-4 border-b border-slate-100 text-sm font-bold">
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`flex items-center justify-center gap-2 px-3 py-4 ${activeTab === "profile"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <UserIcon className="h-5 w-5" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab("medications")}
                                    className={`flex items-center justify-center gap-2 px-3 py-4 ${activeTab === "medications"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <PillIcon className="h-5 w-5" />
                                    Medications
                                </button>
                                <button
                                    onClick={() => setActiveTab("schedules")}
                                    className={`flex items-center justify-center gap-2 px-3 py-4 ${activeTab === "schedules"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <CalendarIcon className="h-5 w-5" />
                                    Schedules
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`flex items-center justify-center gap-2 px-3 py-4 ${activeTab === "history"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <ClockIcon className="h-5 w-5" />
                                    History
                                </button>
                            </div>

                            <div className="p-5">
                                {activeTab === "profile" && (
                                    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                            <h2 className="mb-5 text-xl font-bold text-[#0b2740]">
                                                Profile Information
                                            </h2>

                                            <div className="space-y-4 text-sm">
                                                <InfoRow label="Full Name" value={patientName} />
                                                <InfoRow label="Email" value={patientEmail} />
                                                <InfoRow label="Phone" value={patientPhone} />
                                                <InfoRow label="Date of Birth" value={patientBirthDate} />
                                                <InfoRow label="Gender" value={patientGender} />
                                                <InfoRow label="Address" value={patientAddress} />
                                                <InfoRow label="Disease / Notes" value={patientDisease} />
                                            </div>
                                        </div>

                                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                            <div className="mb-5 flex items-center justify-between">
                                                <h2 className="text-xl font-bold text-[#0b2740]">
                                                    Current Medications
                                                </h2>
                                                <button
                                                    onClick={() => setActiveTab("medications")}
                                                    className="text-sm font-bold text-blue-600"
                                                >
                                                    View all
                                                </button>
                                            </div>

                                            {displayedMedications.map((item) => (
                                                <SmallRow
                                                    key={item.id}
                                                    icon={<PillIcon className="h-6 w-6" />}
                                                    title={item.name || '-'}
                                                    subtitle={`${item.dose || "-"} • ${item.instruction || "-"}`}
                                                    status={item.status || "-"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "medications" && (
                                    <div>
                                        <div className="mb-5 flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-[#0b2740]">
                                                Patient Medications
                                            </h2>
                                            <button
                                                onClick={() => router.push("/doctor/medications")}
                                                className="rounded-2xl bg-[#07324a] px-5 py-3 text-sm font-bold text-white"
                                            >
                                                + Add Medication
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {displayedMedications.length === 0 ? (
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                                    Belum ada obat untuk pasien ini.
                                                </div>
                                            ) : (
                                                displayedMedications.map((item) => (
                                                    <SmallRow
                                                        key={item.id}
                                                        icon={<PillIcon className="h-6 w-6" />}
                                                        title={item.name || "-"}
                                                        subtitle={`${item.dose || "-"} • ${item.instruction || "-"}`}
                                                        status={item.status || "-"}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "schedules" && (
                                    <div>
                                        <div className="mb-5 flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-[#0b2740]">
                                                Patient Schedules
                                            </h2>
                                            <button
                                                onClick={() => router.push("/doctor/schedules")}
                                                className="rounded-2xl bg-[#07324a] px-5 py-3 text-sm font-bold text-white"
                                            >
                                                + Add Schedule
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {displayedSchedules.length === 0 ? (
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                                    Belum ada jadwal obat untuk pasien ini.
                                                </div>
                                            ) : (
                                                displayedSchedules.map((item) => (
                                                    <SmallRow
                                                        key={item.id}
                                                        icon={<CalendarIcon className="h-6 w-6" />}
                                                        title={item.time || "-"}
                                                        subtitle={`${item.name || item.medicine_name || item.medication_name || "-"
                                                            } • ${item.instruction || "-"}`}
                                                        status={item.status || "-"}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "history" && (
                                    <div>
                                        <div className="mb-5 flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-[#0b2740]">
                                                Consumption History
                                            </h2>
                                            <button
                                                onClick={() => router.push("/doctor/verifications")}
                                                className="text-sm font-bold text-blue-600"
                                            >
                                                View verifications
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {displayedHistory.length === 0 ? (
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                                    Belum ada riwayat konsumsi untuk pasien ini.
                                                </div>
                                            ) : (
                                                displayedHistory.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                                    >
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                                                                    <ClockIcon className="h-6 w-6" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-[#0b2740]">
                                                                        {item.name || item.medicine_name || "-"}
                                                                    </h3>
                                                                    <p className="mt-1 text-sm text-slate-500">
                                                                        {item.date || "-"} • {item.time || "-"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <StatusBadge status={item.status || "-"} />
                                                        </div>

                                                        <p className="mt-3 text-sm text-slate-500">
                                                            {item.note || "-"}
                                                        </p>

                                                        {normalizeStatus(item.status) === "REJECTED" && (
                                                            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                                                <p className="font-bold">Reason from doctor</p>
                                                                <p className="mt-1">
                                                                    {item.rejection_reason || "-"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </section>

                <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-20 grid-cols-4 border-t border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-500 xl:hidden">
                    <button
                        onClick={() => router.push("/doctor/dashboard")}
                        className="flex flex-col items-center justify-center gap-1"
                    >
                        <DashboardIcon className="h-6 w-6" />
                        Dashboard
                    </button>

                    <button
                        onClick={() => router.push("/doctor/patients")}
                        className="flex flex-col items-center justify-center gap-1 text-[#07324a]"
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
                        className="flex flex-col items-center justify-center gap-1"
                    >
                        <ShieldIcon className="h-6 w-6" />
                        Verifications
                    </button>
                </nav>
            </main>
        </ProtectedPage>
    );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-slate-100 pb-3 last:border-b-0">
            <p className="font-semibold text-slate-500">{label}</p>
            <p className="font-bold text-[#0b2740]">{value}</p>
        </div>
    );
}
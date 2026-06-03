"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Patient = {
    id: string;
    user_id?: string;
    full_name?: string;
    name?: string;
    age?: number;
    user?: {
        id?: string;
        email?: string;
    };
};

type Medication = {
    id: string;
    name: string;
    stock?: number;
    slot_number?: number;
};

type Schedule = {
    id: string;
    patient_id?: string;
    medicine_id?: string;
    medication_id?: string;
    doctor_id?: string;
    dose?: string;
    time?: string;
    times?: string[];
    status?: string;
    frequency?: string;
    notes?: string;
    instruction?: string;
    start_date?: string;
    end_date?: string;
    created_at?: string;
    patient?: Patient;
    medicine?: Medication;
    medication?: Medication;
    patient_name?: string;
    medicine_name?: string;
    medication_name?: string;
};

type ScheduleForm = {
    patient_id: string;
    medicine_id: string;
    dose: string;
    start_date: string;
    end_date: string;
    times: string;
};

const SCHEDULES_ENDPOINT = "/schedules";
const PATIENTS_ENDPOINT = "/patients";
const MEDICATIONS_ENDPOINT = "/medications";
const SCHEDULES_EXPORT_ENDPOINT = "/schedules/export";


const emptyForm: ScheduleForm = {
    patient_id: "",
    medicine_id: "",
    dose: "",
    start_date: "",
    end_date: "",
    times: "",
};

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

    if (normalized === "APPROVED") return "bg-green-50 text-green-700";
    if (normalized === "WAITING_VERIFICATION") return "bg-amber-50 text-amber-700";
    if (normalized === "PENDING") return "bg-blue-50 text-blue-700";
    if (normalized === "REJECTED" || normalized === "MISSED") return "bg-red-50 text-red-600";

    return "bg-slate-100 text-slate-600";
}

function getPatientName(schedule: Schedule, patients?: Patient[]) {
    if (patients) {
        const matchedPatient = findPatientBySchedule(schedule, patients);

        if (matchedPatient) {
            return matchedPatient.full_name || matchedPatient.name || "Patient";
        }
    }

    return schedule.patient?.full_name || schedule.patient?.name || schedule.patient_name || "Patient";
}

function getMedicationName(schedule: Schedule, medications?: Medication[]) {
    if (medications) {
        const matchedMedication = findMedicationBySchedule(schedule, medications);

        if (matchedMedication) {
            return matchedMedication.name;
        }
    }

    return (
        schedule.medicine?.name ||
        schedule.medication?.name ||
        schedule.medicine_name ||
        schedule.medication_name ||
        "Medication"
    );
}

function findPatientBySchedule(schedule: Schedule, patients: Patient[]) {
    return patients.find((patient) => {
        const possiblePatientIds = [
            patient.id,
            patient.user_id,
            patient.user?.id,
        ].filter(Boolean);

        return possiblePatientIds.includes(schedule.patient_id || "");
    });
}

function findMedicationBySchedule(schedule: Schedule, medications: Medication[]) {
    return medications.find((medication) => {
        const possibleMedicationIds = [
            medication.id,
        ].filter(Boolean);

        return possibleMedicationIds.includes(
            schedule.medicine_id || schedule.medication_id || ""
        );
    });
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
    if (!time) return "-";

    if (time.includes("AM") || time.includes("PM")) return time;

    const [hourRaw, minuteRaw] = time.split(":");
    const hour = Number(hourRaw);
    const minute = minuteRaw || "00";
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
}

function getExcelFileName(response: Response) {
    const contentDisposition = response.headers.get("Content-Disposition");

    if (!contentDisposition) {
        const today = new Date().toISOString().slice(0, 10);
        return `jadwal_obat_${today}.xlsx`;
    }

    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
    if (filenameStarMatch?.[1]) {
        return decodeURIComponent(filenameStarMatch[1]);
    }

    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch?.[1]) {
        return filenameMatch[1];
    }

    const today = new Date().toISOString().slice(0, 10);
    return `jadwal_obat_${today}.xlsx`;
}

function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

function isDateBefore(date: string, compareDate: string) {
    return date < compareDate;
}

function isValidScheduleDateRange(startDate: string, endDate: string) {
    const today = getTodayDateString();

    if (isDateBefore(startDate, today)) {
        return "Start date tidak boleh sebelum hari ini.";
    }

    if (isDateBefore(endDate, today)) {
        return "End date tidak boleh sebelum hari ini.";
    }

    if (isDateBefore(endDate, startDate)) {
        return "End date tidak boleh lebih awal dari start date.";
    }

    return "";
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

function UploadIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V5" />
            <path d="m7 10 5-5 5 5" />
            <path d="M20 16.5a4 4 0 0 0-4-4h-1.2A6 6 0 0 0 3 14a4 4 0 0 0 4 4h1" />
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

function EditIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
    );
}

function TrashIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 15H6L5 6" />
            <path d="M10 11v6M14 11v6" />
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

function StatItem({
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
    tone: "blue" | "green" | "yellow" | "red";
}) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-500",
        green: "bg-green-50 text-green-600",
        yellow: "bg-amber-50 text-amber-500",
        red: "bg-red-50 text-red-500",
    }[tone];

    return (
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <p className="mt-1 text-3xl font-bold text-[#0b2740]">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status?: string }) {
    return (
        <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${statusStyle(status)}`}>
            {statusLabel(status)}
        </span>
    );
}

export default function DoctorSchedulesPage() {
    const router = useRouter();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [schedulesFromApi, setSchedulesFromApi] = useState<Schedule[]>([]);
    const [patientsFromApi, setPatientsFromApi] = useState<Patient[]>([]);
    const [medicationsFromApi, setMedicationsFromApi] = useState<Medication[]>([]);

    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const [search, setSearch] = useState("");
    const [patientFilter, setPatientFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [exportingExcel, setExportingExcel] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [form, setForm] = useState<ScheduleForm>(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const patients = patientsFromApi;
    const medications = medicationsFromApi;
    const schedules = schedulesFromApi;

    const filteredSchedules = useMemo(() => {
        const q = search.toLowerCase().trim();

        return schedules.filter((schedule) => {
            const patientName = getPatientName(schedule, patients);
            const medicationName = getMedicationName(schedule, medications);

            const matchSearch =
                !q ||
                patientName.toLowerCase().includes(q) ||
                medicationName.toLowerCase().includes(q) ||
                schedule.notes?.toLowerCase().includes(q) ||
                schedule.instruction?.toLowerCase().includes(q);

            const matchPatient = patientFilter === "ALL" || patientName === patientFilter;
            const matchStatus = statusFilter === "ALL" || normalizeStatus(schedule.status) === statusFilter;

            return matchSearch && matchPatient && matchStatus;
        });
    }, [schedules, patients, medications, search, patientFilter, statusFilter]);

    const patientOptions = useMemo(() => {
        return Array.from(
            new Set(schedules.map((item) => getPatientName(item, patients)))
        );
    }, [schedules, patients]);

    const totalSchedules = schedules.length;
    const pendingCount = schedules.filter((item) => normalizeStatus(item.status) === "PENDING").length;
    const waitingCount = schedules.filter((item) => normalizeStatus(item.status) === "WAITING_VERIFICATION").length;
    const approvedCount = schedules.filter((item) => normalizeStatus(item.status) === "APPROVED").length;
    const issueCount = schedules.filter((item) => {
        const status = normalizeStatus(item.status);
        return status === "MISSED" || status === "REJECTED";
    }).length;

    const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
    const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

    async function fetchPageData() {
        try {
            setLoading(true);
            setApiError("");

            const [scheduleRes, patientRes, medicationRes] = await Promise.allSettled([
                apiFetch(SCHEDULES_ENDPOINT, { method: "GET" }),
                apiFetch(PATIENTS_ENDPOINT, { method: "GET" }),
                apiFetch(MEDICATIONS_ENDPOINT, { method: "GET" }),
            ]);

            if (scheduleRes.status === "fulfilled") {
                const result = Array.isArray(scheduleRes.value)
                    ? scheduleRes.value
                    : scheduleRes.value?.data || scheduleRes.value?.schedules || scheduleRes.value?.items || [];

                setSchedulesFromApi(Array.isArray(result) ? result : []);
            }

            if (patientRes.status === "fulfilled") {
                const result = Array.isArray(patientRes.value)
                    ? patientRes.value
                    : patientRes.value?.data || patientRes.value?.patients || patientRes.value?.items || [];

                setPatientsFromApi(Array.isArray(result) ? result : []);
            }

            if (medicationRes.status === "fulfilled") {
                const result = Array.isArray(medicationRes.value)
                    ? medicationRes.value
                    : medicationRes.value?.data || medicationRes.value?.medications || medicationRes.value?.items || [];

                setMedicationsFromApi(Array.isArray(result) ? result : []);
            }

            const failed = [scheduleRes, patientRes, medicationRes].some(
                (item) => item.status === "rejected"
            );

            if (failed) {
                setApiError("Sebagian endpoint schedules belum terbaca. Data akan tampil jika endpoint tersedia.");
            }
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Gagal mengambil data schedule.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPageData();
    }, []);

    function handleLogout() {
        logout();
        router.replace("/sign-in");
    }

    function openCreateForm() {
        const today = getTodayDateString();

        setEditingSchedule(null);
        setForm({
            ...emptyForm,
            start_date: today,
            end_date: today,
        });
        setFormError("");
        setIsFormOpen(true);
    }

    function openEditForm(schedule: Schedule) {
        setEditingSchedule(schedule);

        setForm({
            patient_id: schedule.patient_id || schedule.patient?.id || "",
            medicine_id:
                schedule.medicine_id ||
                schedule.medication_id ||
                schedule.medicine?.id ||
                schedule.medication?.id ||
                "",
            dose: schedule.dose || "1 tablet",
            start_date: schedule.start_date?.slice(0, 10) || getTodayDateString(),
            end_date: schedule.end_date?.slice(0, 10) || schedule.start_date?.slice(0, 10) || getTodayDateString(),
            times: schedule.time || schedule.times?.join(",") || "",
        });

        setFormError("");
        setIsFormOpen(true);
    }

    function closeForm() {
        setEditingSchedule(null);
        setForm(emptyForm);
        setFormError("");
        setIsFormOpen(false);
    }

    async function handleSubmitSchedule(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (
            !form.patient_id ||
            !form.medicine_id ||
            !form.dose ||
            !form.start_date ||
            !form.end_date ||
            !form.times
        ) {
            setFormError("Patient, medication, dose, start date, end date, dan times wajib diisi.");
            return;
        }

        const dateValidationMessage = isValidScheduleDateRange(
            form.start_date,
            form.end_date
        );

        if (dateValidationMessage) {
            setFormError(dateValidationMessage);
            return;
        }

        try {
            setSubmitting(true);
            setFormError("");

            const times = form.times
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            const payload = {
                patient_id: form.patient_id,
                medicine_id: form.medicine_id,
                dose: form.dose,
                start_date: form.start_date,
                end_date: form.end_date,
                times,
            };

            if (editingSchedule) {
                await apiFetch(`${SCHEDULES_ENDPOINT}/${editingSchedule.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch(SCHEDULES_ENDPOINT, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }

            await fetchPageData();
            closeForm();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Gagal menyimpan schedule.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteSchedule(schedule: Schedule) {
        const confirmDelete = window.confirm(`Hapus schedule ${getMedicationName(schedule)}?`);
        if (!confirmDelete) return;

        try {
            await apiFetch(`${SCHEDULES_ENDPOINT}/${schedule.id}`, {
                method: "DELETE",
            });

            setSchedulesFromApi((prev) => prev.filter((item) => item.id !== schedule.id));
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Schedule tidak bisa dihapus karena sudah memiliki riwayat konsumsi."
            );
        }
    }

    async function handleExportExcel() {
        try {
            setExportingExcel(true);

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Token tidak ditemukan. Silakan login ulang.");
            }

            if (fromDate && toDate && fromDate > toDate) {
                throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
            }

            const params = new URLSearchParams();

            if (statusFilter !== "ALL") {
                params.set("status", statusFilter);
            }

            if (fromDate) {
                params.set("from", fromDate);
            }

            if (toDate) {
                params.set("to", toDate);
            }

            if (patientFilter !== "ALL") {
                const selectedPatient = patients.find((patient) => {
                    const patientName = patient.full_name || patient.name || "Patient";
                    return patientName === patientFilter;
                });

                if (selectedPatient?.id) {
                    params.set("patientId", selectedPatient.id);
                }
            }

            const queryString = params.toString();

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${SCHEDULES_EXPORT_ENDPOINT}${queryString ? `?${queryString}` : ""}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text().catch(() => "");
                throw new Error(errorText || "Gagal export Excel.");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = getExcelFileName(response);

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Gagal export Excel.");
        } finally {
            setExportingExcel(false);
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
                                active
                                collapsed={isSidebarCollapsed}
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


                                <div className="flex items-center gap-3">
                                    {/* DOCTOR IMAGE PLACEHOLDER */}
                                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                        DR
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-bold text-[#0b2740]">Doctor</p>
                                        <p className="text-xs text-slate-500">Medical Staff</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                                    Medication Schedules
                                </h1>
                                <p className="mt-3 text-base text-slate-500 md:text-lg">
                                    Manage and review medication schedules for your patients.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 md:w-fit md:flex-row">
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    disabled={exportingExcel}
                                    className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-[#0b2740] shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
                                >
                                    <UploadIcon className="h-5 w-5" />
                                    {exportingExcel ? "Exporting..." : "Export Excel"}
                                </button>

                                <button
                                    type="button"
                                    onClick={openCreateForm}
                                    className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700 md:w-fit"
                                >
                                    <CalendarIcon className="h-5 w-5" />
                                    Create Schedule
                                </button>
                            </div>
                        </section>

                        {apiError && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                {apiError}
                            </div>
                        )}

                        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.85fr_0.75fr_0.65fr_0.65fr_0.55fr]">
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search schedules..."
                                    className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-13 pr-4 text-sm font-medium outline-none focus:border-[#07324a]"
                                />
                            </div>

                            <div className="relative">
                                <UserIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <select
                                    value={patientFilter}
                                    onChange={(e) => setPatientFilter(e.target.value)}
                                    className="h-[52px] w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-13 pr-10 text-sm font-bold text-[#0b2740] outline-none"
                                >
                                    <option value="ALL">All Patients</option>
                                    {patientOptions.map((patient) => (
                                        <option key={patient} value={patient}>
                                            {patient}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            </div>

                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-[52px] w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-[#0b2740] outline-none"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="WAITING_VERIFICATION">Waiting Verification</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="MISSED">Missed</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            </div>

                            <div className="relative">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] outline-none focus:border-[#07324a]"
                                    title="From date"
                                />
                            </div>

                            <div className="relative">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] outline-none focus:border-[#07324a]"
                                    title="To date"
                                />
                            </div>

                            <button
                                onClick={fetchPageData}
                                className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
                            >
                                Refresh
                            </button>
                        </section>

                        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <StatItem
                                icon={<CalendarIcon className="h-7 w-7" />}
                                title="Total Schedules"
                                value={totalSchedules}
                                subtitle="All patients"
                                tone="blue"
                            />
                            <StatItem
                                icon={<ClockIcon className="h-7 w-7" />}
                                title="Pending"
                                value={pendingCount}
                                subtitle="Awaiting action"
                                tone="yellow"
                            />
                            <StatItem
                                icon={<UploadIcon className="h-7 w-7" />}
                                title="Waiting Verification"
                                value={waitingCount}
                                subtitle="Patient uploads"
                                tone="blue"
                            />
                            <StatItem
                                icon={<CheckIcon className="h-7 w-7" />}
                                title="Approved"
                                value={approvedCount}
                                subtitle="On track"
                                tone="green"
                            />
                            <StatItem
                                icon={<XIcon className="h-7 w-7" />}
                                title="Missed / Rejected"
                                value={issueCount}
                                subtitle="Requires attention"
                                tone="red"
                            />
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5">
                                <h2 className="text-xl font-bold text-[#0b2740]">
                                    Schedules ({filteredSchedules.length})
                                </h2>
                            </div>

                            <div className="hidden overflow-x-auto xl:block">
                                <table className="w-full min-w-[920px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-sm text-slate-500">
                                            <th className="px-5 py-4 font-semibold">Patient</th>
                                            <th className="px-5 py-4 font-semibold">Medication</th>
                                            <th className="px-5 py-4 font-semibold">Date & Time</th>
                                            <th className="px-5 py-4 font-semibold">Frequency</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className="px-5 py-4 font-semibold">Notes</th>
                                            <th className="px-5 py-4 font-semibold">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                                    Loading schedules...
                                                </td>
                                            </tr>
                                        ) : filteredSchedules.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                                    No schedules found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSchedules.map((schedule) => {
                                                const patientName = getPatientName(schedule, patients);

                                                return (
                                                    <tr key={schedule.id} className="border-b border-slate-100 last:border-b-0">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                                    {getInitials(patientName)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[#0b2740]">{patientName}</p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {schedule.patient?.age || "-"} years
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-[#0b2740]">
                                                                {getMedicationName(schedule, medications)}
                                                            </p>
                                                            <p className="text-sm text-slate-500">{schedule.dose || "1 tablet"}</p>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="flex items-center gap-2 text-sm font-semibold text-[#0b2740]">
                                                                <CalendarIcon className="h-4 w-4 text-slate-500" />
                                                                {schedule.created_at
                                                                    ? new Date(schedule.created_at).toLocaleDateString("id-ID")
                                                                    : "-"}
                                                            </p>
                                                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                                                <ClockIcon className="h-4 w-4" />
                                                                {formatTime(schedule.time || schedule.times?.[0])}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-slate-500">
                                                            {schedule.frequency || "Once daily"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge status={schedule.status} />
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-slate-500">
                                                            {schedule.notes || schedule.instruction || "-"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => openEditForm(schedule)}
                                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <EditIcon className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSchedule(schedule)}
                                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-4 p-4 xl:hidden">
                                {loading ? (
                                    <div className="py-8 text-center text-slate-500">
                                        Loading schedules...
                                    </div>
                                ) : filteredSchedules.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500">
                                        No schedules found.
                                    </div>
                                ) : (
                                    filteredSchedules.map((schedule) => {
                                        const patientName = getPatientName(schedule, patients);

                                        return (
                                            <article
                                                key={schedule.id}
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
                                                            <p className="mt-1 text-lg text-slate-500">
                                                                {getMedicationName(schedule, medications)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <StatusBadge status={schedule.status} />
                                                </div>

                                                <div className="mt-5 flex flex-wrap items-center gap-4 text-slate-500">
                                                    <p className="flex items-center gap-2">
                                                        <CalendarIcon className="h-5 w-5" />
                                                        {schedule.created_at
                                                            ? new Date(schedule.created_at).toLocaleDateString("id-ID")
                                                            : "-"}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <ClockIcon className="h-5 w-5" />
                                                        {formatTime(schedule.time || schedule.times?.[0])}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        ↻ {schedule.frequency || "Once daily"}
                                                    </p>
                                                </div>

                                                <p className="mt-4 text-slate-500">
                                                    {schedule.notes || schedule.instruction || "-"}
                                                </p>

                                                <div className="mt-5 grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => openEditForm(schedule)}
                                                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-bold text-blue-600"
                                                    >
                                                        <EditIcon className="h-5 w-5" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteSchedule(schedule)}
                                                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-100 text-sm font-bold text-red-500"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                                <p>
                                    Showing 1 to {filteredSchedules.length} of {schedules.length} schedules
                                </p>

                                <div className="flex items-center gap-2">
                                    <button className="h-9 w-9 rounded-xl border border-slate-200">‹</button>
                                    <button className="h-9 w-9 rounded-xl bg-blue-600 text-white">1</button>
                                    <button className="h-9 w-9 rounded-xl border border-slate-200">2</button>
                                    <button className="h-9 w-9 rounded-xl border border-slate-200">3</button>
                                    <button className="h-9 w-9 rounded-xl border border-slate-200">›</button>
                                </div>
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

                    <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
                        <CalendarIcon className="h-6 w-6" />
                        Schedules
                    </button>

                    <button
                        onClick={() => router.push("/doctor/verifications")}
                        className="relative flex flex-col items-center justify-center gap-1"
                    >
                        <ShieldIcon className="h-6 w-6" />
                        Verifications
                    </button>

                    <button className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">•••</span>
                        More
                    </button>
                </nav>

                {isFormOpen && (
                    <div className="fixed inset-0 z-40 flex items-end bg-black/20 xl:items-center xl:justify-center">
                        <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl xl:max-w-[560px] xl:rounded-3xl">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#151821]">
                                        {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Assign medication times for a patient.
                                    </p>
                                </div>

                                <button onClick={closeForm} className="text-2xl text-slate-500">
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSchedule} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                        Patient
                                    </label>
                                    <select
                                        value={form.patient_id}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, patient_id: e.target.value }))
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                    >
                                        <option value="">Select patient</option>
                                        {patients.map((patient) => (
                                            <option key={patient.id} value={patient.user_id || patient.user?.id || patient.id}>
                                                {patient.full_name || patient.name || "Unnamed Patient"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                        Medication
                                    </label>
                                    <select
                                        value={form.medicine_id}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, medicine_id: e.target.value }))
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                    >
                                        <option value="">Select medication</option>
                                        {medications.map((medication) => (
                                            <option key={medication.id} value={medication.id}>
                                                {medication.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                        Dose
                                    </label>
                                    <input
                                        value={form.dose}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, dose: e.target.value }))
                                        }
                                        placeholder="e.g., 1 tablet"
                                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={form.start_date || ""}
                                            min={getTodayDateString()}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                setForm((prev) => ({
                                                    ...prev,
                                                    start_date: value,
                                                    end_date:
                                                        prev.end_date && prev.end_date < value
                                                            ? ""
                                                            : prev.end_date,
                                                }));

                                                setFormError("");
                                            }}
                                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={form.end_date || ""}
                                            min={form.start_date || getTodayDateString()}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, end_date: e.target.value }));
                                                setFormError("");
                                            }}
                                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs leading-5 text-slate-500">
                                    Start date dan end date tidak boleh sebelum hari ini. End date juga tidak boleh lebih awal dari start date.
                                </p>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                        Times
                                    </label>
                                    <input
                                        value={form.times}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, times: e.target.value }))
                                        }
                                        placeholder="08:00,12:00,18:00"
                                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        Pisahkan banyak jam dengan koma. Contoh: 08:00,12:00,18:00
                                    </p>
                                </div>

                                {formError && (
                                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {formError}
                                    </div>
                                )}


                                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="h-12 rounded-2xl border border-slate-300 bg-white px-8 text-sm font-bold text-[#0b2740]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-12 rounded-2xl bg-[#07324a] px-8 text-sm font-bold text-white disabled:opacity-60"
                                    >
                                        {submitting
                                            ? "Saving..."
                                            : editingSchedule
                                                ? "Save Changes"
                                                : "Create Schedule"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </ProtectedPage>
    );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Patient = {
    id: string;
    user_id?: string;
    username?: string;
    full_name?: string;
    name?: string;
    age?: number;
    main_disease?: string;
    disease_note?: string;
    whatsapp_number?: string;
    phone?: string;
    deleted_at?: string | null;
    user?: {
        id?: string;
        email?: string;
        username?: string;
        role?: string;
        created_at?: string;
    };
    email?: string;
    gender?: string;
    latest_status?: string;
    pending_verification?: number;
};

type PatientForm = {
    full_name: string;
    email: string;
    password: string;
    age: string;
    main_disease: string;
    whatsapp_number: string;
};

const PATIENTS_ENDPOINT = "/patients";

const emptyForm: PatientForm = {
    full_name: "",
    email: "",
    password: "",
    age: "",
    main_disease: "",
    whatsapp_number: "",
};

function getPatientName(patient: Patient) {
    return patient.full_name || patient.name || "Unnamed Patient";
}

function getPatientEmail(patient: Patient) {
    return patient.user?.email || patient.email || "-";
}

function getPatientDisease(patient: Patient) {
    return patient.main_disease || patient.disease_note || "-";
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

    if (normalized === "APPROVED") return "bg-green-50 text-green-700";
    if (normalized === "WAITING_VERIFICATION") return "bg-blue-50 text-blue-700";
    if (normalized === "PENDING") return "bg-amber-50 text-amber-700";
    if (normalized === "REJECTED") return "bg-red-50 text-red-600";
    if (normalized === "MISSED") return "bg-slate-100 text-slate-600";

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

function EyeIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
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
    tone: "blue" | "green" | "yellow" | "red";
}) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-500",
        green: "bg-green-50 text-green-600",
        yellow: "bg-amber-50 text-amber-500",
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

function StatusBadge({ status }: { status?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${statusStyle(status)}`}>
            {statusLabel(status)}
        </span>
    );
}

export default function DoctorPatientsPage() {
    const router = useRouter();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [patientsFromApi, setPatientsFromApi] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const patients = patientsFromApi;

    const filteredPatients = useMemo(() => {
        const q = search.toLowerCase().trim();

        return patients.filter((patient) => {
            const matchSearch =
                !q ||
                getPatientName(patient).toLowerCase().includes(q) ||
                getPatientEmail(patient).toLowerCase().includes(q) ||
                getPatientDisease(patient).toLowerCase().includes(q);

            const matchStatus =
                statusFilter === "ALL" ||
                normalizeStatus(patient.latest_status) === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [patients, search, statusFilter]);

    const totalPatients = patients.length;
    const activePatients = patients.filter(
        (p) => normalizeStatus(p.latest_status) === "APPROVED"
    ).length;
    const waitingPatients = patients.filter(
        (p) => normalizeStatus(p.latest_status) === "WAITING_VERIFICATION"
    ).length;
    const rejectedPatients = patients.filter(
        (p) => normalizeStatus(p.latest_status) === "REJECTED"
    ).length;

    const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
    const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

    async function fetchPatients() {
        try {
            setLoading(true);
            setApiError("");

            const data = await apiFetch(PATIENTS_ENDPOINT, {
                method: "GET",
            });

            const result = Array.isArray(data)
                ? data
                : data?.data || data?.patients || data?.items || [];

            setPatientsFromApi(Array.isArray(result) ? result : []);
        } catch (err) {
            setApiError(
                err instanceof Error ? err.message : "Gagal mengambil data pasien."
            );
            setPatientsFromApi([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPatients();
    }, []);

    function handleLogout() {
        logout();
        router.replace("/sign-in");
    }

    function openAddModal() {
        setEditingPatient(null);
        setForm(emptyForm);
        setFormError("");
        setIsModalOpen(true);
    }

    function openEditModal(patient: Patient) {
        setEditingPatient(patient);
        setForm({
            full_name: getPatientName(patient),
            email: getPatientEmail(patient),
            password: "",
            age: String(patient.age || ""),
            main_disease: getPatientDisease(patient),
            whatsapp_number: patient.whatsapp_number || patient.phone || "",
        });
        setFormError("");
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingPatient(null);
        setForm(emptyForm);
        setFormError("");
    }

    async function handleSubmitPatient(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (editingPatient) {
            if (!form.full_name || !form.age || !form.main_disease || !form.whatsapp_number) {
                setFormError("Nama, umur, penyakit, dan nomor WhatsApp wajib diisi.");
                return;
            }
        } else {
            if (
                !form.full_name ||
                !form.email ||
                !form.password ||
                !form.age ||
                !form.main_disease ||
                !form.whatsapp_number
            ) {
                setFormError("Semua field wajib diisi.");
                return;
            }
        }

        try {
            setSubmitting(true);
            setFormError("");

            if (editingPatient) {
                const updatePayload = {
                    full_name: form.full_name,
                    age: Number(form.age),
                    main_disease: form.main_disease,
                    whatsapp_number: form.whatsapp_number,
                };

                await apiFetch(`${PATIENTS_ENDPOINT}/${editingPatient.id}`, {
                    method: "PUT",
                    body: JSON.stringify(updatePayload),
                });
            } else {
                const createPayload = {
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    age: Number(form.age),
                    main_disease: form.main_disease,
                    whatsapp_number: form.whatsapp_number,
                };

                await apiFetch(PATIENTS_ENDPOINT, {
                    method: "POST",
                    body: JSON.stringify(createPayload),
                });
            }

            await fetchPatients();
            closeModal();
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : "Gagal menyimpan data pasien."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePatient(patient: Patient) {
        const confirmDelete = window.confirm(
            `Hapus pasien ${getPatientName(patient)}?`
        );

        if (!confirmDelete) return;

        try {
            await apiFetch(`${PATIENTS_ENDPOINT}/${patient.id}`, {
                method: "DELETE",
            });

            setPatientsFromApi((prev) => prev.filter((item) => item.id !== patient.id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Gagal menghapus pasien.");
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
                                active
                                collapsed={isSidebarCollapsed}
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
                                <button className="relative text-slate-500">
                                    <BellIcon className="h-6 w-6" />
                                    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-blue-500" />
                                </button>

                                <div className="flex items-center gap-3">
                                    {/* DOCTOR IMAGE PLACEHOLDER */}
                                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                        DA
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-bold text-[#0b2740]">Dr. Andi</p>
                                        <p className="text-xs text-slate-500">General Practitioner</p>
                                    </div>
                                    <ChevronRight className="hidden h-4 w-4 rotate-90 text-slate-500 md:block" />
                                </div>
                            </div>
                        </header>

                        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                                    Patients
                                </h1>
                                <p className="mt-3 text-base text-slate-500 md:text-lg">
                                    Manage and monitor your patients.
                                </p>
                            </div>

                            <button
                                onClick={openAddModal}
                                className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 md:w-fit"
                            >
                                <UserPlusIcon className="h-6 w-6" />
                                Add Patient
                            </button>
                        </section>

                        {apiError && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                API pasien belum terbaca: {apiError}. Untuk sementara memakai data contoh.
                            </div>
                        )}

                        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr_0.8fr]">
                                <div className="relative">
                                    <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search patients by name, email, or disease..."
                                        className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-13 pr-4 text-sm font-medium outline-none focus:border-[#07324a]"
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] outline-none"
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="WAITING_VERIFICATION">Waiting Verification</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                </div>

                                <button
                                    onClick={fetchPatients}
                                    className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
                                >
                                    Refresh Data
                                </button>
                            </div>
                        </section>

                        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={<UserIcon className="h-7 w-7" />}
                                title="Total Patients"
                                value={totalPatients}
                                subtitle="+8 this week"
                                tone="blue"
                            />
                            <StatCard
                                icon={<CheckIcon className="h-7 w-7" />}
                                title="Active Patients"
                                value={activePatients}
                                subtitle="Currently monitored"
                                tone="green"
                            />
                            <StatCard
                                icon={<ClockIcon className="h-7 w-7" />}
                                title="Waiting Verification"
                                value={waitingPatients}
                                subtitle="Needs review"
                                tone="yellow"
                            />
                            <StatCard
                                icon={<XIcon className="h-7 w-7" />}
                                title="Rejected Patients"
                                value={rejectedPatients}
                                subtitle="Need follow up"
                                tone="red"
                            />
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5">
                                <h2 className="text-xl font-bold text-[#0b2740]">
                                    Patients ({filteredPatients.length})
                                </h2>
                            </div>

                            <div className="hidden overflow-x-auto xl:block">
                                <table className="w-full min-w-[900px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-sm text-slate-500">
                                            <th className="px-5 py-4 font-semibold">Patient</th>
                                            <th className="px-5 py-4 font-semibold">Email</th>
                                            <th className="px-5 py-4 font-semibold">Age</th>
                                            <th className="px-5 py-4 font-semibold">Condition</th>
                                            <th className="px-5 py-4 font-semibold">Latest Status</th>
                                            <th className="px-5 py-4 font-semibold">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                                    Loading patients...
                                                </td>
                                            </tr>
                                        ) : filteredPatients.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                                    No patients found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPatients.map((patient) => {
                                                const name = getPatientName(patient);

                                                return (
                                                    <tr key={patient.id} className="border-b border-slate-100 last:border-b-0">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                                    {getInitials(name)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[#0b2740]">{name}</p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {patient.whatsapp_number || patient.phone || "-"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-slate-500">
                                                            {getPatientEmail(patient)}
                                                        </td>

                                                        <td className="px-5 py-4 font-semibold text-[#0b2740]">
                                                            {patient.age || "-"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="font-semibold text-[#0b2740]">
                                                                {getPatientDisease(patient)}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge status={patient.latest_status || "APPROVED"} />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                                                                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Detail
                                                                </button>
                                                                <button
                                                                    onClick={() => openEditModal(patient)}
                                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <EditIcon className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePatient(patient)}
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
                                        Loading patients...
                                    </div>
                                ) : filteredPatients.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500">
                                        No patients found.
                                    </div>
                                ) : (
                                    filteredPatients.map((patient) => {
                                        const name = getPatientName(patient);

                                        return (
                                            <article
                                                key={patient.id}
                                                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                                                            {getInitials(name)}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-xl font-bold text-[#0b2740]">
                                                                {name}
                                                            </h3>
                                                            <p className="mt-1 text-slate-500">
                                                                {getPatientEmail(patient)}
                                                            </p>
                                                            <p className="mt-2 text-slate-500">
                                                                {patient.age || "-"} yrs • {getPatientDisease(patient)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <StatusBadge status={patient.latest_status || "APPROVED"} />
                                                </div>

                                                <div className="mt-5 grid grid-cols-3 gap-3">
                                                    <button
                                                        onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                                                        className="h-11 rounded-xl border border-slate-200 text-sm font-bold text-blue-600"
                                                    >
                                                        Detail
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(patient)}
                                                        className="h-11 rounded-xl border border-slate-200 text-sm font-bold text-blue-600"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePatient(patient)}
                                                        className="h-11 rounded-xl border border-red-100 text-sm font-bold text-red-500"
                                                    >
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
                                    Showing 1 to {filteredPatients.length} of {patients.length} patients
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
                    <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
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
                            7
                        </span>
                        Verifications
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">•••</span>
                        More
                    </button>
                </nav>

                {isModalOpen && (
                    <div className="fixed inset-0 z-40 flex items-end bg-black/20 xl:items-center xl:justify-center">
                        <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl xl:max-w-[620px] xl:rounded-3xl">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#151821]">
                                        {editingPatient ? "Edit Patient" : "Add Patient"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {editingPatient
                                            ? "Update patient information."
                                            : "Register a new patient and connect them to your monitoring list."}
                                    </p>
                                </div>

                                <button
                                    onClick={closeModal}
                                    className="text-slate-500"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmitPatient} className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            Full Name
                                        </label>
                                        <input
                                            value={form.full_name}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, full_name: e.target.value }))
                                            }
                                            placeholder="Patient full name"
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            Main Disease / Condition
                                        </label>
                                        <input
                                            value={form.main_disease}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, main_disease: e.target.value }))
                                            }
                                            placeholder="Hypertension"
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                        />
                                    </div>
                                </div>

                                {!editingPatient ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, email: e.target.value }))
                                                }
                                                placeholder="patient@example.com"
                                                autoComplete="email"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={form.password}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, password: e.target.value }))
                                                }
                                                placeholder="Create patient password"
                                                autoComplete="new-password"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-[#0b2740]">
                                        Login email and password are not changed from this form. This edit only
                                        updates patient profile information.
                                    </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            Age
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.age}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, age: e.target.value }))
                                            }
                                            placeholder="27"
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                                            WhatsApp Number
                                        </label>
                                        <input
                                            value={form.whatsapp_number}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    whatsapp_number: e.target.value,
                                                }))
                                            }
                                            placeholder="081234567890"
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0b2740] outline-none transition focus:border-[#07324a] focus:ring-4 focus:ring-[#07324a]/10"
                                        />
                                    </div>
                                </div>

                                {formError && (
                                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                        {formError}
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="h-12 rounded-full border border-slate-300 bg-white px-8 text-sm font-bold text-[#0b2740] transition hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-12 rounded-full bg-[#07324a] px-8 text-sm font-bold text-white transition hover:bg-[#05283b] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submitting
                                            ? "Saving..."
                                            : editingPatient
                                                ? "Save Changes"
                                                : "Add Patient"}
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
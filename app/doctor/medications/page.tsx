"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Medication = {
  id: string;
  name: string;
  slot_number?: number;
  stock?: number;
  status?: string;
};

type MedicationForm = {
  name: string;
  slot_number: string;
  stock: string;
};

const MEDICATIONS_ENDPOINT = "/medications";

const emptyForm: MedicationForm = {
  name: "",
  slot_number: "",
  stock: "",
};

function normalizeStatus(status?: string, stock?: number) {
  if (status) return status.toUpperCase();
  if (typeof stock === "number" && stock <= 0) return "EXPIRED";
  if (typeof stock === "number" && stock <= 10) return "ENDING_SOON";
  return "ACTIVE";
}

function statusLabel(status?: string, stock?: number) {
  const normalized = normalizeStatus(status, stock);

  if (normalized === "ENDING_SOON") return "Ending Soon";
  if (normalized === "EXPIRED") return "Expired";
  if (normalized === "INACTIVE") return "Inactive";
  return "Active";
}

function statusStyle(status?: string, stock?: number) {
  const normalized = normalizeStatus(status, stock);

  if (normalized === "ACTIVE") return "bg-green-50 text-green-700";
  if (normalized === "ENDING_SOON") return "bg-amber-50 text-amber-700";
  if (normalized === "EXPIRED" || normalized === "INACTIVE") {
    return "bg-red-50 text-red-600";
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

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

function StatusBadge({ status, stock }: { status?: string; stock?: number }) {
  return (
    <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${statusStyle(status, stock)}`}>
      {statusLabel(status, stock)}
    </span>
  );
}

export default function DoctorMedicationsPage() {
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [medicationsFromApi, setMedicationsFromApi] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [form, setForm] = useState<MedicationForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const medications = medicationsFromApi;

  const filteredMedications = useMemo(() => {
    const q = search.toLowerCase().trim();

    return medications.filter((medication) => {
      return (
        !q ||
        medication.name.toLowerCase().includes(q) ||
        String(medication.slot_number ?? "").includes(q)
      );
    });
  }, [medications, search]);


  const totalMedications = medications.length;
  const activeMedications = medications.filter(
    (item) => normalizeStatus(item.status, item.stock) === "ACTIVE"
  ).length;
  const endingSoon = medications.filter(
    (item) => normalizeStatus(item.status, item.stock) === "ENDING_SOON"
  ).length;
  const expired = medications.filter(
    (item) => normalizeStatus(item.status, item.stock) === "EXPIRED"
  ).length;

  const sidebarWidthClass = isSidebarCollapsed ? "xl:ml-[96px]" : "xl:ml-[272px]";
  const sidebarBaseWidthClass = isSidebarCollapsed ? "w-[96px]" : "w-[272px]";

  async function fetchMedications() {
    try {
      setLoading(true);
      setApiError("");

      const data = await apiFetch(MEDICATIONS_ENDPOINT, {
        method: "GET",
      });

      const result = Array.isArray(data)
        ? data
        : data?.data || data?.medications || data?.items || [];

      setMedicationsFromApi(Array.isArray(result) ? result : []);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data medication."
      );
      setMedicationsFromApi([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMedications();
  }, []);

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  function openAddModal() {
    setEditingMedication(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(medication: Medication) {
    setEditingMedication(medication);
    setForm({
      name: medication.name || "",
      slot_number: String(medication.slot_number || ""),
      stock: String(medication.stock || ""),
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMedication(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmitMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name || !form.slot_number || !form.stock) {
      setFormError("Nama obat, slot number, dan stock wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const payload = {
        name: form.name,
        slot_number: Number(form.slot_number),
        stock: Number(form.stock),
      };

      if (editingMedication) {
        await apiFetch(`${MEDICATIONS_ENDPOINT}/${editingMedication.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(MEDICATIONS_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await fetchMedications();
      closeModal();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan medication."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMedication(medication: Medication) {
    const confirmDelete = window.confirm(`Hapus ${medication.name}?`);
    if (!confirmDelete) return;

    try {
      await apiFetch(`${MEDICATIONS_ENDPOINT}/${medication.id}`, {
        method: "DELETE",
      });

      setMedicationsFromApi((prev) =>
        prev.filter((item) => item.id !== medication.id)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus medication.");
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
                active
                collapsed={isSidebarCollapsed}
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

                <div className="flex items-center gap-3">
                  {/* DOCTOR IMAGE PLACEHOLDER */}
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    DA
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-[#0b2740]">Doctor</p>
                    <p className="text-xs text-slate-500">
                      Medical Staff
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] md:text-[42px]">
                  Medications
                </h1>
                <p className="mt-3 text-base text-slate-500 md:text-lg">
                  Manage and track patient medications.
                </p>
              </div>

              <button
                onClick={openAddModal}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700 md:w-fit"
              >
                <span className="text-xl">+</span>
                Add Medication
              </button>
            </section>

            {apiError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Medication data belum terbaca: {apiError}.
              </div>
            )}

            <section className="mb-6 grid gap-4 xl:grid-cols-[1fr_220px]">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medications by name or patient..."
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-13 pr-4 text-sm font-medium outline-none focus:border-[#07324a]"
                />
              </div>

              <button
                onClick={fetchMedications}
                className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b2740] hover:bg-slate-50"
              >
                Refresh Data
              </button>
            </section>

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<PillIcon className="h-7 w-7" />}
                title="Total Medications"
                value={totalMedications}
                subtitle="Across all patients"
                tone="blue"
              />
              <StatCard
                icon={<CheckIcon className="h-7 w-7" />}
                title="Active Medications"
                value={activeMedications}
                subtitle="Currently active"
                tone="green"
              />
              <StatCard
                icon={<ClockIcon className="h-7 w-7" />}
                title="Ending Soon"
                value={endingSoon}
                subtitle="Stock or course ending"
                tone="yellow"
              />
              <StatCard
                icon={<XIcon className="h-7 w-7" />}
                title="Expired"
                value={expired}
                subtitle="No longer active"
                tone="red"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[920px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
                      <th className="px-5 py-4 font-semibold">Medication</th>
                      <th className="px-5 py-4 font-semibold">Slot</th>
                      <th className="px-5 py-4 font-semibold">Stock</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                          Loading medications...
                        </td>
                      </tr>
                    ) : filteredMedications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                          No medications found.
                        </td>
                      </tr>
                    ) : (
                      filteredMedications.map((medication, index) => (
                        <tr
                          key={medication.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index % 3 === 0
                                  ? "bg-blue-50 text-blue-500"
                                  : index % 3 === 1
                                    ? "bg-purple-50 text-purple-500"
                                    : "bg-red-50 text-red-500"
                                  }`}
                              >
                                <PillIcon className="h-6 w-6" />
                              </div>

                              <div>
                                <p className="font-bold text-[#0b2740]">
                                  {medication.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                  Slot #{medication.slot_number || "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#0b2740]">
                            {medication.slot_number || "-"}
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#0b2740]">
                            {medication.stock ?? "-"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={medication.status}
                              stock={medication.stock}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(medication)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 hover:bg-blue-50"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedication(medication)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 xl:hidden">
                {loading ? (
                  <div className="py-8 text-center text-slate-500">
                    Loading medications...
                  </div>
                ) : filteredMedications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No medications found.
                  </div>
                ) : (
                  filteredMedications.map((medication, index) => (
                    <article
                      key={medication.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-16 w-16 items-center justify-center rounded-full ${index % 3 === 0
                                ? "bg-green-50 text-green-600"
                                : index % 3 === 1
                                  ? "bg-purple-50 text-purple-500"
                                  : "bg-red-50 text-red-500"
                                }`}
                            >
                              <PillIcon className="h-8 w-8" />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold text-[#0b2740]">
                                  {medication.name}
                                </h3>
                                <StatusBadge
                                  status={medication.status}
                                  stock={medication.stock}
                                />
                              </div>

                              <p className="mt-2 text-slate-500">
                                Slot #{medication.slot_number || "-"} • Stock{" "}
                                {medication.stock ?? "-"}
                              </p>
                            </div>
                          </div>

                          <button className="text-2xl text-slate-500">⋮</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-t border-slate-100">
                        <button className="flex h-14 items-center justify-center gap-2 text-sm font-bold text-blue-600">
                          <EyeIcon className="h-5 w-5" />
                          Detail
                        </button>
                        <button
                          onClick={() => openEditModal(medication)}
                          className="flex h-14 items-center justify-center gap-2 border-x border-slate-100 text-sm font-bold text-blue-600"
                        >
                          <EditIcon className="h-5 w-5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMedication(medication)}
                          className="flex h-14 items-center justify-center gap-2 text-sm font-bold text-red-500"
                        >
                          <TrashIcon className="h-5 w-5" />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>
                  Showing 1 to {filteredMedications.length} of {medications.length} medications
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
          <button className="flex flex-col items-center justify-center gap-1 text-[#07324a]">
            <span className="text-2xl">•••</span>
            More
          </button>
        </nav>

        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex items-end bg-black/20 xl:items-center xl:justify-center">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl xl:max-w-[560px] xl:rounded-3xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#151821]">
                    {editingMedication ? "Edit Medication" : "Add Medication"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {editingMedication
                      ? "Update medication stock or slot number."
                      : "Create a new medication record."}
                  </p>
                </div>

                <button onClick={closeModal} className="text-2xl text-slate-500">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitMedication} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                    Medication Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Amoxicillin 500 mg"
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                      Slot Number
                    </label>
                    <input
                      type="number"
                      value={form.slot_number}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          slot_number: e.target.value,
                        }))
                      }
                      placeholder="1"
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#0b2740]">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, stock: e.target.value }))
                      }
                      placeholder="100"
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07324a]"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {formError}
                  </div>
                )}


                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
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
                      : editingMedication
                        ? "Save Changes"
                        : "Add Medication"}
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
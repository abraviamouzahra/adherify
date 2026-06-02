"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Role = "DOCTOR" | "PATIENT";

type DoctorOption = {
    id: string;
    username?: string;
    email?: string;
};

const AUTH_ENDPOINTS = {
    getDoctors: "/auth/doctors",
    registerDoctor: "/auth/register",
    registerPatientWithDoctor: "/auth/register",
    registerPatientWithoutDoctor: "/auth/register",
};

export default function SignUpPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("DOCTOR");

    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [connectWithDoctor, setConnectWithDoctor] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    useEffect(() => {
        async function fetchDoctors() {
            try {
                setLoadingDoctors(true);

                const data = await apiFetch(AUTH_ENDPOINTS.getDoctors, {
                    method: "GET",
                });

                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.doctors)
                            ? data.doctors
                            : [];

                setDoctors(list);
            } catch (err) {
                console.log("Failed to fetch doctors:", err);
                setDoctors([]);
            } finally {
                setLoadingDoctors(false);
            }
        }

        fetchDoctors();
    }, []);

    async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (role === "DOCTOR") {
                await apiFetch(AUTH_ENDPOINTS.registerDoctor, {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                });
            }

            if (role === "PATIENT") {
                const shouldAssignDoctor = connectWithDoctor && selectedDoctorId;

                if (shouldAssignDoctor) {
                    await apiFetch(AUTH_ENDPOINTS.registerPatientWithDoctor, {
                        method: "POST",
                        body: JSON.stringify({
                            username,
                            email,
                            password,
                            doctorId: selectedDoctorId,
                        }),
                    });
                } else {
                    await apiFetch(AUTH_ENDPOINTS.registerPatientWithoutDoctor, {
                        method: "POST",
                        body: JSON.stringify({
                            username,
                            email,
                            password,
                        }),
                    });
                }
            }

            setRegisteredEmail(email);
            setIsEmailSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign up gagal.");
        } finally {
            setLoading(false);
        }
    }

    if (isEmailSent) {
        return (
            <main className="min-h-screen bg-white">
                <div className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-6">
                    <div className="w-full max-w-[520px] rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-[#07324a]">
                            ✉
                        </div>

                        <h1 className="mt-6 text-[30px] font-bold tracking-tight text-[#151821] sm:text-[38px]">
                            Check your email
                        </h1>

                        <p className="mt-4 text-[15px] leading-7 text-slate-500 sm:text-[17px]">
                            We sent a verification link to{" "}
                            <span className="font-semibold text-[#07324a]">
                                {registeredEmail}
                            </span>
                            . Please open your inbox and click the verification link before signing in.
                        </p>

                        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-left text-sm leading-6 text-[#0b2740]">
                            <p className="font-semibold">Next step</p>
                            <p className="mt-1 text-slate-600">
                                After your email is verified, you can continue to the sign in page.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push("/sign-in")}
                            className="mt-7 h-12 w-full rounded-full bg-[#07324a] text-sm font-semibold text-white transition hover:bg-[#062a3e]"
                        >
                            Go to Sign In
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsEmailSent(false);
                                setError("");
                            }}
                            className="mt-4 text-sm font-semibold text-slate-500 underline underline-offset-4"
                        >
                            Use another email
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="min-h-screen w-full bg-white xl:grid xl:grid-cols-[0.92fr_1.08fr]">
                {/* LEFT FORM */}
                <section className="flex min-h-screen justify-center bg-white px-6 py-8 sm:px-10 md:items-start md:px-0 md:pt-16 xl:items-start xl:px-20 xl:pt-20">
                    <div className="w-full max-w-[340px] sm:max-w-[640px] md:max-w-[640px] xl:max-w-[500px]">
                        {/* LOGO AREA */}
                        <div className="mb-11 sm:mb-16 xl:mb-12">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/logo-adherify.png"
                                    alt="Adherify"
                                    className="h-12 w-auto"
                                />
                            </div>
                        </div>

                        <h1 className="text-[34px] font-bold leading-none tracking-tight text-[#151821] sm:text-[48px] xl:text-[38px]">
                            Sign Up
                        </h1>

                        <p className="mt-5 text-[15px] text-slate-500 sm:mt-9 sm:text-[18px] xl:mt-6 xl:text-[14px]">
                            Create your Adherify account and verify your email before signing in.
                        </p>

                        <p className="mt-3 text-[15px] text-slate-500 sm:text-[18px] xl:text-[14px]">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/sign-in")}
                                className="font-semibold text-[#163d3a] underline underline-offset-2"
                            >
                                Sign in now
                            </button>
                        </p>

                        <form
                            onSubmit={handleSignUp}
                            className="mt-7 space-y-6 sm:mt-8 sm:space-y-8 xl:mt-8 xl:space-y-6"
                        >
                            <div>
                                <label className="mb-2 block text-[15px] font-medium text-slate-500 sm:text-[18px] xl:text-[13px]">
                                    Register as
                                </label>

                                <div className="grid h-[54px] grid-cols-2 rounded-[10px] bg-slate-100 p-1 sm:h-[58px] xl:h-[46px] xl:rounded-[7px]">
                                    <button
                                        type="button"
                                        onClick={() => setRole("DOCTOR")}
                                        className={`rounded-[8px] text-[14px] font-semibold transition sm:text-[17px] xl:text-[13px] ${role === "DOCTOR"
                                            ? "bg-[#07324a] text-white shadow-sm"
                                            : "text-slate-500 hover:text-[#07324a]"
                                            }`}
                                    >
                                        Doctor
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole("PATIENT")}
                                        className={`rounded-[8px] text-[14px] font-semibold transition sm:text-[17px] xl:text-[13px] ${role === "PATIENT"
                                            ? "bg-[#07324a] text-white shadow-sm"
                                            : "text-slate-500 hover:text-[#07324a]"
                                            }`}
                                    >
                                        Patient
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-[15px] font-medium text-slate-500 sm:text-[18px] xl:text-[13px]">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    placeholder={role === "DOCTOR" ? "dr_tirta" : "mark_lee"}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-[10px] border border-slate-300 bg-slate-50 px-4 text-[16px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#07324a] focus:bg-white sm:h-[58px] sm:text-[18px] xl:h-[46px] xl:rounded-[7px] xl:text-[14px]"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-[15px] font-medium text-slate-500 sm:text-[18px] xl:text-[13px]">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    placeholder="example@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-[10px] border border-slate-300 bg-slate-50 px-4 text-[16px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#07324a] focus:bg-white sm:h-[58px] sm:text-[18px] xl:h-[46px] xl:rounded-[7px] xl:text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[15px] font-medium text-slate-500 sm:text-[18px] xl:text-[13px]">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="@#*%"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="h-[54px] w-full rounded-[10px] border border-slate-300 bg-slate-50 px-4 text-[16px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#07324a] focus:bg-white sm:h-[58px] sm:text-[18px] xl:h-[46px] xl:rounded-[7px] xl:text-[14px]"
                                />
                            </div>

                            {role === "PATIENT" && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={connectWithDoctor}
                                            onChange={(e) => {
                                                setConnectWithDoctor(e.target.checked);

                                                if (!e.target.checked) {
                                                    setSelectedDoctorId("");
                                                }
                                            }}
                                            className="mt-1 h-4 w-4"
                                        />

                                        <span>
                                            <span className="block text-sm font-semibold text-[#0b2740]">
                                                Connect with a doctor now
                                            </span>
                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                Choose this if your account should be linked to a doctor after registration.
                                            </span>
                                        </span>
                                    </label>

                                    {connectWithDoctor && (
                                        <div className="mt-4">
                                            <label className="mb-2 block text-sm font-semibold text-[#0b2740]">
                                                Choose doctor
                                            </label>

                                            <select
                                                value={selectedDoctorId}
                                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#0b2740] outline-none focus:border-[#07324a]"
                                            >
                                                <option value="">
                                                    {loadingDoctors ? "Loading doctors..." : "Select doctor"}
                                                </option>

                                                {doctors.map((doctor) => (
                                                    <option key={doctor.id} value={doctor.id}>
                                                        {doctor.username || doctor.email || doctor.id}
                                                    </option>
                                                ))}
                                            </select>

                                            {!loadingDoctors && doctors.length === 0 && (
                                                <p className="mt-2 text-xs text-amber-600">
                                                    Doctor list is unavailable. You can register without assigning a doctor.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-[8px] bg-red-50 px-4 py-3 text-[13px] text-red-600 sm:text-[15px] xl:text-[13px]">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-[52px] w-full rounded-[22px] bg-[#07324a] text-[17px] font-semibold text-white transition hover:bg-[#062a3e] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[68px] sm:rounded-[16px] sm:text-[22px] xl:h-[52px] xl:rounded-[10px] xl:text-[15px]"
                            >
                                {loading ? "Creating account..." : `Sign up as ${role === "DOCTOR" ? "Doctor" : "Patient"}`}
                            </button>
                        </form>
                    </div>
                </section>

                {/* RIGHT DESKTOP PANEL */}
                <section className="relative hidden min-h-screen overflow-hidden bg-[#2f75ad] text-white xl:block">
                    <div className="absolute -right-16 -top-32 h-[440px] w-[440px] rounded-full bg-white/10" />
                    <div className="absolute bottom-[-180px] right-[-70px] h-[450px] w-[450px] rounded-full bg-[#1e659d]/50" />

                    <button className="absolute right-[150px] top-[76px] flex items-center gap-2 text-[14px] font-semibold text-white">
                        <span>☊</span>
                        <span>Support</span>
                    </button>

                    <div className="flex h-full flex-col items-center justify-center pt-8">
                        <div className="relative mb-20 w-[410px] rounded-[9px] bg-white px-9 py-8 text-[#07324a] shadow-lg">
                            <div className="max-w-[230px]">
                                <h2 className="text-[27px] font-bold leading-[1.15] tracking-tight">
                                    Reach your health goals faster
                                </h2>

                                <p className="mt-5 text-[14px] leading-[1.7] text-slate-500">
                                    Use your Adherify app to track your daily medication schedule
                                    easily.
                                </p>

                                <button className="mt-7 rounded-full bg-[#07324a] px-8 py-3 text-[12px] font-semibold text-white">
                                    Learn more
                                </button>
                            </div>

                            {/*
                RUANG GAMBAR OBAT + JAM:
                nanti kalau gambar sudah ada, taruh di public/medicine-illustration.png
                lalu ganti placeholder ini dengan:

                <img
                  src="/medicine-illustration.png"
                  alt="Medication reminder illustration"
                  className="absolute right-7 top-12 h-[155px] w-auto"
                />
              */}
                            <div className="absolute right-7 top-12 flex h-[155px] w-[155px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-[11px] leading-4 text-slate-400">
                                image
                                <br />
                                placeholder
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-[32px] font-bold tracking-tight">
                                Introducing smart reminders
                            </h2>

                            <p className="mx-auto mt-7 max-w-[480px] text-[15px] leading-[1.55] text-blue-100">
                                Analyzing your daily medication habits ensures you always stay
                                on track. Our smart system reminds you exactly when it&apos;s
                                time to take your pills...
                            </p>

                            <div className="mt-16 text-blue-100/80">‹ · ◔ · ›</div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Role = "DOCTOR" | "PATIENT";

type AuthProfile = {
    id?: string;
    email?: string;
    username?: string;
    role?: string;
    patientProfile?: unknown;
};

type UserProfile = {
    id?: string;
    email?: string;
    username?: string;
    role?: Role;
};

const AUTH_ENDPOINTS = {
    login: "/auth/login",
    profile: "/auth/me",
};

function getRoleFromToken(token: string) {
    try {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));

        return decodedPayload.role;
    } catch {
        return null;
    }
}


export default function SignInPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const loginData = await apiFetch(AUTH_ENDPOINTS.login, {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const token =
                loginData?.access_token ||
                loginData?.accessToken ||
                loginData?.token ||
                loginData?.data?.access_token ||
                loginData?.data?.accessToken ||
                loginData?.data?.token;

            if (!token) {
                throw new Error("Login berhasil, tetapi token tidak ditemukan.");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("access_token", token);

            let profile: AuthProfile | null = null;

            try {
                const profileData = await apiFetch(AUTH_ENDPOINTS.profile, {
                    method: "GET",
                });

                profile =
                    profileData?.data?.user ||
                    profileData?.user ||
                    profileData?.data ||
                    profileData;
            } catch (profileErr) {
                console.log("Failed to fetch profile:", profileErr);

                profile =
                    loginData?.data?.user ||
                    loginData?.user ||
                    loginData?.data ||
                    null;
            }

            const tokenRole = getRoleFromToken(token);

            const rawRole = String(profile?.role || tokenRole || "").toUpperCase();

            if (!rawRole || rawRole === "UNDEFINED" || rawRole === "NULL") {
                throw new Error("Role akun tidak ditemukan.");
            }

            if (rawRole !== "DOCTOR" && rawRole !== "PATIENT") {
                throw new Error("Role akun tidak dikenali.");
            }

            const finalRole = rawRole as Role;

            const normalizedProfile = {
                id: profile?.id || "",
                email: profile?.email || email,
                username: profile?.username || profile?.email || email,
                role: finalRole,
                patientProfile: profile?.patientProfile || null,
            };

            localStorage.setItem("user", JSON.stringify(normalizedProfile));
            localStorage.setItem("role", finalRole);

            if (finalRole === "DOCTOR") {
                router.replace("/doctor/dashboard");
                return;
            }

            if (finalRole === "PATIENT") {
                router.replace("/patient/dashboard");
                return;
            }

            throw new Error("Role akun tidak dikenali.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in gagal.");
        } finally {
            setLoading(false);
        }
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
                            Sign In
                        </h1>

                        <p className="mt-5 text-[15px] text-slate-500 sm:mt-9 sm:text-[18px] xl:mt-6 xl:text-[14px]">
                            Don&apos;t have an account?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/sign-up")}
                                className="font-semibold text-[#163d3a] underline underline-offset-2"
                            >
                                Create now
                            </button>
                        </p>

                        <form
                            onSubmit={handleSignIn}
                            className="mt-8 space-y-6 sm:mt-10 sm:space-y-8 xl:mt-10 xl:space-y-6"
                        >

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

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="@#*%"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-[54px] w-full rounded-[10px] border border-slate-300 bg-slate-50 px-4 pr-14 text-[16px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#07324a] focus:bg-white sm:h-[58px] sm:text-[18px] xl:h-[46px] xl:rounded-[7px] xl:text-[14px]"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-0 top-1/2 flex h-full w-12 -translate-y-1/2 items-center justify-center border-l border-slate-300 text-slate-500"
                                    >
                                        👁
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 text-[14px] sm:text-[18px] xl:text-[13px]">
                                <label className="flex items-center gap-2 text-slate-500">
                                </label>

                            </div>

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
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>
                    </div>
                </section>

                {/* RIGHT DESKTOP PANEL */}
                <section className="relative hidden min-h-screen overflow-hidden bg-[#2f75ad] text-white xl:block">
                    <div className="absolute -right-16 -top-32 h-[440px] w-[440px] rounded-full bg-white/10" />
                    <div className="absolute bottom-[-180px] right-[-70px] h-[450px] w-[450px] rounded-full bg-[#1e659d]/50" />


                    <div className="flex h-full flex-col items-center justify-center pt-8">
                        <div className="relative mb-20 w-[520px] overflow-hidden rounded-[28px] bg-white px-10 py-9 text-[#07324a] shadow-[0_28px_80px_rgba(7,50,74,0.22)]">
                            {/* soft background accents */}
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100/70" />
                            <div className="absolute bottom-[-70px] right-20 h-40 w-40 rounded-full bg-cyan-100/60" />
                            <div className="absolute right-0 top-0 h-full w-[58%] bg-gradient-to-l from-blue-50 via-blue-50/80 to-transparent" />

                            {/* text */}
                            <div className="relative z-10 max-w-[250px]">
                                <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
                                    Smart reminder
                                </p>

                                <h2 className="text-[31px] font-extrabold leading-[1.1] tracking-tight text-[#06283d]">
                                    Reach your health goals faster
                                </h2>

                                <p className="mt-5 text-[14px] leading-[1.8] text-slate-500">
                                    Track medication schedules, get timely reminders, and stay consistent
                                    with your daily treatment.
                                </p>
                            </div>

                            {/* image */}
                            <img
                                src="/foto-jam-obat-rmv.png"
                                alt="Medication reminder illustration"
                                className="absolute right-8 top-1/2 z-10 h-[220px] w-auto -translate-y-1/2 object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
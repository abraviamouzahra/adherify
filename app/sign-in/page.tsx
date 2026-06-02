"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

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
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const token =
                data.access_token ||
                data.accessToken ||
                data.token ||
                data.data?.access_token ||
                data.data?.token;

            if (!token) {
                throw new Error("Token tidak ditemukan dari response backend.");
            }

            const role =
                data.role ||
                data.user?.role ||
                data.data?.role ||
                data.data?.user?.role ||
                getRoleFromToken(token);

            if (!role) {
                throw new Error("Role tidak ditemukan dari token backend.");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("role", role);

            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberMe");
            }

            if (role === "DOCTOR") {
                router.push("/doctor/dashboard");
            } else if (role === "PATIENT") {
                router.push("/patient/dashboard");
            } else {
                throw new Error("Role tidak dikenali.");
            }
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
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span>Remember me</span>
                                </label>

                                <button
                                    type="button"
                                    className="font-medium text-[#07324a] underline underline-offset-2"
                                >
                                    Forgot Password?
                                </button>
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
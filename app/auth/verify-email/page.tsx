"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyStatus = "loading" | "success" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  const token = searchParams.get("token");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      if (!API_URL) {
        setStatus("error");
        setMessage("Backend URL is not configured.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Email verification failed. The link may be expired or already used."
          );
        }

        setStatus("success");
        setMessage(data?.message || "Email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Email verification failed. Please try again."
        );
      }
    }

    verifyEmail();
  }, [token]);

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <main className="min-h-screen bg-[#f8fbff] text-[#0b2740]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-[520px] rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
              isSuccess
                ? "bg-green-50 text-green-600"
                : isError
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-600"
            }`}
          >
            {isSuccess ? "✓" : isError ? "!" : "⏳"}
          </div>

          <h1 className="mt-7 text-[32px] font-bold tracking-tight text-[#151821] sm:text-[40px]">
            {status === "loading"
              ? "Verifying email"
              : isSuccess
                ? "Email verified"
                : "Verification failed"}
          </h1>

          <p className="mt-4 text-[15px] leading-7 text-slate-500 sm:text-[17px]">
            {message}
          </p>

          {status === "loading" && (
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
            </div>
          )}

          {isSuccess && (
            <div className="mt-7 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-left text-sm leading-6 text-green-700">
              <p className="font-bold">Your account is ready.</p>
              <p className="mt-1">
                You can now sign in using your registered email and password.
              </p>
            </div>
          )}

          {isError && (
            <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left text-sm leading-6 text-red-700">
              <p className="font-bold">Unable to verify your email.</p>
              <p className="mt-1">
                The verification link may be expired, already used, or invalid.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/sign-in")}
            disabled={status === "loading"}
            className="mt-8 h-12 w-full rounded-full bg-[#07324a] text-sm font-semibold text-white transition hover:bg-[#062a3e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSuccess ? "Go to Sign In" : "Back to Sign In"}
          </button>

          {isError && (
            <button
              type="button"
              onClick={() => router.push("/sign-up")}
              className="mt-4 text-sm font-semibold text-slate-500 underline underline-offset-4"
            >
              Create a new account
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
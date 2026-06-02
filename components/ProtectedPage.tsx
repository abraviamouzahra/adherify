"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken, UserRole } from "@/lib/auth";

type ProtectedPageProps = {
  allowedRole: UserRole;
  children: React.ReactNode;
};

export default function ProtectedPage({
  allowedRole,
  children,
}: ProtectedPageProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (!token) {
      router.replace("/sign-in");
      return;
    }

    if (role !== allowedRole) {
      if (role === "DOCTOR") {
        router.replace("/doctor/dashboard");
      } else if (role === "PATIENT") {
        router.replace("/patient/dashboard");
      } else {
        router.replace("/sign-in");
      }

      return;
    }

    setChecking(false);
  }, [allowedRole, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Checking access...</p>
      </main>
    );
  }

  return <>{children}</>;
}
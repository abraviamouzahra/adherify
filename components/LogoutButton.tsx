"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/sign-in");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-[#07324a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#062a3e]"
    >
      Logout
    </button>
  );
}
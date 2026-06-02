"use client";

import { useRouter } from "next/navigation";

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function LoginIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function UserPlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
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

function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-9" />
      <path d="m16 7 3 3" />
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

function CheckBadgeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
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

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M17 11a3 3 0 1 0 0-6" />
      <path d="M21 21a5 5 0 0 0-4-4.9" />
    </svg>
  );
}

function HeartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "blue" | "green" | "purple" | "yellow" | "cyan";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-500",
    cyan: "bg-cyan-50 text-cyan-600",
  }[tone];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/80 p-7 text-center shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#061b36]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-[#061b36]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#061b36]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbff] text-[#061b36]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-10 xl:px-14">
          {/* LOGO PLACEHOLDER */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <img
              src="/logo-adherify.png"
              alt="Adherify"
              className="h-12 w-auto"
            />
          </button>

          <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#about" className="hover:text-blue-600">About</a>
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
            <a href="#security" className="hover:text-blue-600">Security</a>
            <a href="#footer" className="hover:text-blue-600">Help</a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={() => router.push("/sign-in")}
              className="h-12 rounded-2xl border border-blue-200 bg-white px-8 text-sm font-bold text-blue-600 hover:bg-blue-50"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/sign-up")}
              className="h-12 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Register
            </button>
          </div>

          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#07324a] md:hidden">
            <MenuIcon className="h-7 w-7" />
          </button>
        </div>
      </header>

      <section id="about" className="relative">
        <div className="absolute left-0 top-20 h-[420px] w-[420px] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute right-0 top-24 h-[460px] w-[460px] rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:px-10 md:py-20 xl:grid-cols-[0.9fr_1.1fr] xl:px-14 xl:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-[#07324a]">
              <ShieldIcon className="h-5 w-5 text-blue-600" />
              Trusted by Doctors. Loved by Patients.
            </div>

            <h1 className="mt-8 max-w-[680px] text-[44px] font-black leading-[1.08] tracking-tight text-[#071836] md:text-[64px] xl:text-[72px]">
              Better adherence. Better health{" "}
              <span className="text-blue-600">together.</span>
            </h1>

            <p className="mt-7 max-w-[640px] text-lg leading-8 text-slate-600 md:text-xl md:leading-9">
              Adherify helps patients follow their medication schedules and
              upload proof of consumption, while doctors can monitor and verify
              adherence to improve treatment outcomes.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => router.push("/sign-in")}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-9 text-base font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <LoginIcon className="h-6 w-6" />
                Login
              </button>

              <button
                onClick={() => router.push("/sign-up")}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-white px-9 text-base font-bold text-blue-600 hover:bg-blue-50"
              >
                <UserPlusIcon className="h-6 w-6" />
                Register
              </button>
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600">
              <LockIcon className="h-5 w-5 text-blue-600" />
              Secure, private, and built for patient-doctor collaboration.
            </p>
          </div>

          <div className="relative z-10 min-h-[420px] md:min-h-[520px] xl:min-h-[560px]">
            {/* MAIN HERO IMAGE PLACEHOLDER */}
            <div className="absolute left-0 top-2 hidden w-[78%] rounded-[32px] border border-slate-200 bg-white p-5 shadow-2xl md:block">
              <div className="flex h-[380px] items-center justify-center rounded-[24px] bg-gradient-to-br from-slate-50 to-blue-50 text-center text-sm font-semibold text-slate-400 xl:h-[430px]">
                dashboard / verification
                <br />
                image placeholder
              </div>
            </div>

            {/* FLOATING MOBILE PREVIEW PLACEHOLDER */}
            <div className="absolute bottom-0 right-2 w-[300px] rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl md:right-10 md:w-[330px]">
              <div className="rounded-[24px] bg-[#f8fbff] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#07324a]">Verifications</span>
                  <span className="h-8 w-8 rounded-full bg-blue-100" />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Waiting Verification</p>
                  <p className="mt-2 text-3xl font-black text-amber-500">7</p>
                  <p className="mt-2 text-xs text-slate-500">Patient uploads waiting for review.</p>
                </div>

                <div className="mt-4 space-y-3">
                  {["Nabila Rahma", "Rafi Pratama", "Dimas Saputra"].map((name, index) => (
                    <div key={name} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                        {name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#07324a]">{name}</p>
                        <p className="text-xs text-slate-500">
                          {index === 0 ? "Amoxicillin 500 mg" : index === 1 ? "Ibuprofen 200 mg" : "Vitamin D3 1000 IU"}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">
                        Waiting
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-12 hidden h-28 w-28 rounded-full bg-blue-100/70 md:block" />
            <div className="absolute left-12 bottom-10 hidden h-20 w-20 rounded-full bg-amber-100/80 md:block" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1440px] px-6 pb-10 md:px-10 xl:px-14">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <FeatureCard
            icon={<CalendarIcon className="h-8 w-8" />}
            title="Jadwal Obat Pasien"
            description="Buat dan kelola jadwal obat pasien dengan pengingat otomatis."
            tone="blue"
          />
          <FeatureCard
            icon={<ChartIcon className="h-8 w-8" />}
            title="Monitoring Pasien"
            description="Pantau kepatuhan pasien secara real-time dengan ringkasan yang jelas."
            tone="green"
          />
          <FeatureCard
            icon={<UploadIcon className="h-8 w-8" />}
            title="Upload Bukti Konsumsi"
            description="Pasien mengunggah foto bukti konsumsi obat dengan mudah dan aman."
            tone="purple"
          />
          <FeatureCard
            icon={<CheckBadgeIcon className="h-8 w-8" />}
            title="Verifikasi Dokter"
            description="Dokter meninjau dan memverifikasi bukti konsumsi dengan cepat."
            tone="yellow"
          />
          <FeatureCard
            icon={<ClockIcon className="h-8 w-8" />}
            title="Riwayat Konsumsi"
            description="Lihat riwayat konsumsi obat dan catatan pasien dalam satu tempat."
            tone="cyan"
          />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1440px] px-6 py-14 md:px-10 xl:px-14">
        <div className="rounded-[36px] border border-slate-200 bg-white/75 p-7 shadow-sm backdrop-blur md:p-10">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#061b36] md:text-4xl">
              Dibangun untuk alur pasien dan dokter
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Adherify menghubungkan jadwal obat, bukti konsumsi, dan verifikasi dokter
              dalam satu workflow yang sederhana.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StepCard
              number="1"
              title="Dokter membuat pasien"
              description="Dokter menambahkan data pasien dan obat yang perlu dikonsumsi."
            />
            <StepCard
              number="2"
              title="Jadwal obat dibuat"
              description="Dokter mengatur dosis dan waktu konsumsi obat sesuai kebutuhan pasien."
            />
            <StepCard
              number="3"
              title="Pasien upload bukti"
              description="Pasien mengunggah bukti konsumsi sesuai jadwal yang diberikan."
            />
            <StepCard
              number="4"
              title="Dokter verifikasi"
              description="Dokter menyetujui atau menolak bukti untuk menjaga kepatuhan terapi."
            />
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1440px] px-6 pb-16 md:px-10 xl:px-14">
        <div className="grid gap-5 rounded-[36px] border border-slate-200 bg-white/75 p-7 shadow-sm backdrop-blur md:grid-cols-2 md:p-10 xl:grid-cols-4">
          <BenefitItem
            icon={<ShieldIcon className="h-7 w-7" />}
            title="Aman & Terpercaya"
            description="Data pasien dikelola dengan pendekatan keamanan yang rapi."
          />
          <BenefitItem
            icon={<UsersIcon className="h-7 w-7" />}
            title="Kolaborasi Lebih Baik"
            description="Memperkuat komunikasi antara pasien dan dokter."
          />
          <BenefitItem
            icon={<CheckBadgeIcon className="h-7 w-7" />}
            title="Kepatuhan Meningkat"
            description="Membantu pasien patuh minum obat dan mencapai hasil pengobatan optimal."
          />
          <BenefitItem
            icon={<HeartIcon className="h-7 w-7" />}
            title="Kesehatan Lebih Baik"
            description="Perawatan lebih terarah untuk hidup yang lebih sehat."
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16 md:px-10 xl:px-14">
        <div className="rounded-[36px] bg-gradient-to-r from-[#07324a] to-blue-700 p-8 text-white shadow-xl md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                Siap mulai memantau kepatuhan obat?
              </h2>
              <p className="mt-4 max-w-[720px] text-base leading-8 text-blue-50">
                Masuk sebagai dokter untuk mengelola pasien, atau masuk sebagai pasien
                untuk melihat jadwal dan mengunggah bukti konsumsi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/sign-in")}
                className="h-13 rounded-2xl bg-white px-8 text-sm font-bold text-blue-700"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/sign-up")}
                className="h-13 rounded-2xl border border-white/40 px-8 text-sm font-bold text-white hover:bg-white/10"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-10 xl:px-14">
          <div>
            {/* LOGO PLACEHOLDER */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#07324a] text-[#07324a]">
                ✓
              </div>
              <span className="text-2xl font-bold text-[#07324a]">adherify</span>
            </div>
            <p className="mt-4 max-w-[520px] text-sm leading-7 text-slate-600">
              Medication adherence platform untuk membantu pasien mengikuti jadwal obat
              dan membantu dokter melakukan monitoring serta verifikasi.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#061b36]">Menu</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>About</p>
              <p>Features</p>
              <p>How it works</p>
              <p>Security</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#061b36]">Access</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <button onClick={() => router.push("/sign-in")} className="block hover:text-blue-600">
                Login
              </button>
              <button onClick={() => router.push("/sign-up")} className="block hover:text-blue-600">
                Register
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5 text-center text-sm text-slate-500">
          © 2026 Adherify. Built for UKL medication adherence system.
        </div>
      </footer>
    </main>
  );
}
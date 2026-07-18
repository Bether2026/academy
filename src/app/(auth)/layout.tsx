import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-secondary/50 px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}

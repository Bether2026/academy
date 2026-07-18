import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.loginTitle };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}

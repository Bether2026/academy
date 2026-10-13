import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.loginTitle };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; aviso?: string }>;
}) {
  const { next, aviso } = await searchParams;
  return <LoginForm next={next} notice={aviso === "link" ? t.auth.linkNotice : undefined} />;
}

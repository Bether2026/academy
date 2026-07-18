import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: t.auth.resetTitle };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

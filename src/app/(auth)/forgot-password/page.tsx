import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: t.auth.forgotTitle };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

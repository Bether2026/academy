import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: t.auth.forgotTitle, robots: NO_INDEX };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: t.auth.resetTitle, robots: NO_INDEX };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: t.auth.registerTitle };

export default function RegisterPage() {
  return <RegisterForm />;
}

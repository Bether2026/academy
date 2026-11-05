import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: t.auth.registerTitle,
  description: t.seo.register,
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <RegisterForm />;
}

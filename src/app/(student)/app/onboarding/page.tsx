import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnStudent } from "@/lib/services/students";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Bienvenido a bordo" };

export default async function OnboardingPage() {
  const student = await getOwnStudent();
  if (student?.onboarding_completed) redirect("/app");
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-heading text-2xl font-bold">Preparemos tu plan de vuelo ✈️</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tres preguntas cortas para asignarte el profesor correcto.
      </p>
      <div className="mt-8">
        <OnboardingForm />
      </div>
    </div>
  );
}

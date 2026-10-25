import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getLibrary, getShareableStudents } from "@/lib/services/materials";
import { MaterialsLibrary } from "@/components/features/materials-library";
import { t } from "@/lib/i18n";
import { shareMaterialAction, unshareMaterialAction } from "@/app/(teacher)/teacher/materiales/actions";

export const metadata: Metadata = { title: "Materiales" };

export default async function AdminMaterialsPage() {
  await requireRole("admin", "super_admin");
  const [materials, students] = await Promise.all([getLibrary(), getShareableStudents(true)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.materials.title}</h1>
        <p className="text-sm text-muted-foreground">{t.materials.subtitle}</p>
      </div>
      <MaterialsLibrary materials={materials} students={students} shareAction={shareMaterialAction} unshareAction={unshareMaterialAction} />
    </div>
  );
}

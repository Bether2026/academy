import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/session";
import { getMaterialLink } from "@/lib/services/materials";

/**
 * Abre un material: verifica el permiso con la sesión del usuario (RLS) y
 * redirige a un link firmado de corta duración. Sirve para alumnos y staff.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Not found", { status: 404 });

  const user = await getAuthUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const link = await getMaterialLink(id);
  if (!link) return new Response("No tenés acceso a este material.", { status: 404 });
  return NextResponse.redirect(link);
}

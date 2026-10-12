import { sendClassReminders } from "@/lib/services/notifications";

/**
 * Recordatorios diarios de clases (Vercel Cron, ver vercel.json).
 * Vercel manda `Authorization: Bearer <CRON_SECRET>`; sin CRON_SECRET
 * configurado el endpoint queda cerrado.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sent = await sendClassReminders();
  return Response.json({ classes: sent });
}

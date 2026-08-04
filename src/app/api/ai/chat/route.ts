import Anthropic from "@anthropic-ai/sdk";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Sos un tutor de inglés conversacional de Learning to Fly Academy.
Tu objetivo es ayudar al alumno a practicar inglés de forma natural y amigable.

REGLAS:
- Respondé siempre en INGLÉS, salvo para dar explicaciones breves en español cuando el alumno lo necesite.
- Corregí errores gramaticales de forma constructiva y breve al final de tu respuesta.
- Adaptá el nivel al del alumno: usá vocabulario simple para A1-A2, más complejo para B2-C2.
- Sugería frases alternativas cuando el alumno use expresiones incorrectas o poco naturales.
- Hacé preguntas para mantener la conversación fluida.
- Mantené un tono cálido, alentador y profesional.
- Las respuestas deben ser concisas (máximo 3-4 oraciones) para favorecer la práctica.

Cuando el alumno te saluda, preguntalé qué quiere practicar hoy (temas cotidianos, trabajo, viajes, etc.).`;

export async function POST(request: Request) {
  await requireRole("student");

  const body = await request.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    level?: string;
  };

  const { messages, level } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Missing messages", { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemWithLevel = level
    ? `${SYSTEM_PROMPT}\n\nNivel del alumno: ${level}. Adaptá el contenido a este nivel.`
    : SYSTEM_PROMPT;

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 512,
    thinking: { type: "adaptive" },
    system: systemWithLevel,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

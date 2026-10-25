import "server-only";

export type Turn = { role: "user" | "model"; text: string };
type Out = { ok: true; text: string } | { ok: false; error: string };

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

export async function generate(o: {
  system: string; turns: Turn[]; image?: { mime: string; data: string }; maxTokens?: number; temperature?: number;
}): Promise<Out> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "AI isn’t set up yet. Add GEMINI_API_KEY." };
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  const contents = o.turns.map((t, i) => {
    const parts: Record<string, unknown>[] = [{ text: t.text }];
    if (o.image && i === o.turns.length - 1 && t.role === "user") parts.push({ inlineData: { mimeType: o.image.mime, data: o.image.data } });
    return { role: t.role, parts };
  });

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: o.system }] },
        contents,
        generationConfig: { maxOutputTokens: o.maxTokens ?? 800, temperature: o.temperature ?? 0.4 },
      }),
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });
    if (!res.ok) {
      const msg: string = (await res.json().catch(() => null))?.error?.message ?? "";
      if (res.status === 429) return { ok: false, error: "The free AI quota is used up for now. Please try again later." };
      if (/api key/i.test(msg)) return { ok: false, error: "The AI key was rejected. Check GEMINI_API_KEY." };
      if (res.status === 404 || /not found|not supported/i.test(msg)) return { ok: false, error: "The AI model name wasn’t accepted. Set GEMINI_MODEL to a model ID from AI Studio." };
      return { ok: false, error: "The AI service had a problem. Please try again." };
    }
    const json = await res.json();
    const text = ((json?.candidates?.[0]?.content?.parts ?? []) as { text?: string }[]).map((p) => p.text ?? "").join("").trim();
    if (!text) {
      return { ok: false, error: json?.promptFeedback?.blockReason ? "The AI’s safety filter blocked that request." : "The AI returned no answer. Please try again." };
    }
    return { ok: true, text };
  } catch (e: unknown) {
    const timeout = e instanceof Error && e.name === "TimeoutError";
    return { ok: false, error: timeout ? "The AI took too long to answer. Please try again." : "Couldn’t reach the AI service." };
  }
}

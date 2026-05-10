import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type AnalyzeBody = { image?: string; text?: string };

const SYSTEM = `You are a nutrition expert AI. Given a food photo or text description, estimate the meal's nutrition.
Always respond ONLY with strict JSON in this exact shape (no markdown, no commentary):
{"name": string, "calories": number, "carbs": number, "protein": number, "fat": number, "portion": string, "confidence": "high"|"medium"|"low"}
- calories in kcal
- carbs/protein/fat in grams
- portion: brief portion estimate (e.g. "1 bowl, ~350g")
If the image is unclear or not food, return {"name":"Unknown","calories":0,"carbs":0,"protein":0,"fat":0,"portion":"unknown","confidence":"low"}.`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as AnalyzeBody;
        if (!body.image && !body.text) {
          return new Response("image or text required", { status: 400 });
        }

        const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> =
          body.image
            ? [
                { type: "text", text: "Analyze this meal and return the JSON nutrition estimate." },
                { type: "image_url", image_url: { url: body.image } },
              ]
            : [{ type: "text", text: `Analyze this meal: ${body.text}` }];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "raw",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 429) return Response.json({ error: "Rate limit. Try again shortly." }, { status: 429 });
          if (res.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
          return Response.json({ error: `AI error: ${errText}` }, { status: 500 });
        }

        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        try {
          const parsed = JSON.parse(content);
          return Response.json(parsed);
        } catch {
          return Response.json({ error: "Could not parse AI response", raw: content }, { status: 500 });
        }
      },
    },
  },
});

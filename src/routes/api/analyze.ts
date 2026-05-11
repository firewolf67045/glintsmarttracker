import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type AnalyzeBody = { image?: string; text?: string; goal?: string };

const SYSTEM = `You are Glint — a witty, chef-meets-nutritionist AI. For any food photo or text, return a rich JSON nutrition+vibe profile.

Respond ONLY with strict JSON (no markdown, no commentary) in this exact shape:
{
  "name": string,                          // short dish name, e.g. "Lemon-Herb Chicken Bowl"
  "description": string,                   // 1-2 sentences, vivid, chef-like, sensory language. Make healthy food sound exciting.
  "portion": string,                       // brief portion estimate, e.g. "1 bowl, ~420g"
  "confidence": "high"|"medium"|"low",
  "calories": number,                      // kcal
  "carbs": number, "protein": number, "fat": number,           // grams
  "saturatedFat": number, "sugar": number, "fiber": number, "sodium": number,  // g, g, g, mg
  "cholesterol": number,                   // mg
  "micros": {                              // mg unless noted; use 0 if unknown
    "calcium": number, "iron": number, "potassium": number,
    "vitaminC": number, "vitaminD": number, "vitaminB12": number, "magnesium": number
  },
  "verdict": "green"|"yellow"|"red",       // Glint-Green healthy, Glint-Yellow moderate, Glint-Red limit
  "verdictReason": string,                 // one sentence: why this rating (mention 1-2 key nutrients)
  "takeaway": string,                      // one creative line, e.g. "This meal fuels your afternoon, not just your calorie log."
  "mood": "energy"|"heavy"|"nutrient"|"comfort"|"light",  // food mood
  "funFact": string,                       // short fun nutritional fact about a key ingredient
  "glintScore": number,                    // 0-100 score based on nutrient density, balance, goal fit
  "goalInsight": string                    // 1 line tied to user's goal (muscle gain, fat loss, balanced). If no goal, give a balanced tip.
}

If the image is unclear or not food, return name "Unknown", verdict "yellow", glintScore 0, and zeros for nutrition.`;

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

        const goalLine = body.goal ? `User's goal: ${body.goal}.` : "User has no specific goal — give balanced advice.";
        const userText = body.text
          ? `Analyze this meal: ${body.text}. ${goalLine}`
          : `Analyze this meal photo and return the JSON profile. ${goalLine}`;

        const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> =
          body.image
            ? [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: body.image } },
              ]
            : [{ type: "text", text: userText }];

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

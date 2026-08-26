import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type PhysiqueBody = {
  image?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  sex?: string;
  activity?: string;
  goal?: string;
};

const SYSTEM = `You are Glint Body Scan — a friendly, encouraging AI physique & nutrition coach. You estimate body composition from a physique photo plus user stats, then build a calorie & meal plan.

Respond ONLY with strict JSON (no markdown, no commentary) in this exact shape:
{
  "bodyFat": number,                 // estimated body fat percentage, 1 decimal
  "bodyFatRange": string,            // e.g. "14-17%"
  "confidence": "high"|"medium"|"low",
  "category": string,                // e.g. "Athletic", "Fit", "Average", "Above average"
  "physiqueSummary": string,         // 2-3 sentences, vivid but kind and body-positive. Note visible muscle groups / definition.
  "leanMassKg": number,
  "fatMassKg": number,
  "bmr": number,                     // kcal, Mifflin-St Jeor
  "tdee": number,                    // kcal maintenance
  "targetCalories": number,          // kcal for the stated goal
  "targetRationale": string,         // one sentence: why this number (deficit/surplus size)
  "macros": { "protein": number, "carbs": number, "fat": number },   // grams per day
  "proteinPerKg": number,
  "weeklyChangeKg": number,          // expected weekly weight change, negative for loss
  "timelineNote": string,            // realistic expectation, 1 sentence
  "strengths": string[],             // 2-3 short positives about their physique
  "focusAreas": string[],            // 2-3 short training/nutrition focus points
  "mealPlan": [                      // exactly 4 entries: Breakfast, Lunch, Dinner, Snack
    { "meal": string, "name": string, "description": string, "calories": number,
      "protein": number, "carbs": number, "fat": number }
  ],
  "foodsToAdd": string[],            // 4 foods to eat more of
  "foodsToLimit": string[],          // 3 foods to cut back on
  "coachNote": string                // one motivating line with personality
}

Rules: mealPlan calories must sum to roughly targetCalories (within 5%). Macros must be consistent with targetCalories (protein 4, carbs 4, fat 9 kcal/g). Be realistic and never shame the user. If the photo is unclear or not a person, set confidence "low" and estimate from stats alone.`;

export const Route = createFileRoute("/api/physique")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as PhysiqueBody;
        if (!body.age || !body.weightKg) {
          return Response.json({ error: "Age and weight are required" }, { status: 400 });
        }

        const stats = [
          `Age: ${body.age}`,
          `Weight: ${body.weightKg} kg`,
          body.heightCm ? `Height: ${body.heightCm} cm` : null,
          body.sex ? `Sex: ${body.sex}` : null,
          body.activity ? `Activity level: ${body.activity}` : null,
          `Goal: ${body.goal || "balanced"}`,
        ]
          .filter(Boolean)
          .join(", ");

        const userText = body.image
          ? `Analyze this physique photo together with these stats and return the JSON profile. ${stats}`
          : `No photo provided — estimate from these stats only and return the JSON profile. ${stats}`;

        const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = body.image
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
          return Response.json(JSON.parse(content));
        } catch {
          return Response.json({ error: "Could not parse AI response", raw: content }, { status: 500 });
        }
      },
    },
  },
});

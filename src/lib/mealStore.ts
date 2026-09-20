import { supabase } from "@/integrations/supabase/client";

const BUCKET = "meal-photos";

export type StoredMeal = {
  id: string;
  ts: number;
  image?: string;
  [key: string]: unknown;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] || "image/jpeg";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Load every saved meal for a user, with fresh signed photo URLs. */
export async function fetchMeals(userId: string): Promise<StoredMeal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("id, data, image_path, eaten_at")
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false });
  if (error || !data) return [];

  const paths = data.map((r) => r.image_path).filter(Boolean) as string[];
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 60 * 24 * 7);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    });
  }

  return data.map((row) => {
    const meal = { ...(row.data as Record<string, unknown>) } as StoredMeal;
    meal.id = row.id;
    meal.ts = new Date(row.eaten_at as string).getTime();
    meal.image = row.image_path ? urls.get(row.image_path) : undefined;
    return meal;
  });
}

/** Persist a meal (and its photo) so it is still there on the next sign-in. */
export async function saveMeal(userId: string, meal: StoredMeal): Promise<StoredMeal> {
  const id = meal.id && meal.id.length === 36 ? meal.id : crypto.randomUUID();
  let imagePath: string | null = null;

  if (meal.image?.startsWith("data:")) {
    const blob = dataUrlToBlob(meal.image);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const path = `${userId}/${id}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true });
    if (!error) imagePath = path;
  }

  const { image, ...rest } = meal;
  const payload = { ...rest, id };

  await supabase.from("meals").upsert({
    id,
    user_id: userId,
    data: payload as never,
    image_path: imagePath,
    eaten_at: new Date(meal.ts || Date.now()).toISOString(),
  });

  let displayImage = meal.image;
  if (imagePath) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(imagePath, 60 * 60 * 24 * 7);
    displayImage = data?.signedUrl ?? meal.image;
  }

  return { ...payload, image: displayImage } as StoredMeal;
}

export async function removeMeal(userId: string, id: string) {
  await supabase.from("meals").delete().eq("id", id).eq("user_id", userId);
  await supabase.storage.from(BUCKET).remove([`${userId}/${id}.jpg`, `${userId}/${id}.png`]);
}

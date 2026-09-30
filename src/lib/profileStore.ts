import { supabase } from "@/integrations/supabase/client";
import type { AssessmentProfile } from "@/components/Assessment";

// The assessment profile lives in the account, so it follows the user
// across devices and never has to be answered twice.
export async function fetchProfile(userId: string): Promise<AssessmentProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.data as unknown as AssessmentProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(userId: string, profile: AssessmentProfile): Promise<void> {
  try {
    await supabase
      .from("user_profiles")
      .upsert({ user_id: userId, data: profile as never, updated_at: new Date().toISOString() });
  } catch {}
}

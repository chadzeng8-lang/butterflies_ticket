import {
  getPersonalityCharacter,
  isPersonalityResultKey,
  type PersonalityResultView,
} from "@/lib/personality";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";

export async function getPersonalityResultForCurrentUser(): Promise<PersonalityResultView | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) return null;

  const { data, error } = await supabase
    .from("personality_results")
    .select("personality_type, result_key, tested_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      throw new Error("PERSONALITY_RESULT_MIGRATION_REQUIRED");
    }
    throw new Error("PERSONALITY_RESULT_LOOKUP_FAILED");
  }
  if (!data) return null;
  if (!isPersonalityResultKey(data.result_key)) {
    throw new Error("PERSONALITY_RESULT_INVALID");
  }

  const character = getPersonalityCharacter(data.result_key);
  if (!character) throw new Error("PERSONALITY_RESULT_MISSING");

  return {
    personalityType: data.personality_type as PersonalityResultView["personalityType"],
    resultKey: data.result_key,
    testedAt: data.tested_at,
    character,
  };
}

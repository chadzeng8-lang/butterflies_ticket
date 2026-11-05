"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { calculatePersonality } from "@/lib/personality";

const answersSchema = z.array(z.number().int().min(1).max(5)).length(24);

export type PersonalityActionState = {
  error?: string;
  result?: {
    personalityType: string;
    resultKey: string;
    testedAt: string;
  };
};

export async function calculatePersonalityResult(
  submittedAnswers: number[]
): Promise<PersonalityActionState> {
  const parsed = answersSchema.safeParse(submittedAnswers);
  if (!parsed.success) return { error: "答案不完整或无效，请重新测试。" };

  const calculated = calculatePersonality(parsed.data);
  return {
    result: {
      personalityType: calculated.personalityType,
      resultKey: calculated.resultKey,
      testedAt: new Date().toISOString(),
    },
  };
}

export async function savePersonalityResult(
  submittedAnswers: number[]
): Promise<PersonalityActionState> {
  const parsed = answersSchema.safeParse(submittedAnswers);
  if (!parsed.success) return { error: "答案不完整或无效，请重新测试。" };

  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) return { error: "登录已失效，请重新登录后保存测试结果。" };

  const calculated = calculatePersonality(parsed.data);
  const testedAt = new Date().toISOString();
  const { error } = await supabase.from("personality_results").upsert(
    {
      user_id: user.id,
      personality_type: calculated.personalityType,
      result_key: calculated.resultKey,
      answers: parsed.data,
      tested_at: testedAt,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { error: "人格结果表尚未建立，请先在 Supabase 执行对应迁移。" };
    }
    throw new Error("PERSONALITY_RESULT_SAVE_FAILED");
  }

  revalidatePath("/account");
  return {
    result: {
      personalityType: calculated.personalityType,
      resultKey: calculated.resultKey,
      testedAt,
    },
  };
}

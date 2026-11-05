import personalityData from "@/lib/personality-data.json";

type PersonalityType = `${"E" | "I"}${"S" | "N"}${"T" | "F"}${"J" | "P"}`;
export type PersonalityResultKey = keyof typeof personalityData.roleData;

export type PersonalityCharacter = {
  role: string;
  archetype: string;
  oneLiner: string;
  story: string;
  vibe: string;
  relationship: string;
  general: string;
  quotes: string[];
};

export type PersonalityResultView = {
  personalityType: PersonalityType;
  resultKey: string;
  testedAt: string;
  character: PersonalityCharacter;
};

const personalityTypes = personalityData as {
  questions: Array<{ dimension: "EI" | "SN" | "TF" | "JP"; pole: string }>;
  LIKERT_LABELS: Array<{ value: number; label: string }>;
  roleData: Record<string, PersonalityCharacter>;
  customTypeMap: Record<string, string>;
};

const dimensionPoles = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
} as const;

export const personalityQuestions = personalityData.questions;
export const personalityAnswerLabels = personalityData.LIKERT_LABELS;

export function calculatePersonality(answers: number[]): {
  personalityType: PersonalityType;
  resultKey: string;
  character: PersonalityCharacter;
} {
  if (
    answers.length !== personalityTypes.questions.length ||
    answers.some((answer) => !Number.isInteger(answer) || answer < 1 || answer > 5)
  ) {
    throw new Error("INVALID_PERSONALITY_ANSWERS");
  }

  const score: Record<string, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  };
  const lastLean: Partial<Record<"EI" | "SN" | "TF" | "JP", string>> = {};

  personalityTypes.questions.forEach((question, index) => {
    const value = answers[index];
    const [left, right] = dimensionPoles[question.dimension];
    const opposite = question.pole === left ? right : left;
    score[question.pole] += value - 1;
    score[opposite] += 5 - value;
    if (value !== 3) {
      lastLean[question.dimension] = value > 3 ? question.pole : opposite;
    }
  });

  const personalityType = (
    (score.E > score.I ? "E" : score.I > score.E ? "I" : lastLean.EI || "E") +
    (score.S > score.N ? "S" : score.N > score.S ? "N" : lastLean.SN || "S") +
    (score.T > score.F ? "T" : score.F > score.T ? "F" : lastLean.TF || "T") +
    (score.J > score.P ? "J" : score.P > score.J ? "P" : lastLean.JP || "J")
  ) as PersonalityType;

  const resultKey = personalityTypes.customTypeMap[personalityType] || "ENFP";
  const character = personalityTypes.roleData[resultKey];
  if (!character) throw new Error("PERSONALITY_RESULT_MISSING");

  return { personalityType, resultKey, character };
}

export function isPersonalityResultKey(value: string): value is PersonalityResultKey {
  return Object.hasOwn(personalityTypes.roleData, value);
}

export function getPersonalityCharacter(
  value: string
): PersonalityCharacter | null {
  return isPersonalityResultKey(value)
    ? personalityTypes.roleData[value]
    : null;
}

/** 按香港日期区分场次开放对象（展示文案，不强制校验身份）。 */

function hkDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export const SHOW_AUDIENCE_PUBLIC = "面向公众人士";

export const SHOW_AUDIENCE_CUHK =
  "仅开放于香港中文大学/香港中文大学（深圳）学生、校友及教职工";

export function showAudienceLabel(startsAtIso: string): string | null {
  const key = hkDateKey(startsAtIso);
  if (key === "2026-11-21") return SHOW_AUDIENCE_PUBLIC;
  if (key === "2026-11-22") return SHOW_AUDIENCE_CUHK;
  return null;
}

/** 首页等汇总处的简短说明（两行分别用） */
export const SHOW_AUDIENCE_SUMMARY_LINES = [
  `11.21 ${SHOW_AUDIENCE_PUBLIC}`,
  `11.22 ${SHOW_AUDIENCE_CUHK}`,
] as const;

export const SHOW_AUDIENCE_SUMMARY = SHOW_AUDIENCE_SUMMARY_LINES.join("；");

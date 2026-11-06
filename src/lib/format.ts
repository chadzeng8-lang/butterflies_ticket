/** 稳定输出简体场次时间；繁体由 LocaleProvider 转换。避免 zh-HK 首屏闪繁体。 */
export function formatShowTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const hour = value("hour").padStart(2, "0");
  const minute = value("minute").padStart(2, "0");
  return `${value("year")}年${value("month")}月${value("day")}日${value("weekday")} ${hour}:${minute}`;
}

/** 开票时间：2026-11-09 20:00（香港/深圳，UTC+8） */
export const TICKET_SALE_OPENS_AT = new Date("2026-11-09T20:00:00+08:00");

/** 停售时间：末场日结束后（香港/深圳，UTC+8） */
export const TICKET_SALE_CLOSES_AT = new Date("2026-11-22T23:59:59+08:00");

export type TicketSalePhase = "before" | "open" | "ended";

export function getTicketSalePhase(now: Date = new Date()): TicketSalePhase {
  const t = now.getTime();
  if (t < TICKET_SALE_OPENS_AT.getTime()) return "before";
  if (t >= TICKET_SALE_CLOSES_AT.getTime()) return "ended";
  return "open";
}

export function isTicketSaleOpen(now: Date = new Date()): boolean {
  return getTicketSalePhase(now) === "open";
}

export function isTicketSaleEnded(now: Date = new Date()): boolean {
  return getTicketSalePhase(now) === "ended";
}

export function ticketSaleOpensLabel(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(TICKET_SALE_OPENS_AT);
}

export function ticketSaleClosedMessage(): string {
  if (isTicketSaleEnded()) {
    return "本轮《蝶》演出购票已结束，感谢支持。";
  }
  return `购票尚未开始，将于 ${ticketSaleOpensLabel()}（香港时间）开放登记。`;
}

/** 首页 / 场次列表未开放时的按钮文案 */
export function ticketSaleCtaLabel(): string {
  if (isTicketSaleEnded()) return "购票已结束";
  return `${ticketSaleOpensLabel()} 开票`;
}

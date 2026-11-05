/** 开票时间：2026-11-10 20:00（香港/深圳，UTC+8） */
export const TICKET_SALE_OPENS_AT = new Date("2026-11-10T20:00:00+08:00");

export function isTicketSaleOpen(now: Date = new Date()): boolean {
  return now.getTime() >= TICKET_SALE_OPENS_AT.getTime();
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
  return `购票尚未开始，将于 ${ticketSaleOpensLabel()}（香港时间）开放登记。`;
}

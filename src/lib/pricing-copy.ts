import { centsToCny } from "./money";

export function audiencePricingSummary(ticketPriceCents: number, depositCents: number): string {
  if (ticketPriceCents === 0) {
    return `公益免费入场 · 按金 ${centsToCny(depositCents)}/人（到场核销后全额退还）`;
  }
  return `票价 ${centsToCny(ticketPriceCents)} · 按金 ${centsToCny(depositCents)} · 合计应付 ${centsToCny(ticketPriceCents + depositCents)}/人`;
}

export function depositRuleNotice(): string {
  return "公益演出不收票价，仅预收按金。到场出示电子票核销后，按金全额退还；未到场不退还。转账时请务必备注订单号。";
}

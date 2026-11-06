import { centsToCny } from "./money";
import { DEPOSIT_HKD_PER_TICKET, DEPOSIT_RMB_PER_TICKET } from "./payment-methods";

/** 每人按金双币展示：¥50 或 HK$60 */
export function depositPerPersonLabel(): string {
  return `¥${DEPOSIT_RMB_PER_TICKET} 或 HK$${DEPOSIT_HKD_PER_TICKET}`;
}

export function depositHeroNote(): string {
  return `每张票需缴 ${depositPerPersonLabel()} 按金，到场观演后全额退还`;
}

export function audiencePricingSummary(ticketPriceCents: number, depositCents: number): string {
  if (ticketPriceCents === 0) {
    return `公益免费入场 · 按金 ${depositPerPersonLabel()}/人（到场核销后全额退还）`;
  }
  return `票价 ${centsToCny(ticketPriceCents)} · 按金 ${depositPerPersonLabel()}/人`;
}

export function depositRuleNotice(): string {
  return `公益演出不收票价，仅预收按金 ${depositPerPersonLabel()}/人。到场核对接购票编号与手机号后，按金全额退还；未到场不退还。转账时请务必备注登记手机号。`;
}

export function depositGuideCopy(): string {
  return `本场为公益演出，门票免费。每张门票需缴纳按金 ${depositPerPersonLabel()}；演出当天完成签到并到场观演后，按金将原路全额退还。`;
}

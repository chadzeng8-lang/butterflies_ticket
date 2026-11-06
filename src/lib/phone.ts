/** Digits only from a phone string. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Last 4 digits for on-site refund checks. */
export function phoneTail(phone: string, length = 4): string {
  const digits = phoneDigits(phone);
  if (!digits) return "—";
  return digits.slice(-length);
}

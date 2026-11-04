import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return process.env.TICKET_SECRET || "dev-insecure-ticket-secret";
}

export function signTicketCode(ticketCode: string): string {
  const sig = createHmac("sha256", secret()).update(ticketCode).digest("base64url");
  return `${ticketCode}.${sig}`;
}

export function verifyTicketToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [code, sig] = parts;
  if (!code || !sig) return null;
  const expected = createHmac("sha256", secret()).update(code).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return code;
  } catch {
    return null;
  }
}

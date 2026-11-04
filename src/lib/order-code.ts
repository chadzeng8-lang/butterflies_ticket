const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderCode(): string {
  let body = "";
  for (let i = 0; i < 4; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `MT-${body}`;
}

export function generateTicketCode(): string {
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `T-${body}`;
}

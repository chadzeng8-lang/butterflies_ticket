import { getPublicSiteUrl } from "@/lib/site-url";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

type TicketEmailErrorCode =
  | "EMAIL_CONFIG_MISSING"
  | "EMAIL_API_KEY_INVALID"
  | "EMAIL_SENDER_UNVERIFIED"
  | "EMAIL_RECIPIENT_RESTRICTED"
  | "EMAIL_PROVIDER_REJECTED"
  | "EMAIL_RATE_LIMITED"
  | "EMAIL_PROVIDER_UNAVAILABLE"
  | "EMAIL_NETWORK_ERROR";

function classifyProviderError(status: number, message: string): TicketEmailErrorCode {
  const normalized = message.toLowerCase();
  if (status === 401) return "EMAIL_API_KEY_INVALID";
  if (
    status === 403 &&
    (normalized.includes("only send testing") ||
      normalized.includes("only send to") ||
      normalized.includes("testing emails"))
  ) {
    return "EMAIL_RECIPIENT_RESTRICTED";
  }
  if (
    status === 403 &&
    (normalized.includes("domain") ||
      normalized.includes("sender") ||
      normalized.includes("verified"))
  ) {
    return "EMAIL_SENDER_UNVERIFIED";
  }
  if (status === 429) return "EMAIL_RATE_LIMITED";
  if (status >= 500) return "EMAIL_PROVIDER_UNAVAILABLE";
  return "EMAIL_PROVIDER_REJECTED";
}

export async function sendTicketIssuedEmail(input: {
  to: string;
  buyerName: string;
  orderCode: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const siteUrl = getPublicSiteUrl();
  if (!apiKey || !from || !siteUrl) {
    throw new Error("EMAIL_CONFIG_MISSING");
  }

  const orderUrl = new URL(`/orders/${encodeURIComponent(input.orderCode)}`, siteUrl);
  const name = escapeHtml(input.buyerName);
  const code = escapeHtml(input.orderCode);
  const url = escapeHtml(orderUrl.toString());

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `《蝶》电子票已出票 · ${input.orderCode}`,
        html: `<p>${name}，你好：</p><p>你的《蝶》订单 <strong>${code}</strong> 已确认并出票。</p><p>请登录购票账号查看电子票及入场二维码：</p><p><a href="${url}">${url}</a></p><p>请勿转发此邮件中的订单链接。</p>`,
      }),
    });
  } catch {
    throw new Error("EMAIL_NETWORK_ERROR");
  }

  if (!response.ok) {
    let providerMessage = "";
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
      ) {
        providerMessage = body.message;
      }
    } catch {
      providerMessage = "";
    }
    throw new Error(classifyProviderError(response.status, providerMessage));
  }
}

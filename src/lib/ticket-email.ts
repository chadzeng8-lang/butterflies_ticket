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

export async function sendTicketIssuedEmail(input: {
  to: string;
  buyerName: string;
  orderCode: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!apiKey || !from || !siteUrl) {
    throw new Error("EMAIL_CONFIG_MISSING");
  }

  const orderUrl = new URL(`/orders/${encodeURIComponent(input.orderCode)}`, siteUrl);
  const name = escapeHtml(input.buyerName);
  const code = escapeHtml(input.orderCode);
  const url = escapeHtml(orderUrl.toString());
  const response = await fetch("https://api.resend.com/emails", {
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

  if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}

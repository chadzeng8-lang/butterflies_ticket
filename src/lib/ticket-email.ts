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

const AUTO_SEND_NOTICE =
  "本邮件由系统自动发送，请勿直接回复。如需协助，请联系主办方或查看网站页脚联系方式。";

async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("EMAIL_CONFIG_MISSING");
  }

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
        subject: input.subject,
        html: input.html,
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

function orderUrl(orderCode: string): string {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) {
    throw new Error("EMAIL_CONFIG_MISSING");
  }
  return new URL(`/orders/${encodeURIComponent(orderCode)}`, siteUrl).toString();
}

function greeting(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${escapeHtml(trimmed)}，你好：` : "你好：";
}

function emailShell(bodyHtml: string): string {
  return `<p style="color:#666;font-size:13px;">${escapeHtml(AUTO_SEND_NOTICE)}</p>${bodyHtml}`;
}

/** 用户提交订单后：引导去付款并上传凭证 */
export async function sendOrderCreatedEmail(input: {
  to: string;
  buyerName: string;
  orderCode: string;
}): Promise<void> {
  const url = orderUrl(input.orderCode);
  const safeUrl = escapeHtml(url);

  await sendResendEmail({
    to: input.to,
    subject: `《蝶》订单已创建 · 请尽快缴付按金`,
    html: emailShell(`
      <p>${greeting(input.buyerName)}</p>
      <p>你的《蝶》沉浸版展演订单已创建成功，目前状态为<strong>待付款</strong>。</p>
      <p><strong>下一步请完成：</strong></p>
      <ol>
        <li>打开订单页，按指引缴付按金（¥50 或 HK$60 / 张，到场观演后全额退还）；转账备注请填写购票编号及手机号。</li>
        <li>上传付款截图，并点击「我已付款」提交凭证。</li>
        <li>在订单页扫码加入微信观演群「港中深观剧群」，以便接收演出通知。</li>
        <li>提交后请耐心等待干事核对到账；确认后会再次发信通知出票。</li>
      </ol>
      <p><a href="${safeUrl}">打开订单页</a></p>
      <p>请尽快完成付款。若未在时限内提交，订单可能过期并释放座位。</p>
    `),
  });
}

/** 用户提交付款凭证后：引导等待审核 */
export async function sendPaymentSubmittedEmail(input: {
  to: string;
  buyerName: string;
  orderCode: string;
}): Promise<void> {
  const url = orderUrl(input.orderCode);
  const safeUrl = escapeHtml(url);

  await sendResendEmail({
    to: input.to,
    subject: `《蝶》已收到付款申报 · 等待出票`,
    html: emailShell(`
      <p>${greeting(input.buyerName)}</p>
      <p>我们已收到你的付款申报，目前状态为<strong>待确认</strong>。</p>
      <p><strong>下一步：</strong></p>
      <ol>
        <li>请耐心等待干事核对到账，无需重复转账。</li>
        <li>审核通过后，系统会发送出票邮件；请同时留意收件箱与垃圾邮件。</li>
        <li>出票后可在订单页或「票夹」查看购票编号。</li>
      </ol>
      <p><a href="${safeUrl}">打开订单页</a></p>
      <p>如长时间未收到出票通知，可登录网站查看订单状态，或联系主办方协助。</p>
    `),
  });
}

/** 审核出票后 */
export async function sendTicketIssuedEmail(input: {
  to: string;
  buyerName: string;
  orderCode: string;
  purchaseNo?: number | null;
  phone?: string;
  quantity?: number;
}): Promise<void> {
  const url = orderUrl(input.orderCode);
  const safeUrl = escapeHtml(url);
  const purchaseNo =
    typeof input.purchaseNo === "number" && input.purchaseNo > 0
      ? String(input.purchaseNo)
      : null;
  const phone = escapeHtml((input.phone || "").trim() || "登记手机号");
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

  await sendResendEmail({
    to: input.to,
    subject: purchaseNo
      ? `《蝶》已出票 · 购票编号 ${purchaseNo}`
      : `《蝶》已出票 · 请核对购票编号`,
    html: emailShell(`
      <p>${greeting(input.buyerName)}</p>
      <p>你的《蝶》沉浸版展演订单已确认并<strong>出票</strong>${
        purchaseNo
          ? `，购票编号为 <strong style="font-size:1.4em;">${escapeHtml(purchaseNo)}</strong>`
          : ""
      }（共 ${quantity} 张）。</p>
      <p><strong>入场方式：</strong>现场核对${
        purchaseNo
          ? `购票编号 <strong style="font-size:1.25em;">${escapeHtml(purchaseNo)}</strong>`
          : "购票编号"
      }与手机号 <strong>${phone}</strong>，无需出示二维码。</p>
      <p><strong>下一步：</strong></p>
      <ol>
        <li>打开订单页或「票夹」，核对${
          purchaseNo
            ? `购票编号 <strong>${escapeHtml(purchaseNo)}</strong>`
            : "购票编号"
        }与登记手机号 <strong>${phone}</strong>。</li>
        <li>演出当天提前入场，向工作人员报购票编号并核对手机号。</li>
        <li>入校预约指南开放后，请按网站「入校指南」完成访客预约。</li>
      </ol>
      <p><a href="${safeUrl}">打开订单页</a></p>
      <p>请妥善保存购票编号与登记手机号；如长时间未在网站看到编号，可联系主办方协助。</p>
    `),
  });
}

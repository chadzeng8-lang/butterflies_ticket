import Image from "next/image";
import { depositAmounts, FPS_MOBILE, PAYMENT_METHODS } from "@/lib/payment-methods";

export function PaymentMethods({
  quantity,
  phone,
  purchaseNo,
}: {
  quantity: number;
  phone: string;
  purchaseNo?: number | null;
}) {
  const { rmb, hkd } = depositAmounts(quantity);
  const remarkPhone = phone.trim() || "登记手机号";

  return (
    <div className="payment-methods">
      <div className="notice">
        <strong>转账备注请填写购票编号及手机号</strong>
        <div className="payment-remark-values">
          <div>
            <span className="payment-remark-label">购票编号</span>
            <div className="order-code">{purchaseNo || "—"}</div>
          </div>
          <div>
            <span className="payment-remark-label">手机号</span>
            <div className="order-code">{remarkPhone}</div>
          </div>
        </div>
        <span>
          应付按金：<strong>¥{rmb}</strong> 或 <strong>HK${hkd}</strong>
          （{quantity} 张 × ¥50 / HK$60）。请任选一种方式付款。
        </span>
      </div>

      <div className="payment-accordion">
        {PAYMENT_METHODS.map((method) => (
          <details key={method.id} className="payment-fold">
            <summary>
              <span className="payment-fold-title">{method.name}</span>
              <span className="payment-fold-hint">{method.note}</span>
              <span className="payment-fold-toggle" aria-hidden>
                <span className="payment-fold-closed">展开收款码</span>
                <span className="payment-fold-open">收起</span>
              </span>
            </summary>
            <div className="payment-fold-body">
              <figure className="payment-card">
                <Image
                  src={method.image}
                  alt={`${method.name}收款码`}
                  width={720}
                  height={960}
                  className="payment-card-image"
                  sizes="(max-width: 720px) 90vw, 360px"
                />
              </figure>
              {method.id === "fps" && (
                <div className="payment-fps-inline">
                  <span>也可在银行 App 输入手机号：</span>
                  <code className="payment-phone">{FPS_MOBILE}</code>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

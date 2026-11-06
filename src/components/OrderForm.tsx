"use client";

import { useActionState, useState } from "react";
import { createOrderAction, type ActionState } from "@/app/actions/orders";
import { BusyButton } from "@/components/BusyButton";
import type { IdDocType } from "@/lib/attendees";
import { ID_DOC_TYPE_LABEL } from "@/lib/attendees";

const initial: ActionState = {};

function AttendeeFields({
  index,
  pending,
  defaultDocType = "mainland_id",
}: {
  index: number;
  pending: boolean;
  defaultDocType?: IdDocType;
}) {
  const [docType, setDocType] = useState<IdDocType>(defaultDocType);

  return (
    <fieldset className="attendee-fieldset" disabled={pending}>
      <legend>观众 {index}</legend>
      <label>
        姓名
        <input
          name={`attendee_${index}_name`}
          required
          placeholder="与证件一致的姓名"
          autoComplete="name"
        />
      </label>
      <label>
        电话
        <input
          name={`attendee_${index}_phone`}
          required
          placeholder="便于入校与现场联系"
          inputMode="tel"
          autoComplete="tel"
        />
      </label>
      <label>
        证件类型
        <select
          name={`attendee_${index}_id_doc_type`}
          required
          value={docType}
          onChange={(event) => setDocType(event.target.value as IdDocType)}
        >
          <option value="mainland_id">{ID_DOC_TYPE_LABEL.mainland_id}</option>
          <option value="hk_home_return">{ID_DOC_TYPE_LABEL.hk_home_return}</option>
        </select>
      </label>
      <label>
        证件号
        <input
          name={`attendee_${index}_id_number`}
          required
          placeholder={
            docType === "mainland_id"
              ? "内地居民身份证号码"
              : "港澳居民来往内地通行证（回乡证）号码"
          }
          autoComplete="off"
        />
      </label>
    </fieldset>
  );
}

export function OrderForm({
  showId,
  maxQuantity,
  accountEmail,
}: {
  showId: number;
  maxQuantity: number;
  accountEmail: string;
}) {
  const [state, action, pending] = useActionState(createOrderAction, initial);
  const max = Math.min(5, Math.max(1, maxQuantity));
  const [quantity, setQuantity] = useState(1);

  return (
    <form action={action} className="form" aria-busy={pending}>
      <input type="hidden" name="showId" value={showId} />
      <p className="muted" style={{ marginTop: 0 }}>
        按学校入校要求，需为每位观众填写姓名、电话与证件号。内地填身份证，香港填回乡证。此信息仅作入校登记，不参与付款确认。
      </p>
      <label>
        票数（每人最多 5 张）
        <select
          name="quantity"
          value={quantity}
          disabled={pending}
          onChange={(event) => setQuantity(Number(event.target.value) || 1)}
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} 张
            </option>
          ))}
        </select>
      </label>
      <label>
        联系邮箱
        <input
          name="contactExtra"
          type="email"
          required
          defaultValue={accountEmail}
          placeholder="注册账号邮箱"
          autoComplete="email"
          disabled={pending}
        />
      </label>

      {Array.from({ length: quantity }, (_, i) => i + 1).map((index) => (
        <AttendeeFields key={index} index={index} pending={pending} />
      ))}

      {state.error && <div className="error">{state.error}</div>}
      <BusyButton pending={pending} pendingLabel="提交中…" disabled={max < 1}>
        提交订单
      </BusyButton>
      {pending && <p className="form-busy-hint">正在处理，请稍候，不要重复点击。</p>}
    </form>
  );
}

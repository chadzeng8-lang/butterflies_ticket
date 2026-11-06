"use client";

import { useActionState, useState } from "react";
import {
  updateOrderAttendeesAction,
  type ActionState,
} from "@/app/actions/orders";
import { BusyButton } from "@/components/BusyButton";
import {
  ID_DOC_TYPE_LABEL,
  type IdDocType,
  type OrderAttendee,
} from "@/lib/attendees";

const initial: ActionState = {};

function AttendeeEditFields({
  index,
  attendee,
  pending,
}: {
  index: number;
  attendee: OrderAttendee;
  pending: boolean;
}) {
  const [docType, setDocType] = useState<IdDocType>(attendee.idDocType);

  return (
    <fieldset className="attendee-fieldset" disabled={pending}>
      <legend>观众 {index}</legend>
      <label>
        姓名
        <input
          name={`attendee_${index}_name`}
          required
          defaultValue={attendee.fullName}
          placeholder="与证件一致的姓名"
          autoComplete="name"
        />
      </label>
      <label>
        电话
        <input
          name={`attendee_${index}_phone`}
          required
          defaultValue={attendee.phone}
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
          defaultValue={attendee.idNumber}
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

export function OrderAttendeeEditor({
  orderCode,
  quantity,
  attendees,
}: {
  orderCode: string;
  quantity: number;
  attendees: OrderAttendee[];
}) {
  const [state, action, pending] = useActionState(
    updateOrderAttendeesAction,
    initial,
  );

  const rows =
    attendees.length === quantity
      ? attendees
      : Array.from({ length: quantity }, (_, i) => {
          const existing = attendees.find((item) => item.sortIndex === i + 1);
          return (
            existing || {
              sortIndex: i + 1,
              fullName: "",
              phone: "",
              idDocType: "mainland_id" as IdDocType,
              idNumber: "",
            }
          );
        });

  return (
    <article className="panel">
      <h2>观众登记信息</h2>
      <p className="muted" style={{ marginBottom: "0.9rem" }}>
        学校入校要求收集的姓名、电话与证件号。可随时在此修改；不参与付款确认流程。
      </p>
      <form action={action} className="form" aria-busy={pending}>
        <input type="hidden" name="code" value={orderCode} />
        <input type="hidden" name="quantity" value={quantity} />
        {rows.map((attendee) => (
          <AttendeeEditFields
            key={attendee.sortIndex}
            index={attendee.sortIndex}
            attendee={attendee}
            pending={pending}
          />
        ))}
        {state.error && <div className="error">{state.error}</div>}
        {state.ok && <div className="success">{state.ok}</div>}
        <BusyButton pending={pending} pendingLabel="保存中…">
          保存观众信息
        </BusyButton>
      </form>
    </article>
  );
}

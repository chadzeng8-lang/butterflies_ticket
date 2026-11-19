"use client";

import { useActionState, useState } from "react";
import {
  updateOrderAttendeesAction,
  type ActionState,
} from "@/app/actions/orders";
import { BusyButton } from "@/components/BusyButton";
import {
  ID_DOC_TYPE_LABEL,
  type AttendeeIdMode,
  type IdDocType,
  type OrderAttendee,
} from "@/lib/attendees";

const initial: ActionState = {};

function AttendeeEditFields({
  index,
  attendee,
  pending,
  idMode,
}: {
  index: number;
  attendee: OrderAttendee;
  pending: boolean;
  idMode: AttendeeIdMode;
}) {
  const [docType, setDocType] = useState<IdDocType>(
    idMode === "student_id" ? "student_id" : attendee.idDocType,
  );

  return (
    <fieldset className="attendee-fieldset" disabled={pending}>
      <legend>观众 {index}</legend>
      <label>
        姓名
        <input
          name={`attendee_${index}_name`}
          required
          defaultValue={attendee.fullName}
          placeholder={
            idMode === "student_id" ? "与学籍资料一致的姓名" : "与证件一致的姓名"
          }
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
      {idMode === "student_id" ? (
        <>
          <input
            type="hidden"
            name={`attendee_${index}_id_doc_type`}
            value="student_id"
          />
          <label>
            学号
            <input
              name={`attendee_${index}_id_number`}
              required
              defaultValue={attendee.idNumber}
              placeholder="香港中文大学 / 香港中文大学（深圳）学号"
              autoComplete="off"
            />
          </label>
        </>
      ) : (
        <>
          <label>
            证件类型
            <select
              name={`attendee_${index}_id_doc_type`}
              required
              value={docType === "student_id" ? "mainland_id" : docType}
              onChange={(event) => setDocType(event.target.value as IdDocType)}
            >
              <option value="mainland_id">{ID_DOC_TYPE_LABEL.mainland_id}</option>
              <option value="hk_home_return">
                {ID_DOC_TYPE_LABEL.hk_home_return}
              </option>
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
        </>
      )}
    </fieldset>
  );
}

export function OrderAttendeeEditor({
  orderCode,
  quantity,
  attendees,
  idMode = "id_card",
}: {
  orderCode: string;
  quantity: number;
  attendees: OrderAttendee[];
  idMode?: AttendeeIdMode;
}) {
  const [state, action, pending] = useActionState(
    updateOrderAttendeesAction,
    initial,
  );

  const defaultDocType: IdDocType =
    idMode === "student_id" ? "student_id" : "mainland_id";

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
              idDocType: defaultDocType,
              idNumber: "",
            }
          );
        });

  return (
    <article className="panel">
      <h2>观众登记信息</h2>
      <p className="muted" style={{ marginBottom: "0.9rem" }}>
        {idMode === "student_id"
          ? "本场为校内场，收集姓名、电话与学号。可随时在此修改；不参与付款确认流程。"
          : "学校入校要求收集的姓名、电话与证件号。可随时在此修改；不参与付款确认流程。"}
      </p>
      <form action={action} className="form" aria-busy={pending}>
        <input type="hidden" name="code" value={orderCode} />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="idMode" value={idMode} />
        {rows.map((attendee) => (
          <AttendeeEditFields
            key={attendee.sortIndex}
            index={attendee.sortIndex}
            attendee={attendee}
            pending={pending}
            idMode={idMode}
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

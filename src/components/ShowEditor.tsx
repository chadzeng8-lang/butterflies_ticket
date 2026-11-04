"use client";

import { useActionState } from "react";
import {
  createShowAction,
  updateShowAction,
  type ActionState,
} from "@/app/actions/admin";
import { centsToCny } from "@/lib/money";

const initial: ActionState = {};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateShowForm() {
  const [state, action, pending] = useActionState(createShowAction, initial);
  return (
    <form action={action} className="form">
      <label>
        标题
        <input name="title" required />
      </label>
      <label>
        地点
        <input name="venue" required />
      </label>
      <label>
        开演时间
        <input name="startsAt" type="datetime-local" required />
      </label>
      <label>
        容量
        <input name="capacity" type="number" min={1} defaultValue={100} required />
      </label>
      <label>
        票价（人民币，公益演出填 0）
        <input name="ticketPrice" type="number" min={0} step="0.01" defaultValue={0} />
      </label>
      <label>
        按金（人民币，到场全退）
        <input name="deposit" type="number" min={0} step="0.01" defaultValue={50} />
      </label>
      <label>
        付款说明
        <textarea
          name="paymentNote"
          defaultValue="公益演出仅收按金 ¥50/人，到场全额退还。可用微信 / 支付宝转账，备注订单号。"
          placeholder="例如：FPS 识别码 / 微信名"
        />
      </label>
      <label>
        简介
        <textarea name="description" />
      </label>
      <label className="row">
        <input name="onSale" type="checkbox" defaultChecked /> 开售
      </label>
      {state.error && <div className="error">{state.error}</div>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "创建中…" : "创建场次"}
      </button>
    </form>
  );
}

type ShowEditProps = {
  show: {
    id: number;
    title: string;
    description: string;
    venue: string;
    startsAt: string;
    capacity: number;
    ticketPriceCents: number;
    depositCents: number;
    onSale: number;
    paymentNote: string;
    wechatQrPath: string | null;
    alipayQrPath: string | null;
    fpsQrPath: string | null;
  };
};

export function EditShowForm({ show }: ShowEditProps) {
  const [state, action, pending] = useActionState(updateShowAction, initial);
  return (
    <form action={action} className="form">
      <input type="hidden" name="id" value={show.id} />
      <label>
        标题
        <input name="title" defaultValue={show.title} required />
      </label>
      <label>
        地点
        <input name="venue" defaultValue={show.venue} required />
      </label>
      <label>
        开演时间
        <input
          name="startsAt"
          type="datetime-local"
          defaultValue={toLocalInputValue(show.startsAt)}
          required
        />
      </label>
      <label>
        容量
        <input name="capacity" type="number" min={1} defaultValue={show.capacity} required />
      </label>
      <label>
        票价（人民币）
        <input
          name="ticketPrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={show.ticketPriceCents / 100}
        />
      </label>
      <label>
        按金（人民币）
        <input
          name="deposit"
          type="number"
          min={0}
          step="0.01"
          defaultValue={show.depositCents / 100}
        />
      </label>
      <p className="muted">
        当前：票价 {centsToCny(show.ticketPriceCents)} · 按金 {centsToCny(show.depositCents)}
      </p>
      <label>
        付款说明
        <textarea name="paymentNote" defaultValue={show.paymentNote} />
      </label>
      <label>
        简介
        <textarea name="description" defaultValue={show.description} />
      </label>
      <label className="row">
        <input name="onSale" type="checkbox" defaultChecked={show.onSale === 1} /> 开售
      </label>
      <label>
        微信收款码
        <input type="file" name="wechatQr" accept="image/*" />
        {show.wechatQrPath && (
          <span className="muted">已上传：{show.wechatQrPath}</span>
        )}
      </label>
      <label>
        支付宝收款码
        <input type="file" name="alipayQr" accept="image/*" />
        {show.alipayQrPath && (
          <span className="muted">已上传：{show.alipayQrPath}</span>
        )}
      </label>
      <label>
        FPS / PayMe 收款码
        <input type="file" name="fpsQr" accept="image/*" />
        {show.fpsQrPath && <span className="muted">已上传：{show.fpsQrPath}</span>}
      </label>
      {state.error && <div className="error">{state.error}</div>}
      {state.ok && <div className="success">{state.ok}</div>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存场次"}
      </button>
    </form>
  );
}

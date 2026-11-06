"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  bulkDeleteOrdersAction,
  bulkSetOrderStatusAction,
  closeSupabaseOrderAction,
  confirmSupabaseOrderAction,
  sendTicketEmailAction,
  updateSupabaseOrderAction,
} from "@/app/actions/supabase-admin";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export type BulkOrderRow = {
  id: number;
  code: string;
  showId: number;
  buyerName: string;
  phone: string;
  contactExtra: string;
  quantity: number;
  status: OrderStatus;
  adminNote: string;
  emailSentAt: string | null;
  accountEmail: string;
  purchaseNo: number;
};

export type BulkOrderGroup = {
  showId: number;
  showTime: string;
  showTitle: string;
  venue: string;
  capacity: number;
  remaining: number;
  orders: BulkOrderRow[];
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "cancelled",
  "expired",
];

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending_payment":
    case "pending_confirm":
      return "badge warn";
    case "issued":
    case "checked_in":
    case "deposit_refunded":
      return "badge success";
    case "cancelled":
    case "expired":
      return "badge danger";
    default:
      return "badge";
  }
}

function OrderSheetRow({
  order,
  checked,
  onToggle,
}: {
  order: BulkOrderRow;
  checked: boolean;
  onToggle: (code: string, next: boolean) => void;
}) {
  const formId = `order-edit-${order.id}`;
  const label = `编号 ${order.purchaseNo}`;
  return (
    <tr>
      <td className="admin-sheet-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggle(order.code, event.target.checked)}
          aria-label={`选择 ${label}`}
        />
      </td>
      <td className="admin-sheet-code">
        <form id={formId} action={updateSupabaseOrderAction}>
          <input type="hidden" name="code" value={order.code} />
          <input type="hidden" name="buyerName" value={order.buyerName || "观众"} />
          <input type="hidden" name="showId" value={order.showId} />
          <input type="hidden" name="accountEmail" value={order.accountEmail} />
        </form>
        <strong>{order.purchaseNo}</strong>
        <span className={statusBadgeClass(order.status)}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </td>
      <td>
        <select
          form={formId}
          name="status"
          defaultValue={order.status}
          aria-label={`${label} 状态`}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          form={formId}
          name="phone"
          defaultValue={order.phone}
          required
          aria-label={`${label} 手机`}
        />
      </td>
      <td>
        <input
          form={formId}
          name="contactExtra"
          type="email"
          defaultValue={order.contactExtra}
          placeholder="联系电邮"
          aria-label={`${label} 联系电邮`}
        />
      </td>
      <td>
        <input
          form={formId}
          name="quantity"
          type="number"
          min={1}
          max={20}
          defaultValue={order.quantity}
          required
          aria-label={`${label} 张数`}
        />
      </td>
      <td>
        <input
          form={formId}
          name="adminNote"
          defaultValue={order.adminNote}
          aria-label={`${label} 备注`}
        />
      </td>
      <td className="admin-sheet-actions">
        <button type="submit" form={formId} className="btn">
          保存
        </button>
        {order.status === "pending_confirm" && (
          <form action={confirmSupabaseOrderAction}>
            <input type="hidden" name="code" value={order.code} />
            <PendingSubmitButton className="btn secondary" pendingLabel="出票中…">
              出票
            </PendingSubmitButton>
          </form>
        )}
        {["issued", "checked_in", "deposit_refunded"].includes(order.status) && (
          <form action={sendTicketEmailAction}>
            <input type="hidden" name="code" value={order.code} />
            <PendingSubmitButton className="btn secondary" pendingLabel="发送中…">
              {order.emailSentAt ? "重发" : "发信"}
            </PendingSubmitButton>
          </form>
        )}
        {(order.status === "pending_payment" ||
          order.status === "pending_confirm") && (
          <>
            <form action={closeSupabaseOrderAction}>
              <input type="hidden" name="code" value={order.code} />
              <input type="hidden" name="status" value="cancelled" />
              <input type="hidden" name="reason" value="管理员驳回" />
              <PendingSubmitButton className="btn danger" pendingLabel="处理中…">
                驳回
              </PendingSubmitButton>
            </form>
            <form action={closeSupabaseOrderAction}>
              <input type="hidden" name="code" value={order.code} />
              <input type="hidden" name="status" value="expired" />
              <input type="hidden" name="reason" value="管理员释放库存" />
              <PendingSubmitButton className="btn secondary" pendingLabel="处理中…">
                释放
              </PendingSubmitButton>
            </form>
          </>
        )}
      </td>
    </tr>
  );
}

export function OnlineOrdersBulkPanel({ groups }: { groups: BulkOrderGroup[] }) {
  const allCodes = useMemo(
    () => groups.flatMap((group) => group.orders.map((order) => order.code)),
    [groups],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("issued");
  const [pending, startTransition] = useTransition();

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleCode(code: string, next: boolean) {
    setSelected((prev) => {
      if (next) {
        return prev.includes(code) ? prev : [...prev, code];
      }
      return prev.filter((item) => item !== code);
    });
  }

  function toggleGroup(codes: string[], next: boolean) {
    setSelected((prev) => {
      const set = new Set(prev);
      for (const code of codes) {
        if (next) set.add(code);
        else set.delete(code);
      }
      return Array.from(set);
    });
  }

  function toggleAll(next: boolean) {
    setSelected(next ? [...allCodes] : []);
  }

  function runBulk(
    action: (formData: FormData) => Promise<void>,
    confirmMessage?: string,
  ) {
    if (selected.length === 0) {
      window.alert("请先勾选订单。");
      return;
    }
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formData = new FormData();
    for (const code of selected) formData.append("codes", code);
    formData.set("status", bulkStatus);
    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <div className="admin-sheet-groups">
      <div className="admin-bulk-bar">
        <label className="admin-bulk-select-all">
          <input
            type="checkbox"
            checked={allCodes.length > 0 && selected.length === allCodes.length}
            onChange={(event) => toggleAll(event.target.checked)}
            disabled={allCodes.length === 0 || pending}
          />
          全选
        </label>
        <span className="muted">已选 {selected.length} 笔</span>
        <label className="admin-bulk-status">
          批量状态
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
            disabled={pending}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() =>
            runBulk(
              bulkSetOrderStatusAction,
              `将已选 ${selected.length} 笔订单改为「${ORDER_STATUS_LABEL[bulkStatus]}」？`,
            )
          }
        >
          {pending ? "处理中…" : "批量改状态"}
        </button>
        <button
          type="button"
          className="btn danger"
          disabled={pending}
          onClick={() =>
            runBulk(
              bulkDeleteOrdersAction,
              `确定删除已选 ${selected.length} 笔订单？此操作不可恢复。`,
            )
          }
        >
          {pending ? "处理中…" : "批量删除"}
        </button>
      </div>

      {groups.map((group) => {
        const codes = group.orders.map((order) => order.code);
        const selectedInGroup = codes.filter((code) => selectedSet.has(code)).length;
        const allSelected =
          codes.length > 0 && selectedInGroup === codes.length;

        return (
          <section className="admin-sheet-group" key={group.showId}>
            <div className="admin-sheet-group-head">
              <div>
                <h2>{group.showTime}</h2>
                <p className="muted">
                  {group.showTitle} · {group.venue}
                </p>
              </div>
              <div className="admin-sheet-group-actions">
                <p className="admin-sheet-stock">
                  总票数 <strong>{group.capacity}</strong>
                  <span aria-hidden>·</span>
                  余票 <strong>{group.remaining}</strong>
                  <span aria-hidden>·</span>
                  本表 {group.orders.length} 笔
                </p>
                <Link
                  className="btn secondary"
                  href={`/admin/online-orders/export?showId=${group.showId}`}
                >
                  导出本场
                </Link>
              </div>
            </div>
            {group.orders.length === 0 ? (
              <div className="panel muted">本场暂无符合条件的订单。</div>
            ) : (
              <div className="admin-sheet-wrap">
                <table className="admin-sheet">
                  <thead>
                    <tr>
                      <th className="admin-sheet-check">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(event) =>
                            toggleGroup(codes, event.target.checked)
                          }
                          aria-label={`全选 ${group.showTime}`}
                          disabled={pending}
                        />
                      </th>
                      <th>购票编号</th>
                      <th>状态</th>
                      <th>手机</th>
                      <th>联系电邮</th>
                      <th>张数</th>
                      <th>备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.orders.map((order) => (
                      <OrderSheetRow
                        key={order.id}
                        order={order}
                        checked={selectedSet.has(order.code)}
                        onToggle={toggleCode}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

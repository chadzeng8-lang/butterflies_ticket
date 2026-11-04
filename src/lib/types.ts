export type OrderStatus =
  | "pending_payment"
  | "pending_confirm"
  | "issued"
  | "checked_in"
  | "deposit_refunded"
  | "cancelled"
  | "expired";

export type Show = {
  id: number;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  capacity: number;
  ticketPriceCents: number;
  depositCents: number;
  onSale: number;
  wechatQrPath: string | null;
  alipayQrPath: string | null;
  fpsQrPath: string | null;
  paymentNote: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: number;
  code: string;
  showId: number;
  buyerName: string;
  phone: string;
  contactExtra: string;
  quantity: number;
  ticketTotalCents: number;
  depositTotalCents: number;
  status: OrderStatus;
  paymentProofPath: string | null;
  adminNote: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type Ticket = {
  id: number;
  orderId: number;
  code: string;
  checkedInAt: string | null;
  depositRefundedAt: string | null;
  refundedBy: string | null;
  createdAt: string;
};

export type OrderWithShow = Order & {
  showTitle: string;
  showVenue: string;
  showStartsAt: string;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  pending_confirm: "待确认",
  issued: "已出票",
  checked_in: "已核销",
  deposit_refunded: "按金已退",
  cancelled: "已取消",
  expired: "已过期",
};

export const ACTIVE_HOLD_STATUSES: OrderStatus[] = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "checked_in",
  "deposit_refunded",
];

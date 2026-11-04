import fs from "fs";
import path from "path";
import type { Order, OrderStatus, OrderWithShow, Show, Ticket } from "./types";
import { ACTIVE_HOLD_STATUSES } from "./types";
import { generateOrderCode, generateTicketCode } from "./order-code";
import { signTicketCode } from "./ticket-token";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

type Store = {
  shows: Show[];
  orders: Order[];
  tickets: Ticket[];
  nextShowId: number;
  nextOrderId: number;
  nextTicketId: number;
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

function emptyStore(): Store {
  return {
    shows: [],
    orders: [],
    tickets: [],
    nextShowId: 1,
    nextOrderId: 1,
    nextTicketId: 1,
  };
}

/** 每次从磁盘读取，避免 Next.js 多实例内存缓存把订单状态覆盖掉。 */
function loadStore(): Store {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const empty = emptyStore();
    writeStore(empty);
    return empty;
  }
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw) as Store;
}

function writeStore(store: Store) {
  ensureDirs();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

function mutate(fn: (store: Store) => void) {
  const store = loadStore();
  fn(store);
  writeStore(store);
}

function nowIso() {
  return new Date().toISOString();
}

function paymentTimeoutMinutes() {
  const n = Number(process.env.PAYMENT_TIMEOUT_MINUTES || "45");
  return Number.isFinite(n) && n > 0 ? n : 45;
}

/** 兼容旧脚本；JSON 存储无需单独初始化连接。 */
export function getDb(): Store {
  return loadStore();
}

export function expireStaleOrders(): number {
  const now = nowIso();
  let changes = 0;
  mutate((store) => {
    for (const order of store.orders) {
      if (order.status === "pending_payment" && order.expiresAt < now) {
        order.status = "expired";
        order.updatedAt = now;
        changes += 1;
      }
    }
  });
  return changes;
}

export function getHeldSeats(showId: number): number {
  expireStaleOrders();
  const store = loadStore();
  return store.orders
    .filter((o) => o.showId === showId && ACTIVE_HOLD_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.quantity, 0);
}

export function getRemainingSeats(show: Show): number {
  return Math.max(0, show.capacity - getHeldSeats(show.id));
}

export function listShows(includeOffSale = false): Show[] {
  expireStaleOrders();
  const store = loadStore();
  return store.shows
    .filter((s) => includeOffSale || s.onSale === 1)
    .slice()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => ({ ...s }));
}

export function getShow(id: number): Show | null {
  const show = loadStore().shows.find((s) => s.id === id);
  return show ? { ...show } : null;
}

export function createShow(input: {
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  capacity: number;
  ticketPriceCents: number;
  depositCents: number;
  onSale: boolean;
  paymentNote: string;
}): Show {
  const ts = nowIso();
  let created!: Show;
  mutate((store) => {
    created = {
      id: store.nextShowId++,
      title: input.title,
      description: input.description,
      venue: input.venue,
      startsAt: input.startsAt,
      capacity: input.capacity,
      ticketPriceCents: input.ticketPriceCents,
      depositCents: input.depositCents,
      onSale: input.onSale ? 1 : 0,
      wechatQrPath: null,
      alipayQrPath: null,
      fpsQrPath: null,
      paymentNote: input.paymentNote,
      createdAt: ts,
      updatedAt: ts,
    };
    store.shows.push(created);
  });
  return { ...created };
}

export function updateShow(
  id: number,
  input: Partial<{
    title: string;
    description: string;
    venue: string;
    startsAt: string;
    capacity: number;
    ticketPriceCents: number;
    depositCents: number;
    onSale: boolean;
    paymentNote: string;
    wechatQrPath: string | null;
    alipayQrPath: string | null;
    fpsQrPath: string | null;
  }>
): Show | null {
  let updated: Show | null = null;
  mutate((store) => {
    const current = store.shows.find((s) => s.id === id);
    if (!current) return;
    current.title = input.title ?? current.title;
    current.description = input.description ?? current.description;
    current.venue = input.venue ?? current.venue;
    current.startsAt = input.startsAt ?? current.startsAt;
    current.capacity = input.capacity ?? current.capacity;
    current.ticketPriceCents = input.ticketPriceCents ?? current.ticketPriceCents;
    current.depositCents = input.depositCents ?? current.depositCents;
    current.onSale =
      input.onSale === undefined ? current.onSale : input.onSale ? 1 : 0;
    current.paymentNote = input.paymentNote ?? current.paymentNote;
    if (input.wechatQrPath !== undefined) current.wechatQrPath = input.wechatQrPath;
    if (input.alipayQrPath !== undefined) current.alipayQrPath = input.alipayQrPath;
    if (input.fpsQrPath !== undefined) current.fpsQrPath = input.fpsQrPath;
    current.updatedAt = nowIso();
    updated = { ...current };
  });
  return updated;
}

export function createOrder(input: {
  showId: number;
  buyerName: string;
  phone: string;
  contactExtra: string;
  quantity: number;
}): Order {
  expireStaleOrders();
  const show = getShow(input.showId);
  if (!show) throw new Error("SHOW_NOT_FOUND");
  if (!show.onSale) throw new Error("SHOW_OFF_SALE");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5) {
    throw new Error("BAD_QUANTITY");
  }
  const normalizedName = input.buyerName.trim().toLocaleLowerCase();
  const phone = input.phone.replace(/\D/g, "");
  const contactExtra = input.contactExtra.trim().toLocaleLowerCase();
  const activeTicketsForBuyer = loadStore().orders
    .filter((order) => {
      if (!ACTIVE_HOLD_STATUSES.includes(order.status)) return false;
      if (order.buyerName.trim().toLocaleLowerCase() !== normalizedName) return false;
      const phoneMatch = order.phone.replace(/\D/g, "") === phone;
      const contactMatch =
        contactExtra !== "" &&
        order.contactExtra.trim().toLocaleLowerCase() === contactExtra;
      return phoneMatch || contactMatch;
    })
    .reduce((total, order) => total + order.quantity, 0);
  if (activeTicketsForBuyer + input.quantity > 5) {
    throw new Error("PERSON_TICKET_LIMIT");
  }
  const remaining = getRemainingSeats(show);
  if (input.quantity > remaining) throw new Error("SOLD_OUT");

  const ts = nowIso();
  const expires = new Date(Date.now() + paymentTimeoutMinutes() * 60 * 1000).toISOString();
  let created!: Order;

  mutate((store) => {
    let code = generateOrderCode();
    for (let i = 0; i < 8; i += 1) {
      if (!store.orders.some((o) => o.code === code)) break;
      code = generateOrderCode();
    }
    created = {
      id: store.nextOrderId++,
      code,
      showId: input.showId,
      buyerName: input.buyerName.trim(),
      phone: input.phone.trim(),
      contactExtra: input.contactExtra.trim(),
      quantity: input.quantity,
      ticketTotalCents: show.ticketPriceCents * input.quantity,
      depositTotalCents: show.depositCents * input.quantity,
      status: "pending_payment",
      paymentProofPath: null,
      adminNote: "",
      confirmedAt: null,
      createdAt: ts,
      updatedAt: ts,
      expiresAt: expires,
    };
    store.orders.push(created);
  });

  return { ...created };
}

export function getOrderById(id: number): Order | null {
  const order = loadStore().orders.find((o) => o.id === id);
  return order ? { ...order } : null;
}

export function getOrderByCode(code: string): Order | null {
  expireStaleOrders();
  const needle = code.trim().toUpperCase();
  const order = loadStore().orders.find((o) => o.code.toUpperCase() === needle);
  return order ? { ...order } : null;
}

export function getOrderWithShow(code: string): OrderWithShow | null {
  const order = getOrderByCode(code);
  if (!order) return null;
  const show = getShow(order.showId);
  if (!show) return null;
  return {
    ...order,
    showTitle: show.title,
    showVenue: show.venue,
    showStartsAt: show.startsAt,
  };
}

export function markOrderPaid(code: string, proofPath: string | null): Order {
  const order = getOrderByCode(code);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "expired" || order.status === "cancelled") {
    throw new Error("ORDER_CLOSED");
  }
  if (order.status !== "pending_payment" && order.status !== "pending_confirm") {
    throw new Error("ORDER_ALREADY_PAID");
  }

  let updated!: Order;
  mutate((store) => {
    const current = store.orders.find((o) => o.id === order.id)!;
    current.status = "pending_confirm";
    if (proofPath) current.paymentProofPath = proofPath;
    current.updatedAt = nowIso();
    updated = { ...current };
  });
  return updated;
}

export function confirmOrder(code: string): { order: Order; tickets: Ticket[]; tokens: string[] } {
  const order = getOrderByCode(code);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "pending_confirm") throw new Error("BAD_STATUS");

  const ts = nowIso();
  const tickets: Ticket[] = [];
  const tokens: string[] = [];
  let updatedOrder!: Order;

  mutate((store) => {
    const current = store.orders.find((o) => o.id === order.id)!;
    current.status = "issued";
    current.confirmedAt = ts;
    current.updatedAt = ts;

    for (let i = 0; i < current.quantity; i += 1) {
      let tCode = generateTicketCode();
      for (let j = 0; j < 8; j += 1) {
        if (!store.tickets.some((t) => t.code === tCode)) break;
        tCode = generateTicketCode();
      }
      const ticket: Ticket = {
        id: store.nextTicketId++,
        orderId: current.id,
        code: tCode,
        checkedInAt: null,
        depositRefundedAt: null,
        refundedBy: null,
        createdAt: ts,
      };
      store.tickets.push(ticket);
      tickets.push({ ...ticket });
      tokens.push(signTicketCode(ticket.code));
    }
    updatedOrder = { ...current };
  });

  return { order: updatedOrder, tickets, tokens };
}

export function rejectOrder(code: string, reason: string): Order {
  const order = getOrderByCode(code);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "pending_confirm" && order.status !== "pending_payment") {
    throw new Error("BAD_STATUS");
  }
  let updated!: Order;
  mutate((store) => {
    const current = store.orders.find((o) => o.id === order.id)!;
    current.status = "cancelled";
    current.adminNote = reason;
    current.updatedAt = nowIso();
    updated = { ...current };
  });
  return updated;
}

export function releaseOrder(code: string): Order {
  const order = getOrderByCode(code);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "pending_confirm" && order.status !== "pending_payment") {
    throw new Error("BAD_STATUS");
  }
  let updated!: Order;
  mutate((store) => {
    const current = store.orders.find((o) => o.id === order.id)!;
    current.status = "expired";
    if (!current.adminNote) current.adminNote = "管理员释放库存";
    current.updatedAt = nowIso();
    updated = { ...current };
  });
  return updated;
}

export function listOrders(filter?: { status?: OrderStatus; showId?: number }): OrderWithShow[] {
  expireStaleOrders();
  const store = loadStore();
  return store.orders
    .filter((o) => (filter?.status ? o.status === filter.status : true))
    .filter((o) => (filter?.showId ? o.showId === filter.showId : true))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => {
      const show = store.shows.find((s) => s.id === order.showId);
      return {
        ...order,
        showTitle: show?.title || "",
        showVenue: show?.venue || "",
        showStartsAt: show?.startsAt || "",
      };
    });
}

export function lookupOrdersByContact(buyerName: string, contact: string): OrderWithShow[] {
  expireStaleOrders();
  const normalizedName = buyerName.trim().toLocaleLowerCase();
  const normalizedContact = contact.trim().toLocaleLowerCase();
  const normalizedPhone = normalizedContact.replace(/\D/g, "");
  const store = loadStore();

  return store.orders
    .filter((order) => {
      if (order.buyerName.trim().toLocaleLowerCase() !== normalizedName) return false;
      const phoneMatch =
        normalizedPhone.length >= 7 &&
        order.phone.replace(/\D/g, "") === normalizedPhone;
      const contactMatch =
        order.contactExtra.trim().toLocaleLowerCase() === normalizedContact;
      return phoneMatch || contactMatch;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((order) => {
      const show = store.shows.find((item) => item.id === order.showId);
      return show
        ? [{ ...order, showTitle: show.title, showVenue: show.venue, showStartsAt: show.startsAt }]
        : [];
    });
}

export function getTicketsForOrder(orderId: number): Ticket[] {
  return loadStore()
    .tickets.filter((t) => t.orderId === orderId)
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((t) => ({ ...t }));
}

export function getTicketById(id: number): Ticket | null {
  const ticket = loadStore().tickets.find((t) => t.id === id);
  return ticket ? { ...ticket } : null;
}

export function getTicketByCode(code: string): Ticket | null {
  const ticket = loadStore().tickets.find((t) => t.code === code);
  return ticket ? { ...ticket } : null;
}

export function checkInAndRefundDeposit(
  ticketCode: string,
  refundedBy: string
): {
  ticket: Ticket;
  order: Order;
  show: Show;
} {
  const ticket = getTicketByCode(ticketCode);
  if (!ticket) throw new Error("TICKET_NOT_FOUND");
  const order = getOrderById(ticket.orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (
    order.status !== "issued" &&
    order.status !== "checked_in" &&
    order.status !== "deposit_refunded"
  ) {
    throw new Error("ORDER_NOT_ISSUED");
  }
  const show = getShow(order.showId);
  if (!show) throw new Error("SHOW_NOT_FOUND");

  const ts = nowIso();
  let updatedTicket!: Ticket;
  let updatedOrder!: Order;

  mutate((store) => {
    const currentTicket = store.tickets.find((t) => t.id === ticket.id)!;
    if (!currentTicket.checkedInAt) currentTicket.checkedInAt = ts;
    if (!currentTicket.depositRefundedAt) currentTicket.depositRefundedAt = ts;
    if (!currentTicket.refundedBy) currentTicket.refundedBy = refundedBy;

    const siblings = store.tickets.filter((t) => t.orderId === order.id);
    const everyChecked = siblings.every((t) => Boolean(t.checkedInAt));
    const everyRefunded = siblings.every((t) => Boolean(t.depositRefundedAt));

    const currentOrder = store.orders.find((o) => o.id === order.id)!;
    let nextStatus: OrderStatus = currentOrder.status;
    if (everyRefunded) nextStatus = "deposit_refunded";
    else if (everyChecked) nextStatus = "checked_in";
    if (nextStatus !== currentOrder.status) {
      currentOrder.status = nextStatus;
      currentOrder.updatedAt = ts;
    }

    updatedTicket = { ...currentTicket };
    updatedOrder = { ...currentOrder };
  });

  return { ticket: updatedTicket, order: updatedOrder, show };
}

export function getCheckInPreview(ticketCode: string) {
  const ticket = getTicketByCode(ticketCode);
  if (!ticket) throw new Error("TICKET_NOT_FOUND");
  const order = getOrderById(ticket.orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const show = getShow(order.showId);
  if (!show) throw new Error("SHOW_NOT_FOUND");
  return {
    ticket,
    order,
    show,
    depositPerTicketCents: show.depositCents,
  };
}

const BUTTERFLY_DESCRIPTION =
  "香港中文大学音乐剧社年度大戏《蝶》沉浸版展演（公益演出）。不收票价，仅收按金 ¥50；到场核销后全额退还，未到场不退。转账请务必备注订单号。";

const BUTTERFLY_PAYMENT_NOTE =
  "公益演出仅收按金 ¥50/人，到场全额退还。可用微信 / 支付宝转账，备注填写订单号（如 MT-A7K2）。";

const BUTTERFLY_VENUE = "香港中文大学（深圳）时光胶囊黑匣子";

const BUTTERFLY_SHOWS = [
  {
    title: "香港中文大学音乐剧社年度大戏《蝶》沉浸版展演",
    startsAt: new Date("2026-11-21T19:30:00+08:00").toISOString(),
    sessionLabel: "11.21 19:30",
  },
  {
    title: "香港中文大学音乐剧社年度大戏《蝶》沉浸版展演",
    startsAt: new Date("2026-11-22T14:30:00+08:00").toISOString(),
    sessionLabel: "11.22 14:30",
  },
] as const;

export function deleteShow(id: number) {
  mutate((store) => {
    const orderIds = store.orders.filter((o) => o.showId === id).map((o) => o.id);
    store.tickets = store.tickets.filter((t) => !orderIds.includes(t.orderId));
    store.orders = store.orders.filter((o) => o.showId !== id);
    store.shows = store.shows.filter((s) => s.id !== id);
  });
}

/** 仅补齐缺失的《蝶》场次；已存在则不写盘，避免覆盖订单状态。 */
export function seedDemoShowIfEmpty() {
  const shows = listShows(true);

  for (const show of shows) {
    const placeholder =
      show.title.includes("请后台改为") ||
      show.title.includes("示例演出") ||
      show.venue.includes("地点待定");
    if (placeholder) {
      deleteShow(show.id);
    }
  }

  const remaining = listShows(true);
  for (const spec of BUTTERFLY_SHOWS) {
    const existing = remaining.find((s) => s.startsAt === spec.startsAt);
    if (existing) continue;
    createShow({
      title: spec.title,
      description: `${BUTTERFLY_DESCRIPTION} 本场：${spec.sessionLabel}。`,
      venue: BUTTERFLY_VENUE,
      startsAt: spec.startsAt,
      capacity: 50,
      ticketPriceCents: 0,
      depositCents: 5000,
      onSale: true,
      paymentNote: BUTTERFLY_PAYMENT_NOTE,
    });
  }
}

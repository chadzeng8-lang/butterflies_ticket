export const FPS_MOBILE = "63428274";

/** 按金固定对照：每人 ¥50 或 HK$60 */
export const DEPOSIT_RMB_PER_TICKET = 50;
export const DEPOSIT_HKD_PER_TICKET = 60;

export type PaymentMethod = {
  id: string;
  name: string;
  image: string;
  note: string;
};

const PRIMARY_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "wechat",
    name: "微信支付",
    image: "/Wechat.jpg",
    note: "打开微信扫一扫",
  },
  {
    id: "alipay",
    name: "支付宝",
    image: "/Alipay.jpg",
    note: "打开支付宝扫一扫",
  },
  {
    id: "alipayhk",
    name: "AlipayHK",
    image: "/AlipayHK.jpg",
    note: "打开 AlipayHK 扫一扫",
  },
  {
    id: "fps",
    name: "转数快 FPS",
    image: "/FPS.jpg",
    note: `可扫码，或输入手机号 ${FPS_MOBILE}`,
  },
];

/** 仅本地开发显示的备用收款码（图片已 gitignore，生产构建也不会带上）。 */
const LOCAL_BACKUP_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "wechat-backup",
    name: "微信支付（备用）",
    image: "/Wechat2.jpg",
    note: "主码限额时使用",
  },
  {
    id: "alipay-backup",
    name: "支付宝（备用）",
    image: "/Alipay2.jpg",
    note: "主码限额时使用",
  },
];

export const PAYMENT_METHODS: PaymentMethod[] =
  process.env.NODE_ENV === "development"
    ? [...PRIMARY_PAYMENT_METHODS, ...LOCAL_BACKUP_PAYMENT_METHODS]
    : PRIMARY_PAYMENT_METHODS;

export function depositAmounts(quantity: number) {
  const qty = Math.max(1, quantity);
  return {
    rmb: DEPOSIT_RMB_PER_TICKET * qty,
    hkd: DEPOSIT_HKD_PER_TICKET * qty,
  };
}

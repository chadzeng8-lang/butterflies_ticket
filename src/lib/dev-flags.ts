import fs from "fs";
import path from "path";

const FLAGS_PATH = path.join(process.cwd(), "data", "dev-flags.json");

export type DevFlags = {
  /** true = 本地注册免邮箱验证；false = 完整验证信流程 */
  signupSkipEmailConfirm: boolean;
};

const DEFAULT_FLAGS: DevFlags = {
  signupSkipEmailConfirm: false,
};

function readRaw(): Partial<DevFlags> {
  try {
    if (!fs.existsSync(FLAGS_PATH)) return {};
    const raw = fs.readFileSync(FLAGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DevFlags>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeFlags(flags: DevFlags): void {
  fs.mkdirSync(path.dirname(FLAGS_PATH), { recursive: true });
  fs.writeFileSync(FLAGS_PATH, `${JSON.stringify(flags, null, 2)}\n`, "utf8");
}

/** 是否跳过注册邮箱验证。优先读 data/dev-flags.json；文件不存在时回退旧 env 开关。 */
export function getSignupSkipEmailConfirm(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const raw = readRaw();
  if (typeof raw.signupSkipEmailConfirm === "boolean") {
    return raw.signupSkipEmailConfirm;
  }
  return process.env.SIGNUP_SKIP_EMAIL_CONFIRM === "true";
}

export function setSignupSkipEmailConfirm(enabled: boolean): DevFlags {
  const next: DevFlags = {
    ...DEFAULT_FLAGS,
    ...readRaw(),
    signupSkipEmailConfirm: enabled,
  };
  writeFlags(next);
  return next;
}

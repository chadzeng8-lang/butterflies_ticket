# 中大音乐剧社票务（自建 + 人工确认收款）

观众选场下单（每人最多 5 张）→ 按订单号转账 → 干事后台确认出票 → 现场扫码核销并登记退还按金。  
**不接入支付商户号**，香港与内地均可使用（微信 / 支付宝 / FPS 收款码）。

## 本地启动

数据存在 `data/store.json`（纯 JSON，**不需要** Visual Studio / `better-sqlite3` 原生编译）。

若上次 `npm install` 失败过，先清掉半截依赖再装：

```powershell
cd "D:\Chad Zeng\Vibe Coding\卖票"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

默认管理密码见 `.env.local` 中的 `ADMIN_PASSWORD`（示例为 `admin123`）。  
首次访问首页会自动写入《蝶》两场正式场次。

## 干事操作说明书

### 开售前

1. 登录 `/admin`（密码见环境变量）。
2. 在「场次」创建/编辑演出：容量、票价、按金、付款说明。
3. 上传微信 / 支付宝 / FPS 收款码图片。
4. 勾选「开售」。

### 对账出票

1. 观众转账时**备注必须等于订单号**（如 `MT-A7K2`）。
2. 打开「订单 → 待确认」，核对应付金额 = 票价×张数 + 按金×张数。
3. 可点开付款截图辅助核对。
4. 到账无误 → **确认收款并出票**；未到账 → **驳回**（会释放库存）。
5. 长时间无人付款或对不上账 → **释放库存**。

### 超时规则

- 下单后默认 **45 分钟**内未点「我已付款」→ 订单自动过期，库存释放（`PAYMENT_TIMEOUT_MINUTES` 可改）。
- 已点「我已付款」的订单会继续占库存，直到干事确认、驳回或手动释放。

### 现场退按金

1. 准备现金或可即时转账的 FPS/微信。
2. 打开「现场核销」，扫电子票二维码（或粘贴票号）。
3. 核对姓名与应退金额后，现场把按金交给观众，再点 **已核销并退按金**。
4. 系统只记账，不自动原路退款。
5. 需要点钞时可在「导出」下载「按金应退清单」CSV。

### 观众找回电子票

打开「我的票夹」，填写购票姓名，以及下单时使用的完整手机号或邮箱，即可找回订单号并查看电子票状态。

## 部署建议

本项目使用本地 JSON（`data/store.json`）与上传目录（`data/uploads`），需要**带持久磁盘**的主机，例如：

- Railway / Render / 一台香港或内地 VPS（推荐学生社团）
- 不建议直接丢上无持久盘的 Serverless（如默认 Vercel），否则重启会丢库

部署步骤概要：

1. 把代码推到 Git 仓库。
2. 在主机安装 Node.js 20+，设置环境变量（至少 `ADMIN_PASSWORD`、`TICKET_SECRET`）。
3. `npm install && npm run build && npm start`。
4. 用 Nginx / Caddy 反代到 `3000`，并配置 HTTPS。
5. 定期备份整个 `data/` 目录。

## 技术栈

- Next.js App Router（全栈）
- JSON 文件存储（免原生编译，Windows 可直接装）
- HMAC 签名电子票二维码
- 管理端 Cookie 会话（密码登录）

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

本地 JSON 旧后台的管理密码见 `.env.local` 中的 `ADMIN_PASSWORD`。线上售票使用 Supabase 场次和账号管理员，不使用这套旧密码后台。
本地 JSON 开发环境首次访问首页会自动写入《蝶》两场正式场次；线上场次需在 Supabase 中维护。

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

## Supabase 配置与迁移

基础结构迁移
[`20261104165000_ticketing_schema.sql`](./supabase/migrations/20261104165000_ticketing_schema.sql)
已在当前 Supabase 项目执行。账号登录、Supabase 下单和订单管理还需要执行后续迁移：
[`20261104165001_account_order_workflow.sql`](./supabase/migrations/20261104165001_account_order_workflow.sql)。

在 Supabase Dashboard 的 SQL Editor 运行后续迁移一次。它会导入当前两场演出的公开信息，
并添加观众提交付款、管理员出票/关闭订单所需的数据库函数。演出 ID 与本地场次 ID 保持一致。
如第二份迁移是在 2026-11-04 17:00 前执行，还需运行
[`20261104174300_ticket_email_tracking.sql`](./supabase/migrations/20261104174300_ticket_email_tracking.sql)
以加入出票邮件发送状态记录。
人格结果、线上核销及免登录找票功能分别需要执行
[`20261105094500_personality_results.sql`](./supabase/migrations/20261105094500_personality_results.sql)、
[`20261105094600_online_checkin.sql`](./supabase/migrations/20261105094600_online_checkin.sql)、
[`20261105094700_public_ticket_lookup.sql`](./supabase/migrations/20261105094700_public_ticket_lookup.sql)。
公开场次 RLS 权限修正需执行
[`20261105094800_public_show_access.sql`](./supabase/migrations/20261105094800_public_show_access.sql)；
否则未登录访客查询开售场次会因权限不足而触发服务端错误。

在 Supabase **Authentication → URL Configuration** 设置本地及部署后的 Site URL / Redirect URLs。
应用需要以下环境变量（只填入本地 `.env.local` 或部署平台的环境变量，不要提交到 Git）：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`（本地 `http://localhost:3000`；部署后使用网站 HTTPS 域名）
- `TICKET_SECRET`（用于电子票二维码签名）
- `RESEND_API_KEY`（Resend API 密钥）
- `EMAIL_FROM`（已在 Resend 验证的发件地址，例如 `CU Musical <tickets@example.com>`）

在 Supabase **Authentication → URL Configuration** 将本地及部署域名加入 Redirect URLs，例如
`http://localhost:3000/auth/callback` 和 `https://你的域名/auth/callback`。

注册首个管理员账号后，在 SQL Editor 将该账号提升为管理员，把邮箱替换为实际注册邮箱：

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
);
```

管理员使用该邮箱账号登录后，可在 `/admin/online-orders` 查看并确认 Supabase 订单。`/admin` 与旧密码登录入口 `/admin/login` 均会转到 Supabase 在线后台。

## 当前迁移状态与部署限制

- 新账号使用 Supabase Auth；新订单写入 Supabase，付款截图存于私有 bucket，订单和电子票仅对买家/管理员开放。
- 网站已整合《蝶》角色人格测试；登录账号可在 `/personality` 完成 24 题测试，并在账号页查看最新结果。启用该功能需执行
  [`20261105094500_personality_results.sql`](./supabase/migrations/20261105094500_personality_results.sql)。
- 管理员确认出票后，系统通过 Resend 发送邮件；发送失败时可在「Supabase 在线订单」重试。
- 既有 `data/store.json` 订单作为历史存档保留，不会自动复制或关联到用户账号。
- 线上首页、场次详情、订单和票夹读取 Supabase；Netlify 运行时不依赖本地 `data/store.json`。旧管理页面及本地 JSON 订单仅用于本机历史存档。
- 线上核销请在 Supabase SQL Editor 执行对应迁移后使用 `/admin/online-checkin`。场次管理与 CSV 导出仍通过 Supabase 在线订单后台之外的本地旧后台处理。
- Netlify 的 **Environment variables** 中需为 Production 配置本节列出的 Supabase URL、公钥、`NEXT_PUBLIC_SITE_URL`、`TICKET_SECRET`、`RESEND_API_KEY` 和 `EMAIL_FROM`。设置后重新部署。
- 当前 Netlify 项目是通过 Netlify Drop 部署的；后续代码变更必须重新部署包含最新构建的版本。建议在 Netlify 连接 Git 仓库，让每次推送自动构建 Next.js 项目，而不是上传静态导出目录。
- 正式售票前，用测试账号验证首页场次、注册登录、下单、付款申报、管理员出票、电子票和核销完整流程。

## 技术栈

- Next.js App Router（全栈）
- JSON 文件存储（免原生编译，Windows 可直接装）
- HMAC 签名电子票二维码
- 管理端 Cookie 会话（密码登录）

# 音乐剧《蝶》学生版 · 票务网站

香港中文大学音乐剧社《蝶》沉浸版展演官网与票务：演出介绍、场次登记、账号票夹、人格测试、干事审核与现场核销。

- 线上站点：<https://cumusical.xyz>
- 仓库：`chadzeng8-lang/butterflies_ticket`
- 技术栈：Next.js 15 App Router、React 19、TypeScript、Supabase（Auth / Postgres / Storage）、Resend、Netlify
- Agent 协作指南：[`AGENTS.md`](./AGENTS.md)
- 干事操作说明：[`OPS.md`](./OPS.md)

**不接入支付商户号**。观众转账微信 / 支付宝 / FPS，干事人工核对后出票。香港与内地浏览器一般均可访问；付款与加群走微信生态。

## 演出与开票（摘要）

- 时间：2026-11-21、2026-11-22；地点：香港中文大学（深圳）时光胶囊黑匣子；普通话，约 150 分钟。
- 11.21 面向公众人士；11.22 仅开放给香港中文大学及香港中文大学（深圳）的同学及教职工。
- 公益免费入场；按金 ¥50 或 HK$60 / 张，到场全额退还。
- 公开开票：2026-11-09 20:00（香港时间），见 `src/lib/ticket-sale.ts`。管理员登录后可提前登记。
- 转账备注填**购票编号及手机号**。出票后观众凭证为**购票编号**（每场从 1 起）+ 手机号，不展示入场二维码。

## 本地启动

```powershell
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

生产构建：

```powershell
npm run build
```

环境变量放在被 Git 忽略的 `.env.local`（只配置名称对应的值，不要提交文件）：

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 匿名/publishable key |
| `NEXT_PUBLIC_SITE_URL` | 本机 `http://localhost:3000`；生产为 `https://cumusical.xyz` |
| `NEXT_PUBLIC_AMAP_KEY` | 高德地图（购票页场地）；控制台配置域名白名单 |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | 高德安全密钥（若控制台已启用） |
| `TICKET_SECRET` | 票券相关签名 |
| `RESEND_API_KEY` | Resend 发信 |
| `EMAIL_FROM` | 已验证域名下的发件地址（`@cumusical.xyz`） |

本地若仍保留旧 JSON 后台，可能还有 `ADMIN_PASSWORD` / `PAYMENT_TIMEOUT_MINUTES` 等历史变量；**正式售票与线上部署以 Supabase + 上表为准**。

## 架构边界

| 能力 | 线上（生产） | 本地历史 |
|------|--------------|----------|
| 账号 / 登录 | Supabase Auth | — |
| 场次 / 订单 / 票 | Supabase | `data/store.json` 仅作旧开发存档 |
| 付款截图 | 私有 bucket `payment-proofs` | 本地 uploads（旧流程） |
| 干事后台 | `/admin/online-orders`、`/admin/online-accounts`、`/admin/online-checkin` | 旧 `/admin/*` JSON 页勿用于正式单 |
| 部署 | Netlify 连接 Git，`main` 推送自动构建 | 不要用 Drop 上传静态包作为正式发布方式 |

管理员：在 Supabase 将对应用户的 `profiles.role` 设为 `'admin'`。

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
);
```

## 主要页面

| 路径 | 说明 |
|------|------|
| `/` | 首页：故事、关于、剧照、演职 |
| `/shows` | 报名步骤、地图、场次、观演须知 |
| `/shows/[id]` | 单场登记 |
| `/orders/[code]` | 订单、付款、购票编号、观演群二维码 |
| `/tickets` | 票夹 / 找票 |
| `/account` | 注册登录 |
| `/personality` | 24 题人格测试 |
| `/campus-entry` | 入校指南（当前仅管理员入口开放） |
| `/admin/online-orders` | 订单审核、库存、批量、导出、邮件重发 |
| `/admin/online-accounts` | 账号与订单改绑 / 删除 |
| `/admin/online-checkin` | 现场核销登记 |

## Supabase 迁移

迁移目录：[`supabase/migrations/`](./supabase/migrations/)。按文件名时间顺序在 SQL Editor 执行；**仓库有文件 ≠ 生产已执行**，执行前先确认。

常见批次（由早到晚）：

1. `20261104165000_ticketing_schema.sql` — 基础表结构  
2. `20261104165001_account_order_workflow.sql` — 账号订单流程与初始场次  
3. `20261104174300_ticket_email_tracking.sql` — 出票邮件状态  
4. `20261105094500_personality_results.sql` — 人格结果  
5. `20261105094600_online_checkin.sql` — 线上核销  
6. `20261105094700_public_ticket_lookup.sql` — 公开找票  
7. `20261105094800_public_show_access.sql` — 公开场次 RLS  
8. `20261105170000_show_internal_reserved.sql` / `20261105173000_admin_inventory_and_order_edit.sql` — 库存与订单编辑  
9. `20261106093000_admin_order_account.sql` / `20261106101500_admin_list_accounts.sql` — 订单改绑与账号列表  
10. `20261106103000_admin_bulk_orders.sql` — 批量改状态 / 删除  
11. `20261106110000_admin_delete_account.sql` — 删除账号  
12. `20261106120000_order_purchase_numbers.sql` — 购票编号  
13. `20261106160000_order_attendees.sql` — 观众姓名 / 电话 / 证件号（入校登记）

Auth → URL Configuration 需包含：

- `http://localhost:3000` 与 `http://localhost:3000/auth/callback`
- `https://cumusical.xyz` 与 `https://cumusical.xyz/auth/callback`

## 邮件

三封事务信（下单引导付款、已提交付款、出票）在 `src/lib/ticket-email.ts`。From 必须属于 Resend 已验证的 `cumusical.xyz`。出票失败可在订单后台重发。不要在文档或聊天中写出真实 `EMAIL_FROM` / API Key。

## 部署（Netlify）

1. Production 环境变量配置齐上表各项（含高德，若启用地图）。  
2. 连接 GitHub 仓库；推送 `main` 触发构建。  
3. 等该 commit 在 Netlify 显示 **Published** 后，再打开 <https://cumusical.xyz> 核对。  
4. 只改环境变量时：Deploys → **Trigger deploy → Deploy site**（通常无需清缓存）。若 Trigger 被 reCAPTCHA 挡住，改为手动点击。  
5. 正式开售前用测试账号走通：注册 → 选场 → 付款申报 → 管理员出票 → 购票编号展示 → 邮件 → 核销。

## 开发提示

- 开票开关：`src/lib/ticket-sale.ts`
- 场次对象文案：`src/lib/show-audience.ts`
- 观演群图：`public/images/wechat-audience-group.jpg`（过期后替换同路径）
- 视觉：少用大圆角；剧照区固定高度、等比 contain，允许左右留黑边
- 简繁：`LocaleProvider` + `opencc-js`
- 不要提交密钥、真实用户资料、付款截图或根目录临时微信导出原图

# 项目 Agent 指南

## 项目是什么

这是香港中文大学音乐剧社学生版《蝶》官方主页，包含关于《蝶》／剧情（世界观）／人物小传／演出卡司／歌词／排演日程／演出资讯、人格测试，以及往期票务的账号／票夹与干事订单审核、现场核销。

- 代码仓库：`chadzeng8-lang/butterflies_ticket`
- 技术栈：Next.js 15 App Router、React 19、TypeScript、Supabase Auth/Postgres/Storage、Resend
- 线上站点：<https://cumusical.xyz>
- 发布平台：Netlify 项目 `butterflies-ticket`（团队 CU Musical / `cuhkmusical@gmail.com`），`main` 分支推送会触发生产构建与部署。域名 DNS 在阿里云：apex `A` → `75.2.60.5`，`www` `CNAME` → `butterflies-ticket.netlify.app`。项目 Visitor access 须为 Public。
- 最近代码版本：`6a95e54`；2026-11-06 已迁移到新团队并 Published；生产页确认开票时间为 2026-11-09 20:00 及首页场次说明
- 用户于 2026-11-05 确认：更新生产 `EMAIL_FROM` 后手动重新部署成功；迁移后环境变量已在新项目重新导入（名称见下文，勿在文档记录值）

## 当前状态与接手事项

- 站点已从「购票站」转为学生版《蝶》主页：导航为首页 / 关于《蝶》 / 剧情 / 演出卡司 / 排演日程 / 演出 / 人格测试 / 票夹 / 账号；剧情 hub 覆盖世界观、人物小传、歌词；票夹在账号前。
- 已去掉全站「个人信息处理提示」弹窗（`PrivacyNotice`）；隐私文案见 `/privacy`（2026-11-26 更新）。
- `/shows` 为演出资讯归档：安托山与港中深两场可折叠展示、均已完成；无地图；说明下一站预计 2027 年 3 月在港中大（香港）演出。往期订单仍可走票夹／账号。
- `/about` 原作缘起与简史；`/script` 剧情 hub；`/script/world` 世界观；`/rehearsal` 排演日程 + 舞台剧照（多场活动／演出相册，封面 `cover.jpg`，详情 `thumbs/`+`full/`；源图在 `photo/`，站点资源在 `public/images/stage/`）。
- 入校指南 `/campus-entry` **仅管理员**可访问（非管理员重定向账号页）；导航亦仅管理员可见。
- 内容页：`/characters`（详情含长文小节，见 `character-details.ts`）、`/cast`、`/lyrics`（唱段全文摘自学生版剧本 `剧本 最终版.pdf`，见 `lyrics-data.ts`）；数据在 `src/lib/characters.ts`、`character-details.ts`、`production-cast.ts`、`lyrics-data.ts`、`past-shows.ts`、`about-content.ts`、`worldview-content.ts`、`rehearsal.ts`。
- 左上角品牌文字由 `src/lib/site.ts` 的 `SITE_NAME` 控制，不再读取 Netlify 自动生成的站点名。
- 用户要求延续参考 Strand 的简洁视觉、减少大圆角；全站支持简繁切换。
- 页脚「关注」：Instagram / 小红书 / 微信公众号二维码点击放大；有网页主页的平台在缩略图下与弹窗内显示链接（`FooterQrZoom`）。
- 下单后订单页展示微信观演群二维码（`OrderWechatGroup`，图在 `public/images/wechat-audience-group.jpg`）；群邀请码会过期，失效后替换同路径图片即可。下单邮件也会提示扫码入群。
- 场次开放对象文案集中在 `src/lib/show-audience.ts`（往期港中深场次仍可参考）。
- Resend 组织 team 已完成 `cumusical.xyz` 域名验证，DKIM/SPF 状态曾确认通过。阿里云 DNS 的 Resend 验证 TXT 已添加，`resend._domainkey` TXT 已替换为组织 team 的 DKIM 值；不要恢复个人 team 的旧 DKIM 值或删除验证记录。
- 用户确认已在 Netlify 设置生产环境 `EMAIL_FROM` 为该已验证域名下的发件地址，并手动重新部署成功。不要在文档、聊天、截图或代码中记录/显示其具体地址或其他环境变量值。
- 事务邮件：`src/lib/ticket-email.ts` 含下单引导付款、提交付款后等待出票、审核出票三封；均以“本邮件由系统自动发送，请勿直接回复。”开头。下单/付款邮件失败不阻断流程；出票邮件失败可在管理端重发。
- 出票后对用户展示「购票编号」（每场从 1 起），不展示票码/二维码；入场核对编号与手机号。编号计算见 `get_order_purchase_numbers`（迁移 `20261106120000_order_purchase_numbers.sql`）。
- 转账备注为**购票编号及手机号**（不是旧订单号）；订单联系手机默认取首位观众电话。购票编号在下单后即可按场次顺序计算，付款页会同时展示编号与手机。
- 入校政策观众信息：每位观众姓名 / 电话；11.21 填证件号（内地身份证或香港回乡证），11.22 校内场改填学号（`id_doc_type = student_id`）。报名时填写，不参与付款确认；订单详情可编辑。表 `order_attendees`，迁移 `20261106160000_order_attendees.sql` + `20261119110000_attendee_student_id.sql`，RPC `save_order_attendees`。**生产库还需执行**后者，否则学号无法写入。
- 入校指南（管理员）：`/campus-entry`；旧版微信预约填写：`/admin/campus-booking`。
- 干事操作见 `OPS.md`；本地开发与迁移概览见 `README.md`。
- 管理员下单可超过每人/每单 5 张（仍受余票与单笔上限 100）：前端与 `createOrderAction` 已上线；**生产库还需执行**迁移 `20261109110000_admin_bypass_ticket_limit.sql`，否则 RPC 仍会拦管理员。
- 注册免邮箱验证（管理员一键）：管理员在 `/account`（本地与生产均可）切换；状态存 Supabase `app_settings.signup_skip_email_confirm`（迁移 `20261110010000_app_settings_signup_skip.sql`）。开启后用 `SUPABASE_SERVICE_ROLE_KEY` 走 `auth.admin.createUser`（`email_confirm: true`）；关掉即恢复完整邮箱验证路径。生产要真正免验证须临时在 Netlify 配置 service_role，用完建议删除；勿改生产 Auth「Confirm email」。

演出主要信息（修改之前先与用户确认是否有更新）：

- 安托山精简版：2026-10-17，深圳安托山公共文化中心向日葵厅（已完成）。
- 港中深沉浸版：2026-11-21 至 2026-11-22，香港中文大学（深圳）时光胶囊黑匣子，普通话，约 150 分钟（已完成）。
- 11.21 面向公众人士；11.22 仅开放给香港中文大学及香港中文大学（深圳）的同学及教职工。
- 下一站：预计 2027 年 3 月在香港中文大学（香港）演出，具体场次待公布。
- 往期票务：公益免费入场，按金到场退还；开票／停售由 `src/lib/ticket-sale.ts` 控制（已停售，不可新登记）。
- 人格测试共 24 题。

## 本地开始

```powershell
npm install
npm run dev
```

开发站点默认是 <http://localhost:3000>。生产构建与类型检查：

```powershell
npm run build
```

改动提交前可检查差异：

```powershell
git diff --check
git status --short
```

不要删除或覆盖他人尚未提交的工作。不要提交 `.env.local`、密钥、真实用户资料或付款截图。不要把仓库根目录临时导出的微信图片源文件一并提交（正式资源放在 `public/images/`）。

## 从哪里改

### UI 与内容

- 首页与演出介绍：`src/app/page.tsx`
- 关于《蝶》 / 剧情 hub / 世界观 / 排演日程：`src/app/about/`、`src/app/script/`、`src/app/script/world/`、`src/app/rehearsal/`
- 演出资讯（往期折叠 + 下一站）：`src/app/shows/page.tsx`、`src/lib/past-shows.ts`
- 人物小传 / 演出卡司 / 歌词：`src/app/characters/`、`src/app/cast/`、`src/app/lyrics/`
- 场次开放对象文案：`src/lib/show-audience.ts`
- 隐私声明：`src/app/privacy/page.tsx`
- 开票 / 停售时间：`src/lib/ticket-sale.ts`
- 全站样式、响应式布局、字体：`src/app/globals.css`
- 根布局与简繁转换 Provider：`src/app/layout.tsx`、`src/components/LocaleProvider.tsx`
- 网站导航：`src/components/SiteHeader.tsx`、`src/components/SiteHeaderClient.tsx`
- 页脚与社交媒体二维码：`src/components/SiteFooter.tsx`、`src/components/FooterQrZoom.tsx`
- 首页剧照轮播：`src/components/StageGallery.tsx`（`public/images/stage-01.jpg`–`stage-04.jpg`，固定高度黑底、`object-fit: contain`）
- 首页图片与 Logo、观演群二维码：`public/images/`
- 字体文件：`public/fonts/`

简繁切换使用 `opencc-js`，LocaleProvider 会转换页面文字和部分可访问性/表单属性；新增特殊文本时检查切换后的显示。用户此前特别要求减少圆角，延续当前视觉时优先使用直角或小圆角，不要随意恢复大圆角风格。

### 用户功能

- 注册、登录与账号摘要：`src/app/account/page.tsx`、`src/components/AccountForm.tsx`
- 场次与登记：`src/app/shows/[id]/page.tsx`、`src/components/OrderForm.tsx`、`src/app/actions/orders.ts`
- 订单详情 / 购票编号 / 观演群：`src/app/orders/[code]/page.tsx`、`src/components/OrderWechatGroup.tsx`
- 票夹与找票：`src/app/tickets/page.tsx`、`src/components/TicketLookupForm.tsx`
- 人格测试：`src/app/personality/page.tsx`、`src/components/PersonalityQuiz.tsx`、`src/lib/personality-data.json`
- 在线干事订单审核：`src/app/admin/online-orders/page.tsx`、`src/app/actions/supabase-admin.ts`
- 注册账号、订单改绑与删除账号：`src/app/admin/online-accounts/page.tsx`（需迁移 `20261106101500_admin_list_accounts.sql`、`20261106110000_admin_delete_account.sql`）
- 订单批量改状态/删除：`src/components/OnlineOrdersBulkPanel.tsx`（需迁移 `20261106103000_admin_bulk_orders.sql`）
- 场次库存（总票数 / 剩余）在订单管理页顶部汇总编辑：`src/components/AdminInventorySummary.tsx`
- 线上现场核销：`src/app/admin/online-checkin/page.tsx`、`src/app/actions/supabase-checkin.ts`
- Supabase 服务端客户端与数据访问：`src/lib/supabase/`（公开只读可用 `public.ts` / `browser.ts`）

### 出票邮件

- 邮件主题、HTML 内容和 Resend API 请求：`src/lib/ticket-email.ts`
- 审核通过、邮件失败提示和重发动作：`src/app/actions/supabase-admin.ts`
- 干事端邮件状态与重发按钮：`src/app/admin/online-orders/page.tsx`

审核出票后会尝试自动发送邮件；失败时订单仍可在审核页面手动重发。发件地址必须属于 Resend 已验证域名（`@cumusical.xyz`）；Gmail 地址不能直接作为 From。需要接收回复时应配置 `reply_to`，不要仅依赖“请勿回复”的文字。更新邮件文案或排版时检查 HTML 邮件兼容性、动态内容转义、订单链接和简繁文字；不要把 API Key 写入代码或日志。邮件环境变量为 `RESEND_API_KEY`、`EMAIL_FROM`、`NEXT_PUBLIC_SITE_URL`。

## 重要架构边界

线上流程使用 Supabase；`data/store.json` 和部分旧 `/admin` 页面是保留的本地 JSON 历史/开发流程，并非 Netlify 的持久化存储。

- 线上订单、电子票、账号、人格结果及线上核销依赖 Supabase。
- Supabase 管理员通过 `profiles.role = 'admin'` 授权；不要将本地旧密码后台和 Supabase 管理员流程混为一谈。
- 线上订单入口是 `/admin/online-orders`，账号入口是 `/admin/online-accounts`，线上核销入口是 `/admin/online-checkin`。
- 余票 = `capacity - 有效订单票数`。总票数在订单管理页顶部直接改 `shows.capacity`，不再使用内部预留。订单随时编辑若需 RPC，见 `20261105173000_admin_inventory_and_order_edit.sql`；订单改绑注册账号需 `20261106093000_admin_order_account.sql` 与 `20261106101500_admin_list_accounts.sql`。
- 上传付款凭证使用 Supabase 私有 `payment-proofs` bucket；不要改为依赖 Netlify 本地文件。
- 文档以本指南、`README.md`、`OPS.md` 与当前代码为准；发现冲突时应顺手更新相关说明。

## Supabase 与环境变量

代码中的迁移按文件名顺序位于 `supabase/migrations/`。修改数据库结构或 RLS 时，先检查既有迁移与依赖；新增向前兼容迁移，不要擅自改写已执行的旧迁移。仓库中存在迁移文件不代表它已在生产 Supabase 执行。执行生产 SQL 前先确认用户是否已运行及执行结果，不要盲目重复执行。

应用使用到的环境变量名称：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_AMAP_KEY`（购票页演出地点地图；控制台需配置域名白名单）
- `NEXT_PUBLIC_AMAP_SECURITY_CODE`（高德安全密钥，若控制台已启用则必填）
- `TICKET_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

本地值应放在被 Git 忽略的 `.env.local`；线上值由 Netlify 环境变量管理。只核对变量名称/是否存在，不读取、输出、截图或提交密钥值。Supabase Auth 的 Site URL 和 Redirect URLs 也需包含本地及生产域名。

## 测试与上线

1. 针对改动运行 `npm run build`，并检查 `git diff --check`。
2. 涉及用户流程时，至少验证受影响页面和动作；涉及邮件时验证审核通过、失败提示、重发和发送状态；涉及权限时同时验证管理员与普通用户。
3. 代码上线：在用户要求发布后，将变更提交并推送到 `main`，等待 Netlify 对应 commit 状态为 Published，再访问 <https://cumusical.xyz> 检查实际页面。不要只凭本地构建成功或 Git push 成功就宣称已上线。
4. 仅更新 Netlify 环境变量时不需要代码提交；到项目 Deploys 点 **Trigger deploy → Deploy site** 重新构建，不需要清缓存。环境变量内容仅通过 Netlify 控制台配置，不在聊天中索取或输出。
5. 用户曾遇到 Netlify Trigger deploy 操作被 reCAPTCHA 阻挡；若浏览器自动操作失败，告知用户手动点击并等待 Published，再继续验证。
6. 未明确要求发布时，不要擅自提交或推送；部署失败时检查 Netlify Build/Deploy log，报告具体失败原因。
7. Netlify 额度紧张时避免无意义的重复部署；优先合并改动一次推送。

## 协作约定

- 先读将要修改的实现和相邻组件，沿用项目已有模式，精确修改，不顺手重构无关代码。
- 页面文案、验证、服务端 Action、数据库/RLS 和邮件等相关表面需保持一致。
- 不在代码或对话里暴露密钥、用户个人信息、订单联系资料。
- 说明验证过的内容与尚未验证的生产配置；不要把猜测当作已确认事实。

import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "个人信息收集声明",
  description:
    "香港中文大学音乐剧社学生版《蝶》网站如何处理账号、票务与测试相关个人信息。",
};

export default function PrivacyPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Privacy</p>
        <h1>个人信息收集声明</h1>
        <p>
          本网站是香港中文大学音乐剧社学生版《蝶》的官方主页，同时保留往期展演的订单查询与账号功能。我们只在完成本次社团作品展示与票务事务所需范围内处理个人信息，并遵循合法、公平、目的明确的原则。
        </p>
      </section>

      <div className="grid">
        <article className="panel privacy-copy">
          <h2>我们收集什么</h2>
          <ul>
            <li>账号资料：昵称、电子邮箱，以及用于登录的密码。密码由身份验证服务保存，本网站不保存明文密码。</li>
            <li>
              往期报名资料（如曾购票）：联系邮箱；观众姓名、电话；证件号码或学号；以及付款截图（可能含转账账户信息）。
            </li>
            <li>
              人格测试：你的答题选择。登录后与账号一并保存；提交前，未完成的答案可能暂存在当前浏览器会话中。
            </li>
          </ul>
        </article>

        <article className="panel privacy-copy">
          <h2>用来做什么</h2>
          <p>上述资料只用于以下事项：</p>
          <ul>
            <li>展示学生版《蝶》的故事、卡司、歌词与演出资讯。</li>
            <li>查询与管理往期订单、购票编号、按金退还记录，以及必要的事务通知。</li>
            <li>向你本人展示人格测试结果。</li>
          </ul>
          <p>
            我们不会把这些资料用于商业营销，也不会出售个人信息。除完成本次事务所需的主办方干事，以及下方所列技术服务方外，不会把资料交给其他第三方。
          </p>
        </article>

        <article className="panel privacy-copy">
          <h2>如何处理与保留</h2>
          <p>
            往期付款截图保存在访问受限的存储中，只有主办方负责票务的干事可以查看。按金退还与演出事务完结后，主办方会按内部流程清理不再需要的付款截图与证件类资料。
          </p>
          <p>
            你可以来信要求查阅、更正或删除自己的个人信息。删除账号后，与该账号关联的登录资料会一并移除。
          </p>
        </article>

        <article className="panel privacy-copy">
          <h2>Cookie 与本地存储</h2>
          <p>
            本网站不使用 Google Analytics 或其他统计、广告工具。登录时会使用必要的会话 Cookie，只为保持登录状态，不用于跨站追踪。
          </p>
          <p>
            你选择的简繁显示偏好保存在自己的浏览器中。订单页的微信观演群由你自行扫码加入，群内沟通在微信中进行，不保存在本网站。
          </p>
        </article>

        <article className="panel privacy-copy">
          <h2>技术服务方</h2>
          <p>为运营本网站，相关资料会由以下受托服务方按其职责处理：</p>
          <ul>
            <li>Supabase：账号登录、订单与观众资料、付款截图存储。</li>
            <li>Resend：发送报名、付款和出票通知邮件。</li>
            <li>Netlify：网站托管。</li>
          </ul>
        </article>

        <article className="panel privacy-copy">
          <h2>联系我们</h2>
          <p>
            如需查询本声明、更正资料，或要求删除个人信息，请联系香港中文大学音乐剧社：
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>本声明更新于 2026 年 11 月 26 日。</p>
        </article>
      </div>
    </main>
  );
}

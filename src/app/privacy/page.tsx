import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "个人信息收集声明",
  description:
    "香港中文大学音乐剧社《蝶》学生版展演收集姓名、联系方式、证件号与付款截图的用途、保留及联系方式。",
};

export default function PrivacyPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Privacy</p>
        <h1>个人信息收集声明</h1>
        <p>
          本网站由香港中文大学音乐剧社用于音乐剧《蝶》学生版展演的介绍、报名和按金处理。我们只在完成本次演出所必需的范围内收集个人信息，并遵循合法、公平、目的明确的原则。
        </p>
      </section>

      <div className="grid">
        <article className="panel privacy-copy">
          <h2>我们收集什么</h2>
          <ul>
            <li>账号资料：昵称、电子邮箱，以及用于登录的密码。密码由身份验证服务保存，本网站不保存明文密码。</li>
            <li>报名资料：联系邮箱。</li>
            <li>
              观众资料：每位观众的姓名、电话、证件类型和证件号码。证件为内地居民身份证，或港澳居民来往内地通行证（回乡证）。这些资料按学校入校要求填写，用于入校配合和现场核对，不用于确认付款。
            </li>
            <li>
              按金资料：你上传的付款截图。截图可能包含微信、支付宝、AlipayHK 或转数快转账中的付款账户信息，只用于核对按金和安排退还。转账备注为购票编号及手机号。
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
            <li>本次演出的报名、订单、购票编号、现场核销，以及演出时间、地点或安排变动的必要通知。</li>
            <li>按金的收取核对，以及到场观演后的全额退还。</li>
            <li>按香港中文大学（深圳）入校要求，配合访客登记与现场身份核对。</li>
            <li>向你本人展示人格测试结果。</li>
          </ul>
          <p>
            我们不会把这些资料用于商业营销，也不会出售个人信息。除完成本次演出所必需的主办方干事，以及下方所列的技术服务方外，不会把资料交给其他第三方。
          </p>
        </article>

        <article className="panel privacy-copy">
          <h2>如何处理与保留</h2>
          <p>
            付款截图保存在访问受限的存储中，只有主办方负责票务的干事可以查看。按金退还完成后，主办方会删除相应付款截图，不再保留其中的付款账户信息。
          </p>
          <p>
            观众证件号码只保留到本次演出的入校与现场安排结束。订单是否已退还按金的处理记录可保留至本次演出事务完结，以便核对，其中不含付款账户信息。
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
            你选择的简繁显示偏好保存在自己的浏览器中。购票页的地图由高德地图提供，加载地图时浏览器会连接高德的服务。订单页的微信观演群由你自行扫码加入，群内沟通在微信中进行，不保存在本网站。
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
          <p>本声明更新于 2026 年 11 月 6 日。</p>
        </article>
      </div>
    </main>
  );
}

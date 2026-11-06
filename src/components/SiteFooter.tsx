import Link from "next/link";
import { FooterQrZoom } from "@/components/FooterQrZoom";

const IG_URL =
  "https://www.instagram.com/cumusical?srtk=MWFmYzk4cTV3NndyZw%3D%3D&utm_source=qr";
const XHS_URL =
  "https://www.xiaohongshu.com/user/profile/6664513e0000000007006eca?xhsshare=userQrCode&exSource=";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-note">
          <span>CU Musical · 香港中文大学音乐剧社</span>
          <Link href="/shows">报名购票</Link>
        </div>

        <div className="site-footer-contact">
          <section className="site-footer-block" aria-labelledby="footer-follow">
            <h2 id="footer-follow" className="eyebrow">
              关注
            </h2>
            <div className="site-footer-qrs">
              <figure className="site-footer-qr">
                <FooterQrZoom
                  src="/images/ig.jpg"
                  alt="Instagram @CUMUSICAL 二维码"
                  title="Instagram"
                  linkHref={IG_URL}
                  linkLabel="instagram.com/cumusical"
                />
                <figcaption>
                  <a
                    className="site-footer-qr-link"
                    href={IG_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                </figcaption>
              </figure>
              <figure className="site-footer-qr">
                <FooterQrZoom
                  src="/images/xhs.jpg"
                  alt="小红书二维码"
                  title="小红书"
                  linkHref={XHS_URL}
                  linkLabel="小红书主页"
                />
                <figcaption>
                  <a
                    className="site-footer-qr-link"
                    href={XHS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    小红书
                  </a>
                </figcaption>
              </figure>
              <figure className="site-footer-qr">
                <FooterQrZoom
                  src="/images/wechat-oa.jpg"
                  alt="微信公众号「吐露港音乐剧研究中心」二维码"
                  title="微信公众号"
                  width={480}
                  height={640}
                />
                <figcaption>微信公众号</figcaption>
              </figure>
            </div>
          </section>

          <section className="site-footer-block" aria-labelledby="footer-collab">
            <h2 id="footer-collab" className="eyebrow">
              合作
            </h2>
            <a className="site-footer-email" href="mailto:cuhkmusical@gmail.com">
              cuhkmusical@gmail.com
            </a>
          </section>
        </div>
      </div>
    </footer>
  );
}

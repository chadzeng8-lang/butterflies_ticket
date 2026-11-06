import Image from "next/image";
import Link from "next/link";

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
                <a
                  href="https://www.instagram.com/cumusical?srtk=MWFmYzk4cTV3NndyZw%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src="/images/ig.jpg"
                    alt="Instagram @CUMUSICAL 二维码"
                    width={480}
                    height={480}
                  />
                </a>
                <figcaption>Instagram</figcaption>
              </figure>
              <figure className="site-footer-qr">
                <a
                  href="https://www.xiaohongshu.com/user/profile/6664513e0000000007006eca?xhsshare=userQrCode&exSource="
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src="/images/xhs.jpg"
                    alt="小红书二维码"
                    width={480}
                    height={480}
                  />
                </a>
                <figcaption>小红书</figcaption>
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

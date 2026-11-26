import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { NavigationBusyBinder } from "@/components/NavigationProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "香港中文大学音乐剧社学生版《蝶》官方主页 · 故事、卡司、歌词与演出资讯",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-locale="cn">
      <body>
        <NavigationBusyBinder />
        <LocaleProvider>
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}

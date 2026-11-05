import type { Metadata } from "next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { NavigationBusyBinder } from "@/components/NavigationProgress";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "香港中文大学音乐剧社年度大戏《蝶》沉浸版展演 · 公益登记与按金退还",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-locale="cn">
      <body>
        <NavigationBusyBinder />
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

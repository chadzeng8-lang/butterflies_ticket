import type { Metadata } from "next";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";

const siteName = process.env.SITE_NAME || "《蝶》沉浸版展演";

export const metadata: Metadata = {
  title: siteName,
  description: "香港中文大学音乐剧社年度大戏《蝶》沉浸版展演 · 公益登记与按金退还",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-locale="cn">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

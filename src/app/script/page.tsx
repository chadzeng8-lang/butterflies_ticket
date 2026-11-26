import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "剧情",
  description: "学生版《蝶》世界观、人物小传与歌词入口",
};

const HUB_LINKS = [
  {
    href: "/script/world",
    title: "世界观",
    description: "诅咒、共谋与觉醒——《蝶》的世界如何运转。",
    cta: "阅读 →",
  },
  {
    href: "/characters",
    title: "人物小传",
    description: "主演书写的角色长文：身份、冲突与选择。",
    cta: "进入 →",
  },
  {
    href: "/lyrics",
    title: "歌词",
    description: "第一幕与第二幕唱段，摘自学生版演出剧本。",
    cta: "曲目表 →",
  },
] as const;

export default function ScriptHubPage() {
  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Script &amp; World</p>
        <h1>走进《蝶》</h1>
        <p>世界观阐述、人物小传与曲目索引——三条路径进入故事。</p>
      </section>

      <div className="hub-grid">
        {HUB_LINKS.map((item) => (
          <Link className="hub-link" href={item.href} key={item.href}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <span className="hub-arrow">{item.cta}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

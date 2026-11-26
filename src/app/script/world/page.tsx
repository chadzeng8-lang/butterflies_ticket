import type { Metadata } from "next";
import Link from "next/link";
import { ScriptSubnav } from "@/components/ScriptSubnav";
import { SiteHeader } from "@/components/SiteHeader";
import { WORLDVIEW_SECTIONS } from "@/lib/worldview-content";

export const metadata: Metadata = {
  title: "世界观",
  description: "学生版《蝶》世界观：蝶人与诅咒、秩序与共谋、爱是抗争",
};

export default function WorldviewPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/script">剧情</Link> · 导演阐述
        </p>
        <h1>世界观</h1>
        <p>诅咒如何运转，婚礼为何是祭礼，爱又如何成为抗争。</p>
        <ScriptSubnav />
      </section>

      <article className="panel privacy-copy character-detail">
        {WORLDVIEW_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </section>
        ))}
      </article>

    </main>
  );
}

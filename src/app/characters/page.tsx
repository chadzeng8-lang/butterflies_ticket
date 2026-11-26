import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ScriptSubnav } from "@/components/ScriptSubnav";
import { SiteHeader } from "@/components/SiteHeader";
import { CHARACTERS } from "@/lib/characters";

export const metadata: Metadata = {
  title: "人物小传",
  description: "学生版《蝶》主要角色人物小传",
};

export default function CharactersPage() {
  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/script">剧情</Link> · Characters
        </p>
        <h1>人物小传</h1>
        <ScriptSubnav />
      </section>

      <div className="character-grid">
        {CHARACTERS.map((character) => (
          <Link
            className="character-card"
            href={`/characters/${character.slug}`}
            key={character.slug}
          >
            <div className="character-card-photo">
              <Image
                src={character.photo}
                alt={character.name}
                width={420}
                height={560}
                sizes="(max-width: 720px) 44vw, 180px"
                loading="lazy"
                unoptimized
              />
            </div>
            <h2>{character.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}

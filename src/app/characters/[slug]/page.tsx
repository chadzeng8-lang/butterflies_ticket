import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScriptSubnav } from "@/components/ScriptSubnav";
import { SiteHeader } from "@/components/SiteHeader";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import { getCharacterDetails } from "@/lib/character-details";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CHARACTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const character = getCharacter(slug);
  if (!character) return { title: "人物小传" };
  return {
    title: `${character.name} · 人物小传`,
    description: character.identity,
  };
}

export default async function CharacterDetailPage({ params }: Props) {
  const { slug } = await params;
  const character = getCharacter(slug);
  if (!character) notFound();

  const details = getCharacterDetails(character.slug);
  const index = CHARACTERS.findIndex((c) => c.slug === character.slug);
  const prev = index > 0 ? CHARACTERS[index - 1] : null;
  const next = index < CHARACTERS.length - 1 ? CHARACTERS[index + 1] : null;

  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/characters">人物小传</Link>
          {" · "}
          <Link href="/script">剧情</Link>
        </p>
        <h1>{character.name}</h1>
        <ScriptSubnav />
      </section>

      <article className="character-profile-card" aria-label={`${character.name}人物卡片`}>
        <div className="character-profile-photo">
          <Image
            src={character.photo}
            alt={character.name}
            width={420}
            height={560}
            sizes="(max-width: 720px) 70vw, 280px"
            priority
            unoptimized
          />
        </div>
        <p className="eyebrow">Character</p>
        <h2 className="character-profile-name">{character.name}</h2>
        <p className="character-profile-identity">{character.identity}</p>
        <dl className="character-profile-fields">
          <div>
            <dt>性格</dt>
            <dd>{character.personality}</dd>
          </div>
          <div>
            <dt>冲突</dt>
            <dd>{character.conflict}</dd>
          </div>
          <div>
            <dt>剧情</dt>
            <dd>{character.plot}</dd>
          </div>
        </dl>
      </article>

      <article className="panel privacy-copy character-detail">
        {details ? (
          details.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </section>
          ))
        ) : (
          <p className="character-detail-pending">待更新</p>
        )}
      </article>

      <nav className="article-nav" aria-label="相邻角色">
        {prev ? (
          <Link href={`/characters/${prev.slug}`}>← {prev.name}</Link>
        ) : (
          <span />
        )}
        <Link href="/characters">全部角色</Link>
        {next ? (
          <Link href={`/characters/${next.slug}`}>{next.name} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

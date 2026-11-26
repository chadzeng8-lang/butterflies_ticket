import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScriptSubnav } from "@/components/ScriptSubnav";
import { SiteHeader } from "@/components/SiteHeader";
import { SONGS, getSong } from "@/lib/lyrics-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SONGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const song = getSong(slug);
  if (!song) return { title: "歌词" };
  return {
    title: `${song.title} · 歌词`,
    description: `音乐剧《蝶》· ${song.act} · ${song.title}`,
  };
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const song = getSong(slug);
  if (!song) notFound();

  const index = SONGS.findIndex((s) => s.slug === song.slug);
  const prev = index > 0 ? SONGS[index - 1] : null;
  const next = index < SONGS.length - 1 ? SONGS[index + 1] : null;

  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/lyrics">歌词</Link> · {song.act} · 第 {song.num} 首
        </p>
        <h1>{song.title}</h1>
        <p>{song.artists}</p>
        <ScriptSubnav />
      </section>

      <article className="panel lyrics-body">
        {song.lines.map((line, i) => (
          <p key={`${i}-${line.slice(0, 12)}`}>{line}</p>
        ))}
      </article>

      <nav className="article-nav" aria-label="相邻曲目">
        {prev ? (
          <Link href={`/lyrics/${encodeURIComponent(prev.slug)}`}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/lyrics">全部曲目</Link>
        {next ? (
          <Link href={`/lyrics/${encodeURIComponent(next.slug)}`}>
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ScriptSubnav } from "@/components/ScriptSubnav";
import { SiteHeader } from "@/components/SiteHeader";
import { SONGS } from "@/lib/lyrics-data";

export const metadata: Metadata = {
  title: "歌词",
  description: "音乐剧《蝶》曲目列表 · 学生版演出参考",
};

export default function LyricsPage() {
  const act1 = SONGS.filter((s) => s.act === "第一幕");
  const act2 = SONGS.filter((s) => s.act === "第二幕");

  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/script">剧情</Link> · Score
        </p>
        <h1>歌词</h1>
        <p>
          以下为音乐剧《蝶》学生版演出剧本唱段，按幕次排列。作词：关山 · 作曲：三宝。
        </p>
        <ScriptSubnav />
      </section>

      <SongAct title="第一幕" songs={act1} />
      <SongAct title="第二幕" songs={act2} />
    </main>
  );
}

function SongAct({
  title,
  songs,
}: {
  title: string;
  songs: typeof SONGS;
}) {
  return (
    <section className="lyrics-act">
      <h2>{title}</h2>
      <ol className="lyrics-list">
        {songs.map((song) => (
          <li key={song.slug}>
            <Link href={`/lyrics/${encodeURIComponent(song.slug)}`}>
              <span className="lyrics-num">
                {song.act === "第一幕" ? "I" : "II"}-{song.num}
              </span>
              <span className="lyrics-title">{song.title}</span>
              <span className="lyrics-meta">{song.artists}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

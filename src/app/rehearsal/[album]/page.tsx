import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { StagePhotoMasonry } from "@/components/StagePhotoMasonry";
import {
  STAGE_ALBUMS,
  getStageAlbum,
  stageAlbumPhotos,
} from "@/lib/stage-photos";

type Props = { params: Promise<{ album: string }> };

export function generateStaticParams() {
  return STAGE_ALBUMS.map((a) => ({ album: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { album: id } = await params;
  const album = getStageAlbum(id);
  if (!album) return { title: "舞台剧照" };
  return {
    title: `${album.title} · 舞台剧照`,
    description: `${album.date} ${album.venue}`,
  };
}

export default async function StageAlbumPage({ params }: Props) {
  const { album: id } = await params;
  const album = getStageAlbum(id);
  if (!album) notFound();

  const photos = stageAlbumPhotos(album);

  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">
          <Link href="/rehearsal">排演日程</Link> · 舞台剧照
        </p>
        <h1>{album.title}</h1>
        <p>
          {album.date} · {album.venue}
        </p>
      </section>

      <StagePhotoMasonry photos={photos} />

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href="/rehearsal#stage">← 返回舞台剧照</Link>
      </p>
    </main>
  );
}

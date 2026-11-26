export type StageAlbum = {
  id: string;
  title: string;
  date: string;
  venue: string;
  href: string;
  thumb: string;
  dir: string;
  count: number;
};

/** 舞台／活动剧照相册；列表封面用 cover.jpg，详情页用 thumbs/ + full/。 */
export const STAGE_ALBUMS: StageAlbum[] = [
  {
    id: "bay-area",
    title: "深港澳青年文化交流周",
    date: "2026.07.12",
    venue: "《湾区长歌·时光织梦》大湾区高校音乐剧展演",
    href: "/rehearsal/bay-area",
    thumb: "/images/stage/bay-area/cover.jpg",
    dir: "/images/stage/bay-area",
    count: 10,
  },
  {
    id: "yingxing",
    title: "港中大荧星晚会",
    date: "2026.08.03",
    venue: "香港中文大学2026暑期学校荧星晚会",
    href: "/rehearsal/yingxing",
    thumb: "/images/stage/yingxing/cover.jpg",
    dir: "/images/stage/yingxing",
    count: 6,
  },
  {
    id: "cuhksz-midautumn",
    title: "港中深中秋晚会",
    date: "2026.09.23",
    venue: "香港中文大学（深圳）中秋晚会",
    href: "/rehearsal/cuhksz-midautumn",
    thumb: "/images/stage/cuhksz-midautumn/cover.jpg",
    dir: "/images/stage/cuhksz-midautumn",
    count: 6,
  },
  {
    id: "cuhk-mnight",
    title: "港中大 Mnight 中秋晚会",
    date: "2026.09.23",
    venue: "香港中文大学2026 Mnight中秋晚会",
    href: "/rehearsal/cuhk-mnight",
    thumb: "/images/stage/cuhk-mnight/cover.jpg",
    dir: "/images/stage/cuhk-mnight",
    count: 2,
  },
  {
    id: "antuoshan",
    title: "安托山",
    date: "2026.10.17",
    venue: "深圳安托山公共文化中心 · 向日葵厅",
    href: "/rehearsal/antuoshan",
    thumb: "/images/stage/antuoshan/cover.jpg",
    dir: "/images/stage/antuoshan",
    count: 40,
  },
  {
    id: "cuhksz",
    title: "港中深",
    date: "2026.11.21–22",
    venue: "香港中文大学（深圳）时光胶囊黑匣子",
    href: "/rehearsal/cuhksz",
    thumb: "/images/stage/cuhksz/cover.jpg",
    dir: "/images/stage/cuhksz",
    count: 43,
  },
];

export function getStageAlbum(id: string) {
  return STAGE_ALBUMS.find((a) => a.id === id) ?? null;
}

export function stageAlbumPhotos(album: StageAlbum) {
  return Array.from({ length: album.count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `${album.dir}/thumbs/${n}.jpg`,
      fullSrc: `${album.dir}/full/${n}.jpg`,
      alt: `${album.title}剧照 ${n}`,
    };
  });
}

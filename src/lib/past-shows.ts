export type PastShowBlock = {
  id: string;
  title: string;
  status: string;
  date: string;
  venue: string;
  summary: string;
  details: string[];
};

export const UPCOMING_SHOW_NOTE = {
  title: "下一站",
  date: "预计 2027 年 3 月",
  venue: "香港中文大学（香港）",
  summary: "学生版《蝶》计划于 2027 年 3 月在港中大校园演出，具体场次与售票信息将另行公布。",
};

export const PAST_SHOWS: PastShowBlock[] = [
  {
    id: "antuoshan",
    title: "安托山演出",
    status: "已完成",
    date: "2026.10.17",
    venue: "深圳安托山公共文化中心 · 向日葵厅",
    summary: "《蝶》精简版首演，面向公众开放。",
    details: [
      "形式：精简版舞台演出",
      "语言：普通话",
      "本场为学生版《蝶》首演，聚焦核心唱段与故事主线。",
    ],
  },
  {
    id: "cuhksz",
    title: "港中深演出",
    status: "已完成",
    date: "2026.11.21 — 11.22",
    venue: "香港中文大学（深圳）时光胶囊黑匣子",
    summary: "沉浸版展演两场：21 日面向公众，22 日面向港中大／港中深同学及教职工。",
    details: [
      "形式：沉浸式展演 · 约 150 分钟（含中场休息）",
      "语言：普通话",
      "票务：公益免费入场，观演按金到场后退还；报名已结束。",
      "11.21：面向公众人士",
      "11.22：仅开放给香港中文大学及香港中文大学（深圳）的同学及教职工",
    ],
  },
];

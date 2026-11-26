export type CastCredit = [role: string, name: string];

export type LeadVoice = {
  role: string;
  name: string;
  voice: string;
  /** 列表缩略图 */
  photo: string;
  /** 点击加载的高清图 */
  photoFull: string;
};

/** 本轮学生版主演 */
export const LEAD_VOICES: LeadVoice[] = [
  {
    role: "梁山伯",
    name: "徐泽韬",
    photo: "/images/characters/thumbs/liang-shanbo.jpg",
    photoFull: "/images/characters/full/liang-shanbo.jpg",
    voice: "梁山伯不是完美英雄，他只是拒绝再旁观。希望你走出剧场时，也带走一点自由的勇气。",
  },
  {
    role: "祝英台",
    name: "潘岑远",
    photo: "/images/characters/thumbs/zhu-yingtai.jpg",
    photoFull: "/images/characters/full/zhu-yingtai.jpg",
    voice: "祝英台的觉醒很安静，却很决绝。被安排的人生，也可以被自己改写。",
  },
  {
    role: "浪花儿",
    name: "李嘉雯",
    photo: "/images/characters/thumbs/langhua.jpg",
    photoFull: "/images/characters/full/langhua.jpg",
    voice: "浪花爱得炽热，死得成全。希望你看见她时，不只看见悲剧，也看见尊严。",
  },
  {
    role: "老爹",
    name: "黄宇峰",
    photo: "/images/characters/thumbs/laodie.jpg",
    photoFull: "/images/characters/full/laodie.jpg",
    voice: "秩序常常披着「别无选择」的外衣。演老爹，是在追问：谁在替别人付代价。",
  },
  {
    role: "老醉鬼",
    name: "韩文华",
    photo: "/images/characters/thumbs/lao-zuigui.jpg",
    photoFull: "/images/characters/full/lao-zuigui.jpg",
    voice: "顶着醉名的人，往往最清醒。我守的不是酒，是不肯咽下的真相。",
  },
  {
    role: "小女孩",
    name: "沈怡和",
    photo: "/images/characters/thumbs/xiao-nvhai.jpg",
    photoFull: "/images/characters/full/xiao-nvhai.jpg",
    voice: "只有孩子的眼睛能看见蝴蝶的叹息。愿那一点微光，也落进观众心里。",
  },
];

export type ButterflyPortrait = {
  role: string;
  name: string;
  photo: string;
  photoFull: string;
};

/**
 * 蝶人／配角定妆照（按照片上「演员 饰 角色」对照；演员姓氏拼音排序）
 */
export const BUTTERFLY_PORTRAITS: ButterflyPortrait[] = [
  {
    role: "绝望",
    name: "陈柯言",
    photo: "/images/characters/thumbs/juewang.jpg",
    photoFull: "/images/characters/full/juewang.jpg",
  },
  {
    role: "劳碌",
    name: "李春天",
    photo: "/images/characters/thumbs/laolu.jpg",
    photoFull: "/images/characters/full/laolu.jpg",
  },
  {
    role: "小灰",
    name: "刘睿元",
    photo: "/images/characters/thumbs/xiao-hui.jpg",
    photoFull: "/images/characters/full/xiao-hui.jpg",
  },
  {
    role: "失败",
    name: "刘谚熹",
    photo: "/images/characters/thumbs/shibai.jpg",
    photoFull: "/images/characters/full/shibai.jpg",
  },
  {
    role: "粗俗",
    name: "徐喆",
    photo: "/images/characters/thumbs/cusu.jpg",
    photoFull: "/images/characters/full/cusu.jpg",
  },
  {
    role: "大笨",
    name: "杨佳宜",
    photo: "/images/characters/thumbs/da-ben.jpg",
    photoFull: "/images/characters/full/da-ben.jpg",
  },
  {
    role: "寂寞",
    name: "曾城",
    photo: "/images/characters/thumbs/jimo.jpg",
    photoFull: "/images/characters/full/jimo.jpg",
  },
];

/** 尚无定妆照的蝶人名单（持续更新） */
export const BUTTERFLY_ENSEMBLE: string[] = [
  "丁想",
  "李佳仪",
  "李晓金",
  "刘奕辰",
  "伍舒琪",
];

/** @deprecated 兼容旧引用 */
export const ENSEMBLE_CAST: CastCredit[] = [
  ...BUTTERFLY_PORTRAITS.map(
    (item) => [item.role, item.name] as CastCredit,
  ),
  ...BUTTERFLY_ENSEMBLE.map((name) => ["蝶人", name] as CastCredit),
];

export const HOME_CAST: CastCredit[] = [
  ...LEAD_VOICES.map((lead) => [lead.role, lead.name] as CastCredit),
  ...ENSEMBLE_CAST,
];

export const HOME_CREW: CastCredit[] = [
  ["导演", "曾城"],
  ["助理导演", "郭宣辰、邓清扬、蒋思遥"],
  ["舞台监督", "柏雨辰、刘睿元"],
  ["舞蹈指导", "陈念秋"],
  ["声乐指导", "程佳玥、王之行"],
  ["舞美道具", "曾城、曾懿欣、柏雨辰"],
  ["舞美妆造", "王楷源、程泽宜、张佳彤、徐喆"],
  ["灯光", "王嘉琪、曾城、施涵中"],
  ["音乐制作", "刘睿元、王之行"],
  ["音效执行", "陈念秋、王之行、程泽宜"],
  ["摄影", "张佳彤、王一伊、胡可萱、彭琪淇"],
  ["字幕执行", "曾奕馨、邱心语"],
];

/** 首页 On Stage 剧照（public/images 微信导出图） */
export const STAGE_PHOTOS = [
  "微信图片_20261105155659_26_1.jpg",
  "微信图片_20261105155659_27_1.jpg",
  "微信图片_20261105155701_28_1.jpg",
  "微信图片_20261105155703_29_1.jpg",
  "微信图片_20261105155708_31_1.jpg",
  "微信图片_20261105155709_32_1.jpg",
  "微信图片_20261105155711_33_1.jpg",
  "微信图片_20261105155713_34_1.jpg",
  "微信图片_20261105155714_35_1.jpg",
  "微信图片_20261105155715_36_1.jpg",
  "微信图片_20261105155717_37_1.jpg",
  "微信图片_20261105155718_38_1.jpg",
] as const;

export function stagePhotoSrc(filename: string) {
  return `/images/${encodeURIComponent(filename)}`;
}

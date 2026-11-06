/** 演出地点（高德 GCJ-02，POI：香港中文大学(深圳)志仁楼 B0FFGZGFGY） */
export const SHOW_VENUE = {
  name: "时光胶囊黑匣子",
  location: "香港中文大学(深圳)志仁楼一楼",
  amapPoiId: "B0FFGZGFGY",
  /** 经度, 纬度 — 高德「志仁楼」POI */
  lng: 114.210919,
  lat: 22.68696,
  baiduMapUrl: "https://j.map.baidu.com/53/aYeM",
} as const;

export function amapMarkerUrl() {
  const { lng, lat, location, amapPoiId } = SHOW_VENUE;
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(location)}&src=cumusical&coordinate=gaode&callnative=1&poiid=${amapPoiId}`;
}

export function baiduMapUrl() {
  return SHOW_VENUE.baiduMapUrl;
}

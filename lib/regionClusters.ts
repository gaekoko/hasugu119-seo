// 실제 지리적으로 가까운 지역끼리 묶어서, 같은 묶음 안에서만
// "이전 지역 / 다음 지역"으로 서로 연결한다 (원형 체인 — 마지막은 다시 처음으로).
// 서울은 서울시 도시계획상 5대 권역(도심권/동북권/서북권/서남권/동남권) 구분을 그대로 사용.
export const regionClusters: string[][] = [
  // 도심권
  ["jongno", "junggu", "yongsan"],
  // 동북권
  [
    "seongdong",
    "gwangjin",
    "dongdaemun",
    "jungnang",
    "seongbuk",
    "gangbuk",
    "dobong",
    "nowon",
  ],
  // 서북권
  ["eunpyeong", "seodaemun", "mapo"],
  // 서남권 (관악구 -> 동작구 -> 금천구 -> 영등포구 순서 포함)
  ["gangseo", "yangcheon", "guro", "gwanak", "dongjak", "geumcheon", "yeongdeungpo"],
  // 동남권
  ["seocho", "gangnam", "songpa", "gangdong"],

  // 경기 북부
  ["goyang", "ilsan", "paju", "yangju", "uijeongbu"],
  // 경기 남부 (수원권) + 인천
  ["suwon", "anyang", "gunpo", "gwacheon", "gwangmyeong", "incheon"],
  // 경기 남부 (화성·평택권)
  ["hwaseong", "osan", "pyeongtaek", "anseong", "siheung"],

  // 충청 - 천안·아산권
  ["cheonan", "asan"],
  // 충청 - 청주권 (4개 구)
  ["cheongju-sangdang", "cheongju-seowon", "cheongju-cheongwon", "cheongju-heungdeok"],
  // 충청 - 음성·진천·증평권
  ["eumseong", "jeungpyeong", "jincheon"],
];

export function getNearbyRegions(regionKey: string): { prev: string | null; next: string | null } {
  for (const cluster of regionClusters) {
    const idx = cluster.indexOf(regionKey);
    if (idx === -1) continue;
    if (cluster.length === 1) return { prev: null, next: null };
    const prevIdx = (idx - 1 + cluster.length) % cluster.length;
    const nextIdx = (idx + 1) % cluster.length;
    return { prev: cluster[prevIdx], next: cluster[nextIdx] };
  }
  return { prev: null, next: null };
}

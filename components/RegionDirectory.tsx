import Link from "next/link";
import regions from "@/data/regions.json";

// 서비스별 지역 링크 텍스트 변형 (키워드 중복 방지)
const SERVICE_LINK_VARIANTS: Record<string, string[]> = {
  drain: [
    "배관 출장", "하수구 뚫기", "배수관 청소", "배관 막힘 해결", "하수구 출동",
    "배수구 뚫기", "하수관 청소", "배관 청소", "배수 불량 해결", "하수구 긴급출동",
    "배관 뚫음", "하수구 배수 불량", "배수관 막힘", "하수관 뚫기", "배관 고압세척",
    "하수구 막힘 해결", "배수구 청소", "하수관 막힘", "배관 출동", "하수구 세척",
    "배수관 출장", "하수구 점검", "배관 세척", "하수구 청소", "배수 출장",
  ],
  sink: [
    "주방 배수 출장", "싱크대 뚫기", "주방 배관 청소", "싱크대 배수 해결", "주방 출동",
    "싱크대 출장", "주방 하수구 청소", "싱크대 배관 출장", "주방 배수 불량", "싱크대 출동",
    "주방 배관 뚫기", "싱크대 트랩 청소", "주방 배수관 청소", "싱크대 막힘 해결", "주방 출장",
    "싱크대 배수관", "주방 배관 출동", "씽크대 뚫기", "주방 하수구 출장", "싱크대 고압세척",
    "주방 배수 출동", "싱크대 점검", "주방 배관 세척", "싱크대 청소", "주방 배수 청소",
  ],
  toilet: [
    "변기 출장", "화장실 뚫기", "변기 배관 청소", "화장실 막힘 해결", "변기 출동",
    "화장실 출장", "변기 배수 해결", "화장실 배관 출장", "변기 배수 불량", "화장실 출동",
    "변기 배관 뚫기", "화장실 배관 청소", "변기 막힘 해결", "양변기 뚫기", "화장실 출장",
    "변기 배수관", "화장실 배관 출동", "변기 고압세척", "화장실 하수구 출장", "변기 점검",
    "화장실 배수 출동", "변기 청소", "화장실 배관 세척", "변기 배수 출장", "화장실 배수 청소",
  ],
};

export default function RegionDirectory({
  serviceKey,
  serviceLabel,
  currentArea,
}: {
  serviceKey: string;
  serviceLabel: string;
  currentArea?: string;
}) {
  const variants = SERVICE_LINK_VARIANTS[serviceKey] ?? [];

  const groups: Record<string, [string, (typeof regions)[keyof typeof regions]][]> = {};
  for (const [code, data] of Object.entries(regions)) {
    groups[data.area] = groups[data.area] || [];
    groups[data.area].push([code, data]);
  }
  for (const area in groups) {
    groups[area].sort((a, b) => a[1].name.localeCompare(b[1].name, "ko"));
  }

  const order = ["서울특별시", "경기·인천", "충청권"];
  const visibleAreas = currentArea ? order.filter((a) => a === currentArea) : order;
  const otherAreas = order.filter((a) => a !== currentArea);

  // 지역 인덱스 기반으로 변형 텍스트 선택
  const allRegionCodes = Object.keys(regions);

  return (
    <div className="space-y-8">
      {visibleAreas
        .filter((area) => groups[area])
        .map((area) => (
          <div key={area}>
            <div className="mb-3 flex items-center gap-2 rounded-md bg-[#eef2fb] px-4 py-3">
              <span className="text-[#0d2c6b]">📍</span>
              <h3 className="font-bold text-[#0d2c6b]">
                배관 출장 업체 {area}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm sm:grid-cols-5">
              {groups[area].map(([code, data]) => {
                const idx = allRegionCodes.indexOf(code);
                const linkText = variants.length > 0
                  ? `${data.name} ${variants[idx % variants.length]}`
                  : `${data.name} ${serviceLabel}`;
                return (
                  <Link
                    key={code}
                    href={`/${serviceKey}/${code}`}
                    className="truncate text-gray-700 hover:text-[#0d2c6b] hover:underline"
                  >
                    {linkText}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      {otherAreas.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          {otherAreas
            .filter((a) => groups[a])
            .map((a) => (
              <Link
                key={a}
                href={`/${serviceKey}/${Object.entries(regions).find(([, d]) => d.area === a)?.[0]}`}
                className="underline hover:text-[#0d2c6b]"
              >
                {a} 지역 배관 출장 보기
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

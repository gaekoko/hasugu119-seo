import Link from "next/link";
import regions from "@/data/regions.json";

export default function RegionDirectory({
  serviceKey,
  serviceLabel,
  currentArea,
}: {
  serviceKey: string;
  serviceLabel: string;
  currentArea?: string;
}) {
  const groups: Record<string, [string, (typeof regions)[keyof typeof regions]][]> = {};
  for (const [code, data] of Object.entries(regions)) {
    groups[data.area] = groups[data.area] || [];
    groups[data.area].push([code, data]);
  }
  for (const area in groups) {
    groups[area].sort((a, b) => a[1].name.localeCompare(b[1].name, "ko"));
  }

  const order = ["서울특별시", "경기·인천", "충청권"];
  // 같은 권역만 노출 — 50개 전체를 모든 페이지에 동일하게 나열하면
  // 페이지 간 본문이 과도하게 중복되어 유사문서로 분류될 위험이 있음
  const visibleAreas = currentArea ? order.filter((a) => a === currentArea) : order;
  const otherAreas = order.filter((a) => a !== currentArea);

  return (
    <div className="space-y-8">
      {visibleAreas
        .filter((area) => groups[area])
        .map((area) => (
          <div key={area}>
            <div className="mb-3 flex items-center gap-2 rounded-md bg-[#eef2fb] px-4 py-3">
              <span className="text-[#0d2c6b]">📍</span>
              <h3 className="font-bold text-[#0d2c6b]">
                {serviceLabel} 업체 {area}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm sm:grid-cols-5">
              {groups[area].map(([code, data]) => (
                <Link
                  key={code}
                  href={`/${serviceKey}/${code}`}
                  className="truncate text-gray-700 hover:text-[#0d2c6b] hover:underline"
                >
                  {data.name}{serviceLabel}
                </Link>
              ))}
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
                {a} {serviceLabel} 지역 보기
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegionDirectory from "@/components/RegionDirectory";
import PhotoSlot from "@/components/PhotoSlot";

type RegionKey = keyof typeof regions;
type ServiceKey = keyof typeof services;

export function generateStaticParams() {
  // TEMP: 검토용으로 1개만 생성 (확정되면 전체 50x3=150개로 복원)
  return [{ service: "drain", region: "gangnam" }];
}

function getData(service: string, region: string) {
  const svc = (services as Record<string, (typeof services)[ServiceKey]>)[service];
  const reg = (regions as Record<string, (typeof regions)[RegionKey]>)[region];
  if (!svc || !reg) return null;
  return { svc, reg };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; region: string }>;
}): Promise<Metadata> {
  const { service, region } = await params;
  const data = getData(service, region);
  if (!data) return {};
  const { svc, reg } = data;
  const title = `${svc.title.replace("{region}", reg.name)} | ${siteConfig.brand}`;
  const description = `${siteConfig.brand}는 ${reg.name} 전 지역(${reg.dongs.slice(0, 3).join("·")} 등) ${svc.label} 출장 서비스를 제공합니다. ${svc.intro}`;
  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.baseUrl}/${service}/${region}` },
  };
}

export default async function ServiceRegionPage({
  params,
}: {
  params: Promise<{ service: string; region: string }>;
}) {
  const { service, region } = await params;
  const data = getData(service, region);
  if (!data) notFound();
  const { svc, reg } = data;
  const h1 = svc.h1.replace("{region}", reg.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${siteConfig.brand} ${reg.name} ${svc.label}`,
    areaServed: reg.dongs,
    telephone: siteConfig.phone,
    url: `${siteConfig.baseUrl}/${service}/${region}`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${reg.name}에서 ${svc.label} 출장비는 얼마인가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "막힘 정도와 작업 범위에 따라 달라지며, 방문 전 전화 상담으로 예상 비용을 먼저 안내드립니다.",
        },
      },
      {
        "@type": "Question",
        name: `${reg.name} 전 지역 출장이 가능한가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `네, ${reg.name} 전 지역(${reg.dongs.join(", ")}) 출장이 가능합니다.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Header currentService={service} />

      <main className="bg-white pb-16">
        {/* 히어로 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1f4d] via-[#0d2c6b] to-[#1a4fb8] px-5 py-14 text-center text-white">
          <p className="text-sm text-blue-200">
            <span className="opacity-80">Home</span> ›{" "}
            <span className="opacity-80">{svc.label}</span> › {reg.name}
          </p>
          <p className="mt-4 text-sm font-semibold text-orange-300">
            365일 24시간 긴급출동
          </p>
          <h1 className="mt-2 text-3xl font-black italic tracking-tight md:text-5xl">
            {h1}
          </h1>
          <p className="mt-4 text-base text-blue-100">
            평균 30분 이내 방문 · 출장비 상담 후 작업 · {reg.dongs.length}개 동 전 지역 가능
          </p>
        </section>

        {/* 한 줄 카피 + 대표 사진 */}
        <section className="mx-auto max-w-4xl px-5 py-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {reg.name} {svc.label}{" "}
            <span className="text-orange-500">말끔히</span> 해결해드립니다
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            &quot;{siteConfig.brand}는 막힘 진단부터 작업까지 한 번의 방문으로 해결합니다&quot;
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <PhotoSlot label={`${reg.name} ${svc.label} 작업 사진`} ratio="4/3" src="/photos/clog-removed-1.jpg" />
          </div>
        </section>

        {/* 지역 디렉토리 */}
        <section className="mx-auto max-w-5xl px-5 py-10">
          <RegionDirectory serviceKey={service} serviceLabel={svc.label} />
        </section>

        {/* 막힘 원인 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">01</span>
            {reg.name} {svc.label}, 왜 자주 발생할까요?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            {reg.feature} {reg.feature2}
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">
            이런 환경에서는 <strong className="text-[#0d2c6b]">{reg.problem}</strong>
            로 인한 {svc.label}이 빈번하게 발생합니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PhotoSlot label="막힘 전 현장" ratio="1/1" src="/photos/before-pipe-1.jpg" />
            <PhotoSlot label="장비로 진단" ratio="1/1" src="/photos/camera-diagnosis-1.jpg" />
            <PhotoSlot label="막힘 후 제거물" ratio="1/1" src="/photos/clog-removed-3.jpg" />
          </div>
        </section>

        {/* 작업 범위 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">02</span>
            {svc.label} 작업 범위
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            {siteConfig.brand}는 {reg.name} 전 지역을 30분 이내 출장하여{" "}
            {svc.scope} 신속하게 해결해드립니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label="현장 작업 모습" ratio="4/3" src="/photos/onsite-work-1.jpg" />
            <PhotoSlot label="내시경 카메라 점검" ratio="4/3" src="/photos/camera-diagnosis-2.jpg" />
          </div>
          <div className="mt-5 rounded-lg bg-gray-50 p-5">
            <p className="leading-relaxed text-gray-700">{svc.extraNote}</p>
          </div>
        </section>

        {/* 방치하면 안되는 이유 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">03</span>
            방치하면 안 되는 이유
          </h2>
          <ul className="mt-3 space-y-2 leading-relaxed text-gray-700">
            <li>· 막힘이 오래되면 악취가 심해지고 벌레가 발생할 수 있어요.</li>
            <li>· 역류가 시작되면 바닥 침수, 아랫집 피해로 이어질 수 있어요.</li>
            <li>· 초기엔 간단한 작업으로 끝나지만, 방치하면 배관 교체 등 큰 공사가 필요해질 수 있어요.</li>
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label="방치된 배관 내부" ratio="16/9" src="/photos/dirty-drain-1.jpg" />
            <PhotoSlot label="실제 제거된 이물질" ratio="16/9" src="/photos/clog-removed-2.jpg" />
          </div>
        </section>

        {/* 비용 안내 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">04</span>
            출장 비용 안내
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            막힘 정도와 작업 범위에 따라 비용이 달라지기 때문에, 방문 전 상담을
            통해 예상 비용을 먼저 안내드리고 현장에서 최종 확인 후 작업을
            진행합니다. 숨겨진 추가 비용 없이 투명하게 안내드려요.
          </p>
        </section>

        {/* 동 목록 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <div className="rounded-xl border border-[#0d2c6b]/20 bg-blue-50 p-6">
            <h2 className="font-bold text-[#0d2c6b]">
              출장 가능 동 목록 ({svc.label})
            </h2>
            <p className="mt-2 text-gray-700">{reg.dongs.join(" · ")}</p>
          </div>
          <p className="mt-6 text-center leading-relaxed text-gray-600">
            {svc.label}은 방치할수록 악취와 역류로 이어질 수 있으니, 증상이
            보이면 미루지 말고 바로 연락 주시기 바랍니다.
          </p>
          <div className="mt-8 text-center">
            <a
              href={`tel:${siteConfig.phone}`}
              className="inline-block rounded-full bg-[#0d2c6b] px-8 py-4 text-lg font-bold text-white"
            >
              지금 전화 상담 {siteConfig.phone}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

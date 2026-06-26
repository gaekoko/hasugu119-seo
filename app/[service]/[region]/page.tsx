import { notFound } from "next/navigation";
import type { Metadata } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";

type RegionKey = keyof typeof regions;
type ServiceKey = keyof typeof services;

export function generateStaticParams() {
  // TEMP: 검토용으로 1개만 생성 (확정되면 전체 50x3=150개로 복원)
  return [{ service: "drain", region: "gangnam" }];
}

function getData(service: string, region: string) {
  const svc = (services as Record<string, (typeof services)[ServiceKey]>)[
    service
  ];
  const reg = (regions as Record<string, (typeof regions)[RegionKey]>)[
    region
  ];
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
    alternates: {
      canonical: `${siteConfig.baseUrl}/${service}/${region}`,
    },
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
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* 헤더 */}
      <header className="bg-[#0d2c6b] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <span className="text-lg font-extrabold tracking-tight">
            100% {siteConfig.brand}
          </span>
          <a
            href={`tel:${siteConfig.phone}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0d2c6b]"
          >
            {siteConfig.phone}
          </a>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#0d2c6b] to-[#1a4fb8] px-5 py-10 text-center text-white">
        <p className="text-sm font-semibold text-orange-300">
          365일 24시간 긴급출동
        </p>
        <h1 className="mt-2 text-3xl font-black italic tracking-tight md:text-4xl">
          {h1}
        </h1>
        <p className="mt-3 text-base text-blue-100">
          평균 30분 이내 방문 · 출장비 상담 후 작업
        </p>
      </section>

      {/* 본문 */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-lg leading-relaxed text-gray-800">{svc.intro}</p>

        <div className="mt-6 rounded-xl bg-gray-50 p-5">
          <h2 className="text-lg font-bold text-[#0d2c6b]">
            {reg.name} 지역 특징
          </h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            {reg.feature} {reg.feature2}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-[#0d2c6b]">
            왜 {svc.label}이 자주 발생할까요?
          </h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            이런 환경에서는 <strong>{reg.problem}</strong>로 인한 {svc.label}
            이 빈번하게 발생합니다. {siteConfig.brand}는 {reg.name} 전 지역을
            30분 이내 출장하여 {svc.scope} 신속하게 해결해드립니다.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-[#0d2c6b]">참고하세요</h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            {svc.extraNote}
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-[#0d2c6b]/20 bg-blue-50 p-5">
          <h2 className="font-bold text-[#0d2c6b]">
            출장 가능 동 목록 ({svc.label})
          </h2>
          <p className="mt-2 text-gray-700">{reg.dongs.join(" · ")}</p>
        </div>

        <p className="mt-8 text-center leading-relaxed text-gray-600">
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

        <p className="mt-6 text-center">
          <a
            href={siteConfig.baseUrl}
            className="text-sm text-[#0d2c6b] underline"
          >
            {siteConfig.brand} 메인페이지 바로가기
          </a>
        </p>
      </section>
    </main>
  );
}

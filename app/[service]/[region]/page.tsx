import { notFound } from "next/navigation";
import type { Metadata } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegionDirectory from "@/components/RegionDirectory";
import PhotoSlot from "@/components/PhotoSlot";
import { pickPhotos } from "@/data/photos";
import { cyclePick, pickDistinctCombo } from "@/lib/rotate";
import { getNearbyRegions } from "@/lib/regionClusters";

type RegionKey = keyof typeof regions;
type ServiceKey = keyof typeof services;

export function generateStaticParams() {
  const params: { service: string; region: string }[] = [];
  for (const service of Object.keys(services)) {
    for (const region of Object.keys(regions)) {
      params.push({ service, region });
    }
  }
  return params;
}


function pickSymptomPhrase(region: string, phrases: string[]) {
  const keys = Object.keys(regions);
  const idx = keys.indexOf(region);
  return phrases[cyclePick(phrases.length, idx >= 0 ? idx : 0)];
}

// 지역마다 다른 조합이 나오도록, 각 콘텐츠 블록마다 다른 salt로 로테이션
// (단순 % 연산은 풀 크기만큼 주기가 생겨 그 주기마다 완전히 동일한 조합이 반복되므로,
//  cyclePick으로 사이클마다 곱수를 바꿔 그 반복을 깬다)
function pickVariant<T>(pool: T[] | undefined, fallback: T, regionIndex: number, salt: number, slugSalt = 0): T {
  if (!pool || pool.length === 0) return fallback;
  const idx = cyclePick(pool.length, regionIndex, salt, slugSalt);
  return pool[idx];
}

function rotateFaqs(pool: { q: string; a: string }[], regionIndex: number, salt = 0, slugSalt = 0) {
  if (pool.length === 0) return [];
  return pickDistinctCombo(pool, regionIndex + slugSalt * 28, 4, salt);
}

function buildContent(svc: any, regionIndex: number, slugSalt: number) {
  return {
    intro: pickVariant(svc.introVariants, svc.intro, regionIndex, 0, slugSalt),
    extraNote: pickVariant(svc.extraNoteVariants, svc.extraNote, regionIndex, 1, slugSalt),
    scope: pickVariant(svc.scopeVariants, svc.scope, regionIndex, 2, slugSalt),
    causes: pickVariant(svc.causesVariants, svc.causes, regionIndex, 3, slugSalt),
    tips: pickVariant(svc.tipsVariants, svc.tips, regionIndex, 4, slugSalt),
    equipment: pickVariant(svc.equipmentVariants, svc.equipment, regionIndex, 5, slugSalt),
    costInfo: pickVariant(
      svc.costInfoVariants,
      "막힘 정도와 작업 범위에 따라 비용이 달라지기 때문에, 방문 전 상담을 통해 예상 비용을 먼저 안내드리고 현장에서 최종 확인 후 작업을 진행합니다. 숨겨진 추가 비용 없이 투명하게 안내드려요.",
      regionIndex,
      6,
      slugSalt
    ),
    neglect: pickVariant(
      svc.neglectVariants,
      [
        "막힘이 오래되면 악취가 심해지고 벌레가 발생할 수 있어요.",
        "역류가 시작되면 바닥 침수, 아랫집 피해로 이어질 수 있어요.",
        "초기엔 간단한 작업으로 끝나지만, 방치하면 배관 교체 등 큰 공사가 필요해질 수 있어요.",
      ],
      regionIndex,
      7,
      slugSalt
    ),
    searchIntent: pickVariant(svc.searchIntentVariants, null, regionIndex, 8, slugSalt) as string | null,
    longtailFaqs: rotateFaqs(svc.longtailFaqs ?? [], regionIndex, 9, slugSalt),
  };
}

function getData(service: string, region: string) {
  const svc = (services as Record<string, any>)[service];
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
  const phrase = pickSymptomPhrase(region, svc.symptomPhrases);
  // phrase가 "막힘"으로 끝나면 svc.label이 포함된 케이스 — 그대로 두면 title이 짧아지므로
  // " 출장"을 추가해 최소 22자 이상 확보하고, svc.label도 명시
  // phrase가 "막힘"으로 끝날 때: phrase가 이미 svc.label을 포함하면 label 생략 후 " 출장" 추가
  // (예: svc.label="싱크대막힘", phrase="싱크대막힘" → "싱크대막힘 출장"으로 중복 방지)
  const titleBase = phrase.endsWith("막힘")
    ? phrase.includes(svc.label)
      ? `${reg.name} ${phrase} 출장`
      : `${reg.name} ${svc.label} ${phrase} 출장`
    : `${reg.name} ${svc.label} ${phrase}`;
  const title = `${titleBase} | ${siteConfig.brand}`;
  const regionIndexForMeta = Object.keys(regions).indexOf(region);
  const introForMeta = pickVariant(svc.introVariants, svc.intro, regionIndexForMeta, 0);
  // description: 지역 고유 문장(intro)을 앞에 두어 서치어드바이저 중복 판정 회피
  const dongs3 = reg.dongs.slice(0, 3).join("·");
  const description = `${introForMeta} ${reg.name}(${dongs3} 등) ${svc.label} 출장 — ${siteConfig.brand} 365일 24시간.`;
  const aiSummary = `${reg.name} ${svc.label} 출장 서비스. ${siteConfig.brand} 365일 24시간 운영. 평균 30분 이내 방문. 현장 확인 후 견적. 전화: ${siteConfig.phone}`;
  const ogImage = `${siteConfig.baseUrl}${pickPhotos(service, regionIndexForMeta).hero}`;
  return {
    title,
    description,
    // AI 브리핑/스니펫 최적화
    other: {

      "summary": aiSummary,
      "robots": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      "geo.region": reg.area === "서울특별시" ? "KR-11" : reg.area === "경기·인천" ? "KR-41" : "KR-44",
      "geo.placename": reg.name,
    },
    alternates: { canonical: `${siteConfig.baseUrl}/${service}/${region}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.baseUrl}/${service}/${region}`,
      siteName: siteConfig.brand,
      images: [ogImage],
      locale: "ko_KR",
      type: "website",
    },
    robots: { index: true, follow: true },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
  const phrase = pickSymptomPhrase(region, svc.symptomPhrases);
  const h1 = phrase.endsWith("막힘") ? `${reg.name} ${phrase}` : `${reg.name} ${svc.label} ${phrase}`;
  const regionIndex = Object.keys(regions).indexOf(region);
  const photos = pickPhotos(service, regionIndex);

  const slugSalt = region.length; // slug 길이로 ri 주기 충돌 방지
  const content = buildContent(svc, regionIndex, slugSalt);
  const nearby = getNearbyRegions(region);
  const dongs3 = reg.dongs.slice(0, 3).join("·");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PlumbingService",
    name: `${siteConfig.brand} ${reg.name} ${svc.label}`,
    areaServed: {
      "@type": "AdministrativeArea",
      name: reg.name,
      description: `${reg.name} 전 지역(${reg.dongs.join(", ")}) 출장 가능`,
    },
    telephone: siteConfig.phone,
    url: `${siteConfig.baseUrl}/${service}/${region}`,
    priceRange: "KRW",
    openingHours: "Mo-Su 00:00-23:59",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${siteConfig.brand} 서비스`,
      itemListElement: Object.values(services).map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.label },
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": siteConfig.baseUrl },
      { "@type": "ListItem", "position": 2, "name": svc.label, "item": `${siteConfig.baseUrl}/${service}` },
      { "@type": "ListItem", "position": 3, "name": `${reg.name} ${svc.label}`, "item": `${siteConfig.baseUrl}/${service}/${region}` },
    ],
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
      ...content.longtailFaqs.slice(0, 2).map((f: any) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ],
  };

  // HowTo Schema - 네이버AI·ChatGPT 핵심 (단계별 가이드)
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${reg.name} ${svc.label} 출장 요청 방법`,
    description: `${reg.name}에서 ${svc.label} 발생 시 ${siteConfig.brand}에 출장 요청하는 방법입니다.`,
    totalTime: "PT30M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "KRW", value: "전화 상담 후 안내" },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "증상 확인",
        text: `${reg.name} 현장에서 ${svc.label} 증상을 확인합니다. 물이 역류하거나 배수 속도가 느려진 경우 즉시 연락하세요.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "전화 상담 및 출동 요청",
        text: `${siteConfig.phone}으로 전화해 ${reg.name} 주소와 증상을 설명하면 평균 30분 이내 기술자가 출동합니다.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "현장 내시경 진단",
        text: "기술자가 내시경 카메라로 배관 내부를 촬영해 막힘 원인과 위치를 정확히 파악합니다.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "견적 확인 및 작업 동의",
        text: "진단 결과와 예상 비용을 안내받고 동의 후 작업을 시작합니다. 숨겨진 추가 비용은 없습니다.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "고압세척 및 통수 확인",
        text: "전문 장비로 막힘을 제거하고 통수 상태를 고객과 함께 확인한 뒤 작업을 완료합니다.",
      },
    ],
  };

  // WebPage + Speakable Schema - 구글AI·제미나이 최적화
  const titleForSchema = `${h1} | ${siteConfig.brand}`;
  const descriptionForSchema = `${reg.name} ${svc.label} 출장 서비스. ${siteConfig.brand} 365일 24시간 운영.`;
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: titleForSchema,
    description: descriptionForSchema,
    url: `${siteConfig.baseUrl}/${service}/${region}`,
    inLanguage: "ko",
    dateModified: new Date().toISOString().split("T")[0],
    speakable: {
      "@type": "SpeakableSpecification",
      // AI가 핵심 내용으로 발췌할 CSS 셀렉터
      cssSelector: ["h1", ".ai-summary", ".faq-section"],
    },
    mainEntity: {
      "@type": "LocalBusiness",
      "@id": `${siteConfig.baseUrl}/#business`,
      name: siteConfig.brand,
      telephone: siteConfig.phone,
      areaServed: reg.name,
      openingHours: "Mo-Su 00:00-23:59",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <Header currentService={service} />

      <main className="bg-white pb-16">
        {/* 히어로 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1f4d] via-[#0d2c6b] to-[#1a4fb8] px-5 py-14 text-center text-white">
          <p className="text-sm text-blue-200">
            <span className="opacity-80">Home</span> ›{" "}
            <span className="opacity-80">배관 서비스</span> › {reg.name}
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

        {/* AI 브리핑 요약 정의문 - AI 크롤러가 첫 번째로 발췌하는 영역 */}
        <section className="ai-summary mx-auto max-w-4xl px-5 pt-8 pb-2">
          <div className="rounded-xl border-l-4 border-[#0d2c6b] bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-[#0d2c6b]">📌 {reg.name} {svc.label} 핵심 정보</p>
            <p className="mt-1 text-sm text-gray-700">
              <strong>{reg.name} {svc.label}</strong>은 배관 내 이물질·기름 슬러지·스케일 누적이 주된 원인입니다.
              {siteConfig.brand}는 {reg.name} 전 지역({dongs3} 등) 365일 24시간 출장하며,
              평균 30분 이내 방문·내시경 진단·고압세척으로 당일 해결합니다.
              문의: <strong>{siteConfig.phone}</strong>
            </p>
          </div>
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
            <PhotoSlot label={`${reg.name} 배관 출장 현장 사진`} ratio="4/3" src={photos.hero} priority />
          </div>
        </section>

        {/* 원인별 해결방법 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">01</span>
            배관 막힘 원인별 해결방법
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">원인</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">해결방법</th>
                </tr>
              </thead>
              <tbody>
            {content.causes.map((c: any, i: number) => (
                  <tr key={c.cause} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="border-t px-4 py-3 text-gray-800">{c.cause}</td>
                    <td className="border-t px-4 py-3 text-gray-600">{c.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 출장 가능 동 목록 — 01과 02 사이 위치 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <div className="rounded-xl border border-[#0d2c6b]/20 bg-blue-50 p-6">
            <h2 className="font-bold text-[#0d2c6b]">
              출장 가능 동 목록
            </h2>
            <p className="mt-2 text-gray-700">{reg.dongs.join(" · ")}</p>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
            >
              🗺️ {reg.name} 전체 지도에서 보기
            </a>
            {(nearby.prev || nearby.next) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#0d2c6b]/10 pt-4 text-sm">
                <span className="font-semibold text-[#0d2c6b]">인근 지역 출장 안내</span>
                {nearby.prev && (
                  <a
                    href={`/${service}/${nearby.prev}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    ← {regions[nearby.prev as keyof typeof regions].name}
                  </a>
                )}
                {nearby.next && (
                  <a
                    href={`/${service}/${nearby.next}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    {regions[nearby.next as keyof typeof regions].name} →
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 자주 묻는 질문 (롱테일 키워드) - faq-section: Speakable Schema 연동 */}
        <section className="faq-section mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">02</span>
            {reg.name} 배관 막힘 자주 묻는 질문
          </h2>
          <div className="mt-4 space-y-3">
            {content.longtailFaqs.map((f: any) => (
              <details key={f.q} className="group rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer list-none font-bold text-gray-900">
                  Q. {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">A. {f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 예방 팁 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">03</span>
            배관 막힘 예방 팁
          </h2>
          <ul className="mt-4 space-y-3">
            {content.tips.map((tip: string) => (
              <li key={tip} className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-gray-700">
                <span>✅</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 장비 소개 — 04 위치 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">04</span>
            출장 작업 장비 소개
          </h2>
          <div className="mt-4 space-y-4">
            {content.equipment.map((eq: any) => (
              <div key={eq.name} className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">🔧 {eq.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{eq.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 막힘 원인 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">05</span>
            {reg.name} 배관 막힘, 왜 자주 발생할까요?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">{content.intro}</p>
          <p className="mt-3 leading-relaxed text-gray-700">
            {reg.feature} {reg.feature2}
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">
            이런 환경에서는 <strong className="text-[#0d2c6b]">{reg.problem}</strong>
            로 인한 배관 막힘이 빈번하게 발생합니다.
          </p>
          {reg.seasonalNote && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.seasonalNote}</p>
          )}
          <a
            href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.govOffice)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
          >
            📍 {reg.govOffice} 위치 보기 (네이버 지도)
          </a>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PhotoSlot label={`${reg.name} 배관 막힘 작업 전 현장`} ratio="1/1" src={photos.before} />
            <PhotoSlot label={`${reg.name} 내시경 카메라 진단`} ratio="1/1" src={photos.diagnosis} />
            <PhotoSlot label={`${reg.name} 배관 청소 후 제거된 이물질`} ratio="1/1" src={photos.removed} />
          </div>
        </section>

        {/* 작업 범위 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">06</span>
            출장 작업 범위
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            {siteConfig.brand}는 {reg.name} 전 지역을 30분 이내 출장하여{" "}
            {content.scope} 신속하게 해결해드립니다.
          </p>
          {reg.localTip && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.localTip}</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label={`${reg.name} 출장 작업 진행 중`} ratio="4/3" src={photos.onsiteWork} />
            <PhotoSlot label={`${reg.name} 배관 내시경 점검 현장`} ratio="4/3" src={photos.onsiteDiagnosis} />
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 p-5">
            <p className="leading-relaxed text-gray-700">{content.extraNote}</p>
          </div>
        </section>

        {/* 검색 의도 — 롱테일 키워드 자연 반영 */}
        {content.searchIntent && (
          <section className="mx-auto max-w-4xl px-5 py-10">
            <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-5">
              <p className="leading-relaxed text-gray-700">{content.searchIntent}</p>
            </div>
          </section>
        )}

        {/* 방치하면 안되는 이유 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">07</span>
            방치하면 안 되는 이유
          </h2>
          <ul className="mt-3 space-y-2 leading-relaxed text-gray-700">
            {content.neglect.map((n: string) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label={`${reg.name} 방치된 배관 내부 상태`} ratio="16/9" src={photos.neglectBefore} />
            <PhotoSlot label={`${reg.name} 배관 청소 후 제거된 이물질`} ratio="16/9" src={photos.neglectAfter} />
          </div>
        </section>

        {/* 비용 안내 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">08</span>
            출장 비용 안내
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">{content.costInfo}</p>
        </section>

        {/* 마무리 CTA */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <p className="text-center leading-relaxed text-gray-600">
            배관 막힘은 방치할수록 악취와 역류로 이어질 수 있습니다. {reg.name} 증상이 보이면 미루지 말고 바로 연락 주세요.
          </p>
          <div className="mt-8 text-center">
            <a
              href={`tel:${siteConfig.phone}`}
              className="inline-block rounded-full bg-[#0d2c6b] px-8 py-4 text-lg font-bold text-white"
            >
              지금 전화 상담 {siteConfig.phone}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={siteConfig.mainSiteUrls[service] ?? siteConfig.mainSiteUrls.drain}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[#0d2c6b] underline"
            >
              {siteConfig.brand} 공식 페이지 바로가기
            </a>
            <span className="text-gray-300">|</span>
            <a
              href={siteConfig.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d2c6b] underline"
            >
              네이버 블로그에서 작업 후기 더 보기
            </a>
          </div>
        </section>

        {/* 지역 디렉토리 — 페이지 맨 아래 위치 */}
        <section className="mx-auto max-w-5xl px-5 py-10">
          <RegionDirectory serviceKey={service} serviceLabel={svc.label} currentArea={reg.area} />
        </section>
      </main>

      <Footer />
    </>
  );
}

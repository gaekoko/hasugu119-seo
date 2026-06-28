import { notFound } from "next/navigation";
import type { Metadata } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegionDirectory from "@/components/RegionDirectory";
import PhotoSlot from "@/components/PhotoSlot";
import { pickPhotos, pickVideo } from "@/data/photos";
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
function pickVariant<T>(pool: T[] | undefined, fallback: T, regionIndex: number, salt: number): T {
  if (!pool || pool.length === 0) return fallback;
  const idx = cyclePick(pool.length, regionIndex, salt);
  return pool[idx];
}

function rotateFaqs(pool: { q: string; a: string }[], regionIndex: number, salt = 0) {
  if (pool.length === 0) return [];
  return pickDistinctCombo(pool, regionIndex, 4, salt);
}

function buildContent(svc: any, regionIndex: number) {
  return {
    intro: pickVariant(svc.introVariants, svc.intro, regionIndex, 0),
    extraNote: pickVariant(svc.extraNoteVariants, svc.extraNote, regionIndex, 1),
    scope: pickVariant(svc.scopeVariants, svc.scope, regionIndex, 2),
    causes: pickVariant(svc.causesVariants, svc.causes, regionIndex, 3),
    tips: pickVariant(svc.tipsVariants, svc.tips, regionIndex, 4),
    equipment: pickVariant(svc.equipmentVariants, svc.equipment, regionIndex, 5),
    costInfo: pickVariant(
      svc.costInfoVariants,
      "막힘 정도와 작업 범위에 따라 비용이 달라지기 때문에, 방문 전 상담을 통해 예상 비용을 먼저 안내드리고 현장에서 최종 확인 후 작업을 진행합니다. 숨겨진 추가 비용 없이 투명하게 안내드려요.",
      regionIndex,
      6
    ),
    neglect: pickVariant(
      svc.neglectVariants,
      [
        "막힘이 오래되면 악취가 심해지고 벌레가 발생할 수 있어요.",
        "역류가 시작되면 바닥 침수, 아랫집 피해로 이어질 수 있어요.",
        "초기엔 간단한 작업으로 끝나지만, 방치하면 배관 교체 등 큰 공사가 필요해질 수 있어요.",
      ],
      regionIndex,
      7
    ),
    searchIntent: pickVariant(svc.searchIntentVariants, null, regionIndex, 8) as string | null,
    longtailFaqs: rotateFaqs(svc.longtailFaqs ?? [], regionIndex, 9),
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
  const titleBase = phrase.endsWith("막힘") ? `${reg.name} ${phrase}` : `${reg.name} ${svc.label} ${phrase}`;
  const title = `${titleBase} | ${siteConfig.brand}`;
  const regionIndexForMeta = Object.keys(regions).indexOf(region);
  const introForMeta = pickVariant(svc.introVariants, svc.intro, regionIndexForMeta, 0);
  const description = `${siteConfig.brand}는 ${reg.name} 전 지역(${reg.dongs.slice(0, 3).join("·")} 등) ${svc.label} 출장 서비스를 제공합니다. ${introForMeta}`;
  const ogImage = `${siteConfig.baseUrl}${pickPhotos(service, regionIndexForMeta).hero}`;
  return {
    title,
    description,
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
  const videoSrc = pickVideo(service, regionIndex);
  const content = buildContent(svc, regionIndex);
  const nearby = getNearbyRegions(region);

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
            <PhotoSlot label={`${reg.name} ${svc.label} 작업 사진`} ratio="4/3" src={photos.hero} priority />
          </div>
        </section>

        {/* 원인별 해결방법 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">01</span>
            {svc.label} 원인별 해결방법
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
              출장 가능 동 목록 ({svc.label})
            </h2>
            <p className="mt-2 text-gray-700">{reg.dongs.join(" · ")}</p>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.name)}`}
              target="_blank"
              {siteConfig.brand} {svc.label}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
            >
              🗺️ {reg.name} 전체 지도에서 보기
            </a>
            {(nearby.prev || nearby.next) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#0d2c6b]/10 pt-4 text-sm">
                <span className="font-semibold text-[#0d2c6b]">인근 지역 {svc.label} 안내</span>
                {nearby.prev && (
                  <a
                    href={`/${service}/${nearby.prev}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    ← {regions[nearby.prev as keyof typeof regions].name} {svc.label}
                  </a>
                )}
                {nearby.next && (
                  <a
                    href={`/${service}/${nearby.next}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    {regions[nearby.next as keyof typeof regions].name} {svc.label} →
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 자주 묻는 질문 (롱테일 키워드) */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">02</span>
            {reg.name} {svc.label} 자주 묻는 질문
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
            {svc.label} 예방하는 팁
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
            {svc.label} 작업 장비 소개
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
            {reg.name} {svc.label}, 왜 자주 발생할까요?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">{content.intro}</p>
          <p className="mt-3 leading-relaxed text-gray-700">
            {reg.feature} {reg.feature2}
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">
            이런 환경에서는 <strong className="text-[#0d2c6b]">{reg.problem}</strong>
            로 인한 {svc.label}이 빈번하게 발생합니다.
          </p>
          {reg.seasonalNote && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.seasonalNote}</p>
          )}
          <a
            href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.govOffice)}`}
            target="_blank"
            mainSiteUrls
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
          >
            📍 {reg.govOffice} 위치 보기 (네이버 지도)
          </a>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PhotoSlot label={`${reg.name} ${svc.label} 막힘 전 현장`} ratio="1/1" src={photos.before} />
            <PhotoSlot label={`${reg.name} ${svc.label} 장비로 진단`} ratio="1/1" src={photos.diagnosis} />
            <PhotoSlot label={`${reg.name} ${svc.label} 막힘 후 제거물`} ratio="1/1" src={photos.removed} />
          </div>
        </section>

        {/* 작업 범위 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">06</span>
            {svc.label} 작업 범위
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            {siteConfig.brand}는 {reg.name} 전 지역을 30분 이내 출장하여{" "}
            {content.scope} 신속하게 해결해드립니다.
          </p>
          {reg.localTip && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.localTip}</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label={`${reg.name} ${svc.label} 현장 작업 모습`} ratio="4/3" src={photos.onsiteWork} />
            <PhotoSlot label={`${reg.name} ${svc.label} 내시경 카메라 점검`} ratio="4/3" src={photos.onsiteDiagnosis} />
          </div>
          <div className="mt-5 overflow-hidden rounded-lg">
            <video
              src={videoSrc}
              className="w-full"
              preload="none"
              poster={photos.onsiteWork}
              muted
              playsInline
              controls
            />
            <p className="mt-1 text-center text-xs text-gray-400">실제 출장 작업 영상</p>
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
            <PhotoSlot label={`${reg.name} ${svc.label} 방치된 배관 내부`} ratio="16/9" src={photos.neglectBefore} />
            <PhotoSlot label={`${reg.name} ${svc.label} 실제 제거된 이물질`} ratio="16/9" src={photos.neglectAfter} />
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={siteConfig.mainSiteUrls[service] ?? siteConfig.mainSiteUrls.drain}
              target="_blank"
              rel="noopener nofollow noreferrer"
              className="text-[#0d2c6b] underline"
            >
              {siteConfig.brand} {svc.label} 공식 페이지 바로가기
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

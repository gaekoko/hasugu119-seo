import Link from "next/link";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";

export default function HomePage() {
  const regionEntries = Object.entries(regions).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "ko")
  );
  const serviceEntries = Object.entries(services);

  return (
    <main className="min-h-screen bg-white">
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

      <section className="bg-gradient-to-b from-[#0d2c6b] to-[#1a4fb8] px-5 py-12 text-center text-white">
        <p className="text-sm font-semibold text-orange-300">
          365일 24시간 긴급출동
        </p>
        <h1 className="mt-2 text-3xl font-black italic tracking-tight md:text-4xl">
          {siteConfig.brand} 지역별 출장 안내
        </h1>
        <p className="mt-3 text-base text-blue-100">
          서울·경기·인천·충청 50개 지역, 하수구막힘·싱크대막힘·변기막힘 출장
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10">
        {serviceEntries.map(([serviceKey, svc]) => (
          <div key={serviceKey} className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-[#0d2c6b]">
              {svc.label} 지역별 출장 안내
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {regionEntries.map(([regionKey, region]) => (
                <Link
                  key={regionKey}
                  href={`/${serviceKey}/${regionKey}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm text-gray-700 hover:border-[#0d2c6b] hover:text-[#0d2c6b]"
                >
                  {region.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

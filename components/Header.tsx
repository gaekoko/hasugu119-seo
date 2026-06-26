import Link from "next/link";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";

export default function Header({ currentService }: { currentService?: string }) {
  const serviceEntries = Object.entries(services);
  const currentRegions = Object.entries(regions)
    .sort((a, b) => a[1].name.localeCompare(b[1].name, "ko"))
    .slice(0, 14);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-[#0d2c6b] px-4 py-2 text-center text-xs font-semibold text-white md:text-sm">
        🚨 하수구·싱크대·변기 막힘 | 연중무휴 365일 24시간 긴급출동
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black text-[#0d2c6b]">
            100% <span className="text-orange-500">배관케어</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-bold text-[#0d2c6b] md:flex">
          {serviceEntries.map(([key, svc]) => (
            <div key={key} className="group relative">
              <Link
                href={`/${key}/gangnam`}
                className={`rounded px-3 py-2 hover:bg-gray-100 ${
                  currentService === key ? "text-orange-500" : ""
                }`}
              >
                {svc.label}
              </Link>
              <div className="invisible absolute left-0 top-full z-50 w-56 rounded-md border bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {currentRegions.map(([rKey, r]) => (
                  <Link
                    key={rKey}
                    href={`/${key}/${rKey}`}
                    className="block px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0d2c6b]"
                  >
                    {r.name} {svc.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <a
          href={`tel:${siteConfig.phone}`}
          className="rounded-full bg-[#0d2c6b] px-4 py-2 text-xs font-bold text-white md:text-sm"
        >
          📞 {siteConfig.phone}
        </a>
      </div>
    </header>
  );
}

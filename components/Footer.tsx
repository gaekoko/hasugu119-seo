import { siteConfig } from "@/data/site";

export default function Footer() {
  return (
    <>
      <footer className="bg-[#0a1f4d] px-5 py-8 text-center text-sm text-blue-200">
        <p className="font-bold text-white">100% {siteConfig.brand}</p>
        <p className="mt-2">하수구·싱크대·변기 막힘 출장 전문 | 연중무휴 24시간</p>
        <p className="mt-1">상담전화 {siteConfig.phone}</p>
        <div className="mt-4 space-y-0.5 text-xs text-blue-300">
          <p>회사명: {siteConfig.companyName}</p>
          <p>대표자: {siteConfig.ceo}</p>
          <p>사업자등록번호: {siteConfig.businessNumber}</p>
          <p>대표번호: {siteConfig.phone}</p>
        </div>
        <p className="mt-4 text-xs text-blue-300">
          © {siteConfig.brand}. All rights reserved.
        </p>
      </footer>
      <a
        href={`tel:${siteConfig.phone}`}
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-red-600 py-3 text-center text-base font-bold text-white"
      >
        ☎ 긴급출동 전화 {siteConfig.phone}
      </a>
    </>
  );
}

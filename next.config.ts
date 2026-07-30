import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 정적 export에서는 next/image 최적화 불가 → unoptimized 유지
  // 단, 빌드 산출물 JS/CSS는 압축해서 번들 크기 최소화
  images: { unoptimized: true },
  compiler: {
    // 프로덕션 빌드에서 console.log 제거 → JS 번들 경량화
    removeConsole: process.env.NODE_ENV === "production",
  },
  // 정적 파일 헤더: Netlify에서 캐시 설정은 netlify.toml로 처리
};

export default nextConfig;

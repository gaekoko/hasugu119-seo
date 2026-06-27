import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: `${siteConfig.brand} | 지역별 출장 서비스`,
  description: `${siteConfig.brand} 지역별 하수구막힘·싱크대막힘·변기막힘 출장 서비스 안내`,
  metadataBase: new URL(siteConfig.baseUrl),
  verification: {
    google: "6mbg1z4B9uKa4bpw1H6Op2p9Zk6zFs1fSjuCR53yhwM",
    other: {
      "naver-site-verification": "62d14c44bd105c9710f398daaa360a0f06d87dab",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

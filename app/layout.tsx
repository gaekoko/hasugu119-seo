import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: `${siteConfig.brand} | 지역별 출장 서비스`,
  description: `${siteConfig.brand} 지역별 하수구·싱크대·변기 배관 막힘 출장 서비스 안내. 빠른 출동, 현장 확인 후 견적.`,
  metadataBase: new URL(siteConfig.baseUrl),
  robots: { index: true, follow: true },
  verification: {
    google: "6mbg1z4B9uKa4bpw1H6Op2p9Zk6zFs1fSjuCR53yhwM",
    other: {
      "naver-site-verification": "62d14c44bd105c9710f398daaa360a0f06d87dab",
    },
  },
  openGraph: {
    type: "website",
    title: `${siteConfig.brand} | 지역별 출장 서비스`,
    description: `${siteConfig.brand} 지역별 배관 막힘 출장 서비스 안내`,
    url: siteConfig.baseUrl,
    siteName: siteConfig.brand,
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
            w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),
            dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WTPQL96Q');
          `}
        </Script>
      </head>

      <body className="min-h-full flex flex-col font-sans">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WTPQL96Q"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}

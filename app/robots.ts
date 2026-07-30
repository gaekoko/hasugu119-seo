import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // 네이버 크롤러
      {
        userAgent: "Yeti",
        allow: "/",
      },
      // 구글 AI (Gemini) 크롤러
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      // ChatGPT 크롤러
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      // ChatGPT 검색 크롤러
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
      },
      // Perplexity AI 크롤러
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      // Claude AI 크롤러
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      // Microsoft Copilot 크롤러
      {
        userAgent: "Bingbot",
        allow: "/",
      },
    ],
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
    host: siteConfig.baseUrl,
  };
}

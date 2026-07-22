import type { MetadataRoute } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const urls: MetadataRoute.Sitemap = [
    {
      url: siteConfig.baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // 지역별 페이지 (서비스 인덱스 페이지 없으므로 제외)
  for (const service of Object.keys(services)) {
    for (const region of Object.keys(regions)) {
      urls.push({
        url: `${siteConfig.baseUrl}/${service}/${region}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return urls;
}

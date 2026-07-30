import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const seoPagesEntries: MetadataRoute.Sitemap = Object.keys(SEO_PAGES).map(
    (slug) => ({
      url: `https://margot.rest/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  return [
    {
      url: "https://margot.rest",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://margot.rest/menu",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...seoPagesEntries,
    {
      url: "https://margot.rest/privacidad",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://margot.rest/terminos",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

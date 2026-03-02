import type { MetadataRoute } from "next";

const BASE_URL = "https://www.alexander-ip.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/services",
    "/services/consultation",
    "/services/patent-search",
    "/services/patent-drafting",
    "/services/patent-prosecution",
    "/services/international-filing",
    "/services/fto",
    "/services/custom",
    "/process",
    "/about",
    "/faq",
    "/contact",
    "/portfolio",
    "/returning-clients",
    "/legal/privacy",
    "/legal/terms",
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/services") ? 0.8 : 0.6,
  }));
}

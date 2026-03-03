import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/portal", "/auth", "/api", "/booking"],
      },
    ],
    sitemap: "https://www.alexander-ip.com/sitemap.xml",
  };
}

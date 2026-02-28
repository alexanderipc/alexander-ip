import type { Metadata } from "next";

const siteConfig = {
  name: "Alexander IP Consulting",
  description:
    "Expert patent drafting, office correspondence, and IP strategy. Top-tier training, accessible pricing. Patents granted across the US, UK, Europe, and 140+ jurisdictions via PCT.",
  url: "https://alexander-ip.com",
  author: "Alexander Rowley",
  company: "Alexander IPC Ltd",
};

export function createMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — Patent Protection Without the Corporate Price Tag`;
  const pageDescription = description || siteConfig.description;
  const url = `${siteConfig.url}${path}`;

  return {
    title: pageTitle,
    description: pageDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export { siteConfig };

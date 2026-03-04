import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PatentDiagramBackground from "@/components/ui/PatentDiagramBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title:
    "Alexander IP — Patent Consultancy for Inventors and Innovators",
  description:
    "Alexander IP is a patent consultancy built for inventors and innovators, not corporations. Legal 500-trained specialist offering patent drafting, office correspondence, and international filing with transparent pricing and communication you can actually understand.",
  metadataBase: new URL("https://www.alexander-ip.com"),
  alternates: {
    canonical: "https://www.alexander-ip.com",
  },
  openGraph: {
    title: "Alexander IP — Patent Consultancy for Inventors and Innovators",
    description:
      "Legal 500-trained patent consultancy offering drafting, office correspondence, and international filing. Built for inventors and innovators, not behemoths.",
    url: "https://www.alexander-ip.com",
    siteName: "Alexander IP",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Alexander IP — Patent Services for Inventors & Startups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander IP — Patent Consultancy for Inventors and Innovators",
    description:
      "Legal 500-trained patent consultancy offering drafting, office correspondence, and international filing. Built for inventors and innovators, not behemoths.",
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  verification: {
    google: "taSgKy26DWaKNVAMC6fi0UCkJzWv5rFcOyaWGIZso14",
  },
};

/* ── JSON-LD: Organization + ProfessionalService ──────────── */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["ProfessionalService", "Organization"],
  name: "Alexander IP",
  alternateName: "Alexander IPC Ltd",
  url: "https://www.alexander-ip.com",
  logo: "https://www.alexander-ip.com/images/logo.svg",
  image: "https://www.alexander-ip.com/opengraph-image",
  description:
    "Patent consultancy offering drafting, search, filing, office correspondence, and infringement checks. Built for individual inventors and startups with transparent, fixed-fee pricing.",
  founder: {
    "@type": "Person",
    name: "Alexander Rowley",
    jobTitle: "Patent Consultant",
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "University of Bristol",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "Queen Mary University of London",
      },
    ],
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kington",
    addressCountry: "GB",
  },
  areaServed: [
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "Australia" },
    "Worldwide (155+ PCT contracting states)",
  ],
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    bestRating: "5",
    ratingCount: "800",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Patent Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Patent Consultation", description: "Expert patentability and strategy advice" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Patent Search", description: "Comprehensive prior art search with detailed report" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Patent Drafting", description: "Full utility patent application preparation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Office Correspondence", description: "Strategic responses to patent office actions" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "International Filing", description: "PCT and national phase patent filings worldwide" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Infringement Check", description: "Freedom to operate analysis and risk assessment" } },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <PatentDiagramBackground />
        <Navbar />
        <main className="flex-1 relative z-[2]">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

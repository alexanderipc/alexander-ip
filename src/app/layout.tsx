import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    "Alexander IP Consulting — Patent Protection Without the Corporate Price Tag",
  description:
    "Expert patent drafting, prosecution, and IP strategy. Top-tier training from Legal 500 firms, accessible pricing. Patents granted across the US, UK, Europe, and 140+ jurisdictions via PCT.",
  metadataBase: new URL("https://alexander-ip.com"),
  openGraph: {
    title: "Alexander IP Consulting",
    description:
      "Expert patent drafting, prosecution, and IP strategy. Top-tier training, accessible pricing.",
    url: "https://alexander-ip.com",
    siteName: "Alexander IP Consulting",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander IP Consulting",
    description:
      "Expert patent drafting, prosecution, and IP strategy. Top-tier training, accessible pricing.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        <PatentDiagramBackground />
        <Navbar />
        <main className="flex-1 relative z-[2]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

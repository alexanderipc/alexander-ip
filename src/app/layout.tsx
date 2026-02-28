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
    "Alexander IP — Patent Consultancy for Inventors and Innovators",
  description:
    "Alexander IP is a patent consultancy built for inventors and innovators, not corporations. Legal 500-trained specialist offering patent drafting, office correspondence, and international filing with transparent pricing and communication you can actually understand.",
  metadataBase: new URL("https://alexander-ip.com"),
  openGraph: {
    title: "Alexander IP — Patent Consultancy for Inventors and Innovators",
    description:
      "Legal 500-trained patent consultancy offering drafting, office correspondence, and international filing. Built for inventors and innovators, not behemoths.",
    url: "https://alexander-ip.com",
    siteName: "Alexander IP",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander IP — Patent Consultancy for Inventors and Innovators",
    description:
      "Legal 500-trained patent consultancy offering drafting, office correspondence, and international filing. Built for inventors and innovators, not behemoths.",
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

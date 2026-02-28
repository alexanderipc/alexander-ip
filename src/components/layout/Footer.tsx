import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const footerLinks = {
  services: [
    { label: "Patent Consultation", href: "/services/consultation" },
    { label: "Patent Search", href: "/services/patent-search" },
    { label: "Patent Drafting", href: "/services/patent-drafting" },
    { label: "Office Correspondence", href: "/services/patent-prosecution" },
    { label: "International Filing", href: "/services/international-filing" },
    { label: "FTO / Infringement Check", href: "/services/fto" },
    { label: "Custom Project", href: "/services/custom" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "How It Works", href: "/process" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Returning Clients", href: "/returning-clients" },
    { label: "My Projects", href: "/auth/login" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Engagement", href: "/legal/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-navy text-white relative z-[2]">
      {/* CTA Banner */}
      <div className="border-b border-slate-700">
        <Container className="py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Ready to protect your invention?
              </h3>
              <p className="text-slate-400 text-sm">
                Book a consultation or get started with a patent search today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Button href="/services/consultation" size="md">
                Book a Consultation
              </Button>
              <Button href="/contact" variant="outline" size="md" className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white">
                Get in Touch
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo-white.svg"
                alt="Alexander IP"
                width={180}
                height={32}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Built for inventors and innovators, not behemoths.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>61 Bridge Street, Kington, HR5 3DJ</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a
                  href="mailto:alexanderip.contact@gmail.com"
                  className="hover:text-blue-light transition-colors"
                >
                  alexanderip.contact@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-blue-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-blue-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & External */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-blue-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mt-6 mb-4">
              Also On
            </h3>
            <a
              href="https://www.fiverr.com/alexander_ip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-light transition-colors"
            >
              Fiverr (800+ Reviews)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Alexander IPC Ltd. Company No.
            16080164. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            61 Bridge Street, Kington, England, HR5 3DJ
          </p>
        </div>
      </Container>
    </footer>
  );
}

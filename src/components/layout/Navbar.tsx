"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Patent Consultation", href: "/services/consultation" },
      { label: "Patent Search", href: "/services/patent-search" },
      { label: "Patent Drafting", href: "/services/patent-drafting" },
      { label: "Patent Prosecution", href: "/services/patent-prosecution" },
      { label: "International Filing", href: "/services/international-filing" },
      { label: "IP Valuation", href: "/services/ip-valuation" },
    ],
  },
  { label: "Process", href: "/process" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-original.jpg"
              alt="Alexander IP"
              width={180}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy rounded-md hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Link>
                  {servicesOpen && (
                    <div className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 mt-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-slate-600 hover:text-navy hover:bg-slate-50 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy rounded-md hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Button href="/contact" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-navy"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-navy hover:bg-slate-50 rounded-md"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-1.5 text-sm text-slate-500 hover:text-navy hover:bg-slate-50 rounded-md"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3">
              <Button href="/contact" size="md" className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

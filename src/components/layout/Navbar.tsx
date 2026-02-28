"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  {
    label: "Services & Pricing",
    href: "/services",
    children: [
      { label: "All Services & Pricing", href: "/services" },
      { label: "Patent Consultation", href: "/services/consultation" },
      { label: "Patent Search", href: "/services/patent-search" },
      { label: "Patent Drafting", href: "/services/patent-drafting" },
      { label: "Office Correspondence", href: "/services/patent-prosecution" },
      { label: "International Filing", href: "/services/international-filing" },
      { label: "FTO / Infringement Check", href: "/services/fto" },
      { label: "Custom Project", href: "/services/custom" },
    ],
  },
  { label: "How It Works", href: "/process" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-original.jpg"
              alt="Alexander IP"
              width={270}
              height={54}
              className="h-[54px] w-auto"
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
                  ref={dropdownRef}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setServicesOpen(!servicesOpen)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setServicesOpen(!servicesOpen);
                      }
                      if (e.key === "Escape") setServicesOpen(false);
                    }}
                    aria-expanded={servicesOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy rounded-md hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        servicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {servicesOpen && (
                    <div
                      className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 mt-0.5 z-50"
                      role="menu"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="block px-4 py-2 text-sm text-slate-600 hover:text-navy hover:bg-slate-50 transition-colors"
                          onClick={() => setServicesOpen(false)}
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
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-navy rounded-md hover:bg-slate-50 transition-colors"
            >
              My Projects
            </Link>
            <Button href="/contact" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-navy"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileServicesOpen(!mobileServicesOpen)
                      }
                      className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-slate-600 hover:text-navy hover:bg-slate-50 rounded-md"
                      aria-expanded={mobileServicesOpen}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          mobileServicesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileServicesOpen && (
                      <div className="ml-4 space-y-1 mt-1">
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
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-navy hover:bg-slate-50 rounded-md"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <Link
              href="/auth/login"
              className="block px-3 py-2 text-base font-medium text-slate-500 hover:text-navy hover:bg-slate-50 rounded-md"
              onClick={() => setMobileOpen(false)}
            >
              My Projects
            </Link>
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

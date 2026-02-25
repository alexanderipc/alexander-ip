import { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy | Alexander IP Consulting",
  description: "Privacy policy for Alexander IP Consulting (Alexander IPC Ltd).",
};

export default function PrivacyPage() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <Container size="narrow">
        <h1 className="text-3xl font-bold text-navy mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">
          Last updated: February 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <h2 className="text-xl font-semibold text-navy">1. Who We Are</h2>
          <p>
            This website is operated by Alexander IPC Ltd (Company No.
            16080164), registered at 4 Victoria Square, Bristol, England, BS8
            4EU (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
          </p>

          <h2 className="text-xl font-semibold text-navy">
            2. Information We Collect
          </h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name and email address (via our contact form)</li>
            <li>Country of residence</li>
            <li>
              Information about your invention or IP needs (as described in
              your enquiry)
            </li>
            <li>Referral source and timeline preferences</li>
          </ul>

          <h2 className="text-xl font-semibold text-navy">
            3. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Respond to your enquiries and provide our services</li>
            <li>Communicate with you about your patent applications</li>
            <li>Process payments for our services</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold text-navy">
            4. Data Sharing
          </h2>
          <p>
            We do not sell your personal data. We may share information with:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Patent offices (as required for filing and prosecution of your
              applications)
            </li>
            <li>
              Payment processors (Stripe) for handling payments securely
            </li>
            <li>Local patent representatives in relevant jurisdictions</li>
          </ul>

          <h2 className="text-xl font-semibold text-navy">
            5. Data Retention
          </h2>
          <p>
            We retain your personal data for as long as necessary to provide
            our services and comply with our legal obligations. Patent-related
            records are retained for the duration of the patent lifecycle.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            6. Your Rights
          </h2>
          <p>
            Under the UK GDPR and Data Protection Act 2018, you have the
            right to access, rectify, erase, or restrict processing of your
            personal data. To exercise these rights, please contact us at{" "}
            <a
              href="mailto:hello@alexander-ip.com"
              className="text-blue hover:text-blue-dark"
            >
              hello@alexander-ip.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-navy">
            7. Cookies &amp; Analytics
          </h2>
          <p>
            This website uses privacy-friendly analytics that do not use
            cookies or track personal data. No cookie consent banner is
            required.
          </p>

          <h2 className="text-xl font-semibold text-navy">8. Contact</h2>
          <p>
            For any privacy-related questions, please contact:{" "}
            <a
              href="mailto:hello@alexander-ip.com"
              className="text-blue hover:text-blue-dark"
            >
              hello@alexander-ip.com
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}

import { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms of Engagement | Alexander IP Consulting",
  description:
    "Terms of engagement for patent services provided by Alexander IPC Ltd.",
};

export default function TermsPage() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <Container size="narrow">
        <h1 className="text-3xl font-bold text-navy mb-2">
          Terms of Engagement
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Last updated: February 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <h2 className="text-xl font-semibold text-navy">1. Overview</h2>
          <p>
            These terms govern the provision of patent consulting services by
            Alexander IPC Ltd (Company No. 16080164), registered at 4 Victoria
            Square, Bristol, England, BS8 4EU.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            2. Services Provided
          </h2>
          <p>
            Alexander IPC Ltd provides patent consulting services including
            patent drafting, patent prosecution, prior art searches, patent
            filing, international filing coordination, IP valuations, and
            strategic consultations. The specific scope of each engagement is
            agreed in writing before work commences.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            3. Professional Status
          </h2>
          <p>
            Alexander IPC Ltd provides patent consulting services. Alexander
            Rowley is not a registered patent attorney or patent agent.
            Applications are filed under the client&apos;s name or through
            coordinated local representatives where jurisdictional
            requirements apply.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            4. Confidentiality
          </h2>
          <p>
            All invention disclosures and technical information shared with
            Alexander IPC Ltd are treated as confidential. Non-disclosure
            agreements (NDAs) are provided after engagement has been confirmed
            and before confidential information is submitted.
          </p>

          <h2 className="text-xl font-semibold text-navy">5. Payment</h2>
          <p>
            Payment terms are agreed per engagement. Standard terms are 50%
            upfront to commence work and 50% upon delivery. Government patent
            office fees are payable separately by the client directly to the
            relevant patent office and are not included in service fees unless
            explicitly stated.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            6. Delivery &amp; Revisions
          </h2>
          <p>
            Standard delivery times are specified per service. Rush delivery
            is available at additional cost. All engagements include
            reasonable rounds of revision within the agreed scope.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            7. Limitation of Liability
          </h2>
          <p>
            Alexander IPC Ltd provides professional consulting services in
            good faith and to the best of our ability. We cannot guarantee the
            outcome of any patent application, as ultimate decisions rest with
            the relevant patent office examiners. Our liability is limited to
            the fees paid for the specific service in question.
          </p>

          <h2 className="text-xl font-semibold text-navy">
            8. Governing Law
          </h2>
          <p>
            These terms are governed by and construed in accordance with the
            laws of England and Wales.
          </p>

          <h2 className="text-xl font-semibold text-navy">9. Contact</h2>
          <p>
            For questions about these terms, please contact:{" "}
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

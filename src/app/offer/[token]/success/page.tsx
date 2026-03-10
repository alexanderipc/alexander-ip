import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function OfferSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
          <CheckCircle className="w-20 h-20 text-teal-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-navy mb-3">Payment received</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you! Your project has been created and you will receive an email
            with a link to your project dashboard shortly.
          </p>
          <Link
            href="https://www.alexander-ip.com/auth/login"
            className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Go to My Projects
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Alexander IP &mdash; Patent Drafting & Office Correspondence
        </p>
      </div>
    </div>
  );
}

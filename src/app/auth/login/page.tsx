"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { Mail, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_failed:
    "Your sign-in link has expired or was already used. Please request a new one below.",
  no_code: "Invalid sign-in link. Please request a new one below.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Show error from auth callback redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(
        AUTH_ERROR_MESSAGES[errorParam] ||
          "Something went wrong with sign-in. Please try again."
      );
    }
  }, [searchParams]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-semibold text-navy mb-3">
          Check your email
        </h1>
        <p className="text-slate-600 mb-6">
          A sign-in link has been sent to{" "}
          <span className="font-medium text-navy">{email}</span>. Click the
          link in the email to access your portal.
        </p>
        <p className="text-sm text-slate-400">
          The link expires in 1 hour. Check your spam folder if you
          don&apos;t see it.
        </p>
        <button
          onClick={() => {
            setMagicLinkSent(false);
            setEmail("");
          }}
          className="mt-6 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">
          My Projects
        </h1>
        <p className="text-slate-500">
          Track your projects, view documents, and stay updated.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <form onSubmit={handleMagicLink}>
          <p className="text-sm text-slate-500 mb-6">
            Enter your email address and we&apos;ll send you a secure
            sign-in link. No password needed.
          </p>

          <label
            htmlFor="client-email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email address
          </label>
          <div className="relative mb-6">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="client-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 mb-4 bg-red-50 px-4 py-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>
                Send sign-in link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Container size="narrow">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
                <div className="h-4 bg-slate-200 rounded w-64 mx-auto mb-8" />
                <div className="bg-white rounded-2xl border border-slate-200 p-8 h-64" />
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </Container>
    </main>
  );
}

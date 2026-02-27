"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";
import { Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

type Tab = "client" | "admin";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "/auth/callback";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Get redirect from URL params or default to /admin
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/admin";
      window.location.href = redirect;
    }
  }

  if (magicLinkSent) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
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
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Client Portal</h1>
            <p className="text-slate-500">
              Track your projects, view documents, and stay updated.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              onClick={() => {
                setTab("client");
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === "client"
                  ? "bg-white text-navy shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Client Login
            </button>
            <button
              onClick={() => {
                setTab("admin");
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === "admin"
                  ? "bg-white text-navy shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            {tab === "client" ? (
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
                  <p className="text-sm text-red-600 mb-4">{error}</p>
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
            ) : (
              <form onSubmit={handlePasswordLogin}>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@alexander-ip.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>

                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative mb-6">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-navy text-white font-medium hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}

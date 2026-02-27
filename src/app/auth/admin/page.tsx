"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

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
      window.location.href = "/admin";
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Admin</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
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
          </div>
        </div>
      </Container>
    </main>
  );
}

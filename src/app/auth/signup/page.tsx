"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create account via API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      // 2. Sign in with the new credentials
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account created but sign-in failed — redirect to login
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/portal";
      }, 800);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <Container size="narrow">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-semibold text-navy mb-3">
              Account created
            </h1>
            <p className="text-slate-600">
              Redirecting to your portal...
            </p>
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
            <h1 className="text-3xl font-bold text-navy mb-2">
              Create an account
            </h1>
            <p className="text-slate-500">
              Set up a password to access your portal. Works for new and returning clients.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="signup-confirm"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
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
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}

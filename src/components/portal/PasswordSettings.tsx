"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function PasswordSettings() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-navy mb-2">Password</h2>
      <p className="text-sm text-slate-500 mb-4">
        Set or change your password. You can use either a password or magic
        link to sign in.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Password updated successfully
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

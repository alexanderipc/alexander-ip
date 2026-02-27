"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * /auth/verify — handles magic link token verification on the client side.
 * The magic link email contains a URL like:
 *   /auth/verify?token_hash=xxx&type=magiclink
 *
 * On mount, this page calls supabase.auth.verifyOtp() to create a session,
 * then redirects to /portal or /admin based on user role.
 */
function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "magiclink" | "email";

      if (!tokenHash) {
        setStatus("error");
        setErrorMsg("Invalid or expired link. Please request a new one.");
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type || "magiclink",
      });

      if (error) {
        console.error("Verify OTP error:", error);
        setStatus("error");
        setErrorMsg(
          error.message.includes("expired")
            ? "This link has expired. Please request a new one."
            : "Verification failed. Please request a new sign-in link."
        );
        return;
      }

      // Session established — check role to redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setStatus("success");

        // Brief delay so the user sees the success state
        setTimeout(() => {
          if (profile?.role === "admin") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/portal";
          }
        }, 800);
      } else {
        setStatus("error");
        setErrorMsg("Verification failed. Please try again.");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
      {status === "verifying" && (
        <>
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-navy mb-2">
            Signing you in...
          </h1>
          <p className="text-slate-500 text-sm">
            Please wait while we verify your link.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-xl font-semibold text-navy mb-2">
            Signed in!
          </h1>
          <p className="text-slate-500 text-sm">
            Redirecting to your portal...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-navy mb-2">
            Unable to sign in
          </h1>
          <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to login
          </a>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Container size="narrow">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-navy mb-2">
                Signing you in...
              </h1>
              <p className="text-slate-500 text-sm">
                Please wait while we verify your link.
              </p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </Container>
    </main>
  );
}

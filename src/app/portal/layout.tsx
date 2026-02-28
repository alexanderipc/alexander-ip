import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import Link from "next/link";
import { LayoutDashboard, CalendarDays, LogOut, Settings } from "lucide-react";

export const metadata = {
  title: "My Projects — Alexander IP",
  description: "Track your patent projects, view documents, and stay updated.",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/portal");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const displayName = profile?.name || user.email?.split("@")[0] || "Client";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Portal sub-nav */}
      <div className="bg-white border-b border-slate-200">
        <Container>
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/portal"
                className="flex items-center gap-2 text-navy font-semibold text-sm hover:text-blue-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                My Projects
              </Link>
              <Link
                href="/portal/calendar"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                Calendar
              </Link>
              <Link
                href="/portal/settings"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-slate-500 hover:text-navy transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {displayName}
              </span>
              <a
                href="/auth/signout"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Page content */}
      <Container>
        <div className="py-8">{children}</div>
      </Container>
    </div>
  );
}

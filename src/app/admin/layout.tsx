import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderPlus,
  Users,
  LogOut,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Admin — Alexander IP",
  description: "Manage client projects, track deadlines, and update statuses.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin nav bar */}
      <div className="bg-navy text-white">
        <Container>
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white font-semibold text-sm hover:text-blue-200 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/projects/new"
                className="flex items-center gap-2 text-slate-300 text-sm hover:text-white transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                New Project
              </Link>
              <Link
                href="/admin/clients"
                className="flex items-center gap-2 text-slate-300 text-sm hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                Clients
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                View Site <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-sm text-slate-400">
                {profile?.name || user.email}
              </span>
              <a
                href="/auth/signout"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
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

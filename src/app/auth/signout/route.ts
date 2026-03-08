import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST-only signout prevents CSRF logout via <img src="/auth/signout">
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}

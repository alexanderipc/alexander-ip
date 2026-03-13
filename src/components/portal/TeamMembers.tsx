"use client";

import { useState, useTransition } from "react";
import { inviteTeamMember, removeTeamMember } from "@/app/portal/actions";
import { UserPlus, X, Crown, User } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "member";
  name: string | null;
  email: string | null;
}

interface TeamMembersProps {
  projectId: string;
  members: Member[];
  isOwner: boolean;
}

export default function TeamMembers({ projectId, members, isOwner }: TeamMembersProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        await inviteTeamMember(projectId, email);
        setEmail("");
        setSuccess("Team member invited successfully");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function handleRemove(memberId: string) {
    setError("");
    startTransition(async () => {
      try {
        await removeTeamMember(projectId, memberId);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div>
      {/* Member list */}
      <div className="space-y-2 mb-4">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              {m.role === "owner" ? (
                <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                  {m.name || m.email}
                </p>
                {m.name && (
                  <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-slate-400 capitalize">{m.role}</span>
              {isOwner && m.role !== "owner" && (
                <button
                  onClick={() => handleRemove(m.user_id)}
                  disabled={isPending}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove member"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite form (owner only) */}
      {isOwner && (
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="team@example.com"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={isPending || !email}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 mt-2">{success}</p>
      )}
    </div>
  );
}

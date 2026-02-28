"use client";

import { useState, useTransition } from "react";
import {
  addMilestone,
  completeMilestone,
  uncompleteMilestone,
  deleteMilestone,
} from "@/app/admin/actions";
import {
  Plus,
  Check,
  RotateCcw,
  Trash2,
  Calendar,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  target_date: string | null;
  completed_date: string | null;
  is_client_visible: boolean;
}

interface MilestoneManagerProps {
  projectId: string;
  milestones: Milestone[];
}

export default function MilestoneManager({
  projectId,
  milestones,
}: MilestoneManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [clientVisible, setClientVisible] = useState(true);

  function handleAdd() {
    if (!title.trim()) return;
    startTransition(async () => {
      await addMilestone(
        projectId,
        title.trim(),
        targetDate || null,
        clientVisible
      );
      setTitle("");
      setTargetDate("");
      setClientVisible(true);
      setShowForm(false);
    });
  }

  function handleComplete(milestoneId: string) {
    startTransition(async () => {
      await completeMilestone(milestoneId, projectId);
    });
  }

  function handleUncomplete(milestoneId: string) {
    startTransition(async () => {
      await uncompleteMilestone(milestoneId, projectId);
    });
  }

  function handleDelete(milestoneId: string) {
    startTransition(async () => {
      await deleteMilestone(milestoneId, projectId);
    });
  }

  return (
    <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
      {/* Milestone list */}
      {milestones.length > 0 ? (
        <div className="space-y-2 mb-4">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 p-2 rounded-lg border ${
                m.completed_date
                  ? "bg-green-50/50 border-green-200"
                  : "bg-white border-slate-200"
              }`}
            >
              {/* Complete/uncomplete button */}
              <button
                type="button"
                onClick={() =>
                  m.completed_date
                    ? handleUncomplete(m.id)
                    : handleComplete(m.id)
                }
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
                  m.completed_date
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                {m.completed_date && <Check className="w-3 h-3" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    m.completed_date
                      ? "text-slate-400 line-through"
                      : "text-navy font-medium"
                  }`}
                >
                  {m.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {m.target_date && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(m.target_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  {!m.is_client_visible && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Admin only
                    </span>
                  )}
                  {m.completed_date && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      Done{" "}
                      {new Date(m.completed_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {m.completed_date && (
                  <button
                    type="button"
                    onClick={() => handleUncomplete(m.id)}
                    className="text-slate-400 hover:text-blue-500 p-1"
                    title="Mark incomplete"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Delete milestone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic mb-4">
          No milestones yet.
        </p>
      )}

      {/* Add milestone form */}
      {showForm ? (
        <div className="space-y-2 border border-slate-200 rounded-lg p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone title"
            className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm text-navy placeholder:text-slate-400"
            autoFocus
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm text-navy"
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={clientVisible}
              onChange={(e) => setClientVisible(e.target.checked)}
              className="rounded border-slate-300"
            />
            Client visible
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!title.trim()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
            >
              Add Milestone
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setTargetDate("");
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Milestone
        </button>
      )}
    </div>
  );
}

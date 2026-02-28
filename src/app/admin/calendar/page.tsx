import Calendar from "@/components/admin/Calendar";

export const metadata = {
  title: "Calendar — Alexander IP Admin",
  description: "View project deadlines and milestones at a glance.",
};

export default function CalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Calendar</h1>
        <p className="text-slate-500 mt-1">
          Project deadlines and milestones at a glance.
        </p>
      </div>
      <Calendar />
    </div>
  );
}

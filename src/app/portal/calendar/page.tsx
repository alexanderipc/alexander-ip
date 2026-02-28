import ClientCalendar from "@/components/portal/ClientCalendar";

export const metadata = {
  title: "Calendar — Alexander IP",
  description: "View your project deadlines and milestones at a glance.",
};

export default function ClientCalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Calendar</h1>
        <p className="text-slate-500 mt-1">
          Your project deadlines and milestones at a glance.
        </p>
      </div>
      <ClientCalendar />
    </div>
  );
}

"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  ExternalLink,
} from "lucide-react";
import {
  getClientCalendarData,
  type ClientCalendarEvent,
} from "@/app/portal/actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getUrgency(dateStr: string): "overdue" | "urgent" | "normal" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "overdue";
  if (diff <= 7) return "urgent";
  return "normal";
}

const DOT_COLORS = {
  overdue: "bg-red-500",
  urgent: "bg-amber-500",
  normal: "bg-blue-500",
};

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
  events: ClientCalendarEvent[];
}

function buildCalendarDays(
  year: number,
  month: number,
  events: ClientCalendarEvent[]
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  // Previous month fill
  const prevLast = new Date(year, month, 0);
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevLast.getDate() - i;
    const m = month - 1 < 0 ? 11 : month - 1;
    const y = month - 1 < 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      date: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isToday: false,
      dateStr,
      events: events.filter((e) => e.date === dateStr),
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dateObj = new Date(year, month, d);
    days.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateObj.getTime() === today.getTime(),
      dateStr,
      events: events.filter((e) => e.date === dateStr),
    });
  }

  // Next month fill
  const remainder = days.length % 7;
  if (remainder > 0) {
    const fill = 7 - remainder;
    for (let d = 1; d <= fill; d++) {
      const m = month + 1 > 11 ? 0 : month + 1;
      const y = month + 1 > 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        dateStr,
        events: events.filter((e) => e.date === dateStr),
      });
    }
  }

  return days;
}

export default function ClientCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<ClientCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fetchMonth(y: number, m: number) {
    startTransition(async () => {
      try {
        const data = await getClientCalendarData(y, m + 1);
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
        setEvents([]);
      }
    });
  }

  useEffect(() => {
    fetchMonth(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function goToPrev() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function goToNext() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(null);
  }

  const days = buildCalendarDays(year, month, events);
  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-navy">
            {MONTHS[month]} {year}
          </h2>
          {isPending && (
            <span className="text-xs text-slate-400">Loading...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrev}
            className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const hasEvents = day.events.length > 0;
            const isSelected = selectedDate === day.dateStr;

            return (
              <button
                key={i}
                onClick={() =>
                  setSelectedDate(isSelected ? null : day.dateStr)
                }
                className={`relative min-h-[80px] p-2 border-b border-r border-slate-100 text-left transition-colors ${
                  day.isCurrentMonth
                    ? "bg-white hover:bg-slate-50"
                    : "bg-slate-50/50"
                } ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                    day.isToday
                      ? "bg-blue-600 text-white font-bold"
                      : day.isCurrentMonth
                      ? "text-navy font-medium"
                      : "text-slate-300"
                  }`}
                >
                  {day.date}
                </span>

                {/* Event dots */}
                {hasEvents && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {day.events.slice(0, 4).map((ev) => {
                      const urgency = getUrgency(ev.date);
                      return (
                        <span
                          key={ev.id}
                          className={`w-2 h-2 rounded-full ${DOT_COLORS[urgency]}`}
                          title={ev.title}
                        />
                      );
                    })}
                    {day.events.length > 4 && (
                      <span className="text-[10px] text-slate-400">
                        +{day.events.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Overdue
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Due within 7 days
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          Normal
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No events on this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((ev) => {
                const urgency = getUrgency(ev.date);
                return (
                  <li key={ev.id}>
                    <Link
                      href={`/portal/projects/${ev.projectId}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-slate-50 ${
                        urgency === "overdue"
                          ? "border-red-200 bg-red-50/50"
                          : urgency === "urgent"
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="mt-0.5">
                        {ev.type === "deadline" ? (
                          <Clock
                            className={`w-4 h-4 ${
                              urgency === "overdue"
                                ? "text-red-500"
                                : urgency === "urgent"
                                ? "text-amber-500"
                                : "text-blue-500"
                            }`}
                          />
                        ) : (
                          <Target
                            className={`w-4 h-4 ${
                              urgency === "overdue"
                                ? "text-red-500"
                                : urgency === "urgent"
                                ? "text-amber-500"
                                : "text-blue-500"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ev.type === "deadline"
                            ? "Project deadline"
                            : "Milestone"}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

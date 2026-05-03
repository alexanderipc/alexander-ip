/**
 * Thin Google Calendar API wrapper for the booking flow.
 *
 * Uses an OAuth refresh token (one-time setup by the host) to read freeBusy
 * data and create events with auto-generated Google Meet links. If the
 * environment variables aren't configured, every helper returns a "disabled"
 * response so the booking flow degrades gracefully — bookings still go to
 * the database and Resend confirmations still send.
 *
 * Required env vars:
 *  - GOOGLE_CLIENT_ID
 *  - GOOGLE_CLIENT_SECRET
 *  - GOOGLE_REFRESH_TOKEN  (obtained once via consent flow)
 *  - BOOKING_HOST_EMAIL    (the calendar owner's email; defaults to admin)
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const HOST_EMAIL_FALLBACK = "alexanderip.contact@gmail.com";

interface BusyWindow {
  startUtc: string;
  endUtc: string;
}

interface CreatedEvent {
  eventId: string;
  meetUrl: string | null;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

function hostEmail(): string {
  return process.env.BOOKING_HOST_EMAIL || HOST_EMAIL_FALLBACK;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

/**
 * Returns the busy windows on the host calendar between two UTC instants.
 * Returns [] if Google is not configured (caller treats as "no extra busy").
 */
export async function getBusyWindows(
  startUtc: Date,
  endUtc: Date
): Promise<BusyWindow[]> {
  if (!isGoogleCalendarConfigured()) return [];

  const token = await getAccessToken();
  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: startUtc.toISOString(),
      timeMax: endUtc.toISOString(),
      timeZone: "Europe/London",
      items: [{ id: hostEmail() }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[booking] freeBusy failed: ${res.status} ${text}`);
    return [];
  }

  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  const busy = data.calendars?.[hostEmail()]?.busy ?? [];
  return busy.map((b) => ({ startUtc: b.start, endUtc: b.end }));
}

/**
 * Create a Google Calendar event with auto-generated Meet link.
 * Sends invites to all attendees via Google's standard mechanism (sendUpdates=all).
 * Returns null if Google is not configured.
 */
export async function createBookingEvent(params: {
  startUtc: Date;
  durationMinutes: number;
  leadEmail: string;
  leadName: string;
  topic: string | null;
}): Promise<CreatedEvent | null> {
  if (!isGoogleCalendarConfigured()) return null;

  const token = await getAccessToken();
  const endUtc = new Date(params.startUtc.getTime() + params.durationMinutes * 60_000);
  const requestId = `book-${params.startUtc.getTime()}-${Math.random().toString(36).slice(2, 10)}`;

  const summary = `Intro call — Alexander IP & ${params.leadName}`;
  const descriptionLines = [
    `Free 15-minute intro call.`,
    ``,
    `Lead: ${params.leadName} <${params.leadEmail}>`,
  ];
  if (params.topic) {
    descriptionLines.push(``, `What they want to discuss:`, params.topic);
  }
  descriptionLines.push(
    ``,
    `Booked via https://www.alexander-ip.com/book-call`
  );

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(hostEmail())}/events?sendUpdates=all&conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description: descriptionLines.join("\n"),
        start: { dateTime: params.startUtc.toISOString(), timeZone: "Europe/London" },
        end: { dateTime: endUtc.toISOString(), timeZone: "Europe/London" },
        attendees: [{ email: params.leadEmail, displayName: params.leadName }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google event creation failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };

  // Prefer top-level hangoutLink; fall back to conferenceData entry points
  const meetUrl =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    null;

  return { eventId: data.id, meetUrl };
}

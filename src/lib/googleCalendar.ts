import { requestGoogleAccessToken } from './googleAuth';
import type { GeminiStudyPlan, StudyPlanItem, StudySessionLog } from './studyLogic';

export const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

export interface CalendarListItem {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
  description?: string;
}

export interface CalendarEventDraft {
  dateKey: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  tracklioKey: string;
  source: 'session' | 'plan';
}

const calendarApiUrl = (path: string) => `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}${path}`;

const buildDateTime = (dateKey: string, timeText: string) => {
  const [hoursText, minutesText] = timeText.split(':');
  const hours = Number.parseInt(hoursText ?? '0', 10);
  const minutes = Number.parseInt(minutesText ?? '0', 10);
  const value = new Date(`${dateKey}T00:00:00`);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
};

const authHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

const toCalendarEvent = (draft: CalendarEventDraft) => ({
  summary: draft.title,
  description: draft.description,
  start: { dateTime: buildDateTime(draft.dateKey, draft.startTime) },
  end: { dateTime: buildDateTime(draft.dateKey, draft.endTime) },
  extendedProperties: {
    private: {
      tracklioKey: draft.tracklioKey,
      tracklioSource: draft.source,
    },
  },
});

const requestCalendar = async (accessToken: string, path: string, init?: RequestInit) => {
  const response = await fetch(calendarApiUrl(path), {
    ...init,
    headers: {
      ...authHeaders(accessToken),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Google Calendar request failed.');
  }

  return response;
};

export const upsertCalendarEventWithToken = async (accessToken: string, draft: CalendarEventDraft) => {
  const listResponse = await requestCalendar(
    accessToken,
    `/events?privateExtendedProperty=tracklioKey%3D${encodeURIComponent(draft.tracklioKey)}&singleEvents=true&maxResults=1`
  );
  const listJson = await listResponse.json() as { items?: CalendarListItem[] };
  const eventBody = toCalendarEvent(draft);

  if (listJson.items && listJson.items.length > 0) {
    const existingEvent = listJson.items[0];
    const updateResponse = await requestCalendar(accessToken, `/events/${encodeURIComponent(existingEvent.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(eventBody),
    });

    return updateResponse.json() as Promise<CalendarListItem>;
  }

  const createResponse = await requestCalendar(accessToken, '/events', {
    method: 'POST',
    body: JSON.stringify(eventBody),
  });

  return createResponse.json() as Promise<CalendarListItem>;
};

export const fetchUpcomingTracklioEventsWithToken = async (accessToken: string, daysAhead = 7) => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  const response = await requestCalendar(
    accessToken,
    `/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=20`
  );
  const payload = await response.json() as { items?: CalendarListItem[] };

  return (payload.items ?? []).filter((event) => event.extendedProperties?.private?.tracklioKey);
};

export const requestTracklioCalendarToken = async (clientId: string) => requestGoogleAccessToken(clientId, CALENDAR_SCOPE);

export const fetchUpcomingTracklioEvents = async (clientId: string, daysAhead = 7) => {
  const accessToken = (await requestTracklioCalendarToken(clientId)).accessToken;
  return fetchUpcomingTracklioEventsWithToken(accessToken, daysAhead);
};

const buildPlannedStudyDrafts = (plan: GeminiStudyPlan): CalendarEventDraft[] => plan.schedule.map((item: StudyPlanItem) => ({
  dateKey: item.dateKey,
  title: `Tracklio Plan • ${item.subject}`,
  description: [item.focus, item.note].filter(Boolean).join(' • '),
  startTime: item.startTime,
  endTime: item.endTime,
  tracklioKey: `plan:${item.dateKey}:${item.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  source: 'plan',
}));

export const syncTomorrowPlanToCalendarWithToken = async (accessToken: string, plan: GeminiStudyPlan) => {
  const results = [] as CalendarListItem[];

  for (const draft of buildPlannedStudyDrafts(plan)) {
    const event = await upsertCalendarEventWithToken(accessToken, draft);
    results.push(event);
  }

  return results;
};

export const syncTomorrowPlanToCalendar = async (clientId: string, plan: GeminiStudyPlan) => {
  const accessToken = (await requestTracklioCalendarToken(clientId)).accessToken;
  return syncTomorrowPlanToCalendarWithToken(accessToken, plan);
};

export const buildStudySessionDraft = (session: StudySessionLog): CalendarEventDraft => ({
  dateKey: session.dateKey,
  title: session.source === 'subject' && session.subjectName
    ? `Tracklio Study • ${session.subjectName}`
    : 'Tracklio Study Session',
  description: session.source === 'subject' && session.subjectName
    ? `${session.hours.toFixed(1)}h focused on ${session.subjectName}`
    : `${session.hours.toFixed(1)}h logged in Tracklio`,
  startTime: '18:00',
  endTime: (() => {
    const minutes = Math.max(30, Math.round(session.hours * 60));
    const finish = new Date(`${session.dateKey}T18:00:00`);
    finish.setMinutes(finish.getMinutes() + minutes);
    return finish.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  })(),
  tracklioKey: `${session.source}:${session.dateKey}:${session.subjectId || session.subjectName || 'general'}`,
  source: 'session',
});

export const syncStudySessionEventWithToken = async (accessToken: string, draft: CalendarEventDraft) => upsertCalendarEventWithToken(accessToken, draft);

export const syncStudySessionEvent = async (clientId: string, draft: CalendarEventDraft) => {
  const accessToken = (await requestTracklioCalendarToken(clientId)).accessToken;
  return upsertCalendarEventWithToken(accessToken, draft);
};

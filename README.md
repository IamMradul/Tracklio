# Tracklio

Tracklio is a student productivity assistant that helps users track study time, spot weak subjects, get personalized AI guidance, and turn study intent into calendar plans.

## Chosen Vertical

**Student Productivity Assistant**

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Gemini API
- Google Calendar API

## What Tracklio Does

- GitHub-style study heatmap for daily study activity
- Subject tracking with progress, targets, and completion status
- Study insights for streaks, weekly totals, and subject trends
- Gemini-powered study assistant with context-aware coaching
- Google Calendar sync for study sessions and tomorrow planning

## Approach & Logic

### Gemini AI Assistant

Tracklio builds a live study context from the user’s current data before every Gemini request. That context includes total hours, today’s hours, weekly hours, streaks, weak subjects, strong subjects, and recent activity patterns. The prompt builder injects this context into every request so Gemini can give personalized advice instead of generic study tips.

The assistant can:

- identify weak subjects that need attention
- generate motivational nudges when a streak is at risk
- suggest realistic study blocks for tomorrow
- answer study questions using the user’s actual study history

### Google Calendar Integration

When a user logs a study session, Tracklio creates or updates a matching Google Calendar event using the Google Calendar API. Logged sessions are stored with a stable Tracklio key so the app can sync them without duplicating entries.

The “Plan Tomorrow” action asks Gemini for a structured schedule, converts that plan into calendar events, and syncs those events into Google Calendar. The dashboard also reads upcoming Tracklio calendar events back from Google Calendar and shows them inside the app.

### Supabase Storage

Supabase handles authentication and persistence. The app uses Supabase Auth for email/password, magic link, and session restoration. User progress is stored in the `user_progress` table as JSON payloads, so the dashboard can reload subjects, study logs, reminders, resources, and exam data across sessions.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_ID=primary
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GEMINI_MODEL=gemini-1.5-flash
```

## Local Setup

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## Supabase Schema

Run `supabase/user_progress.sql` in the Supabase SQL editor.

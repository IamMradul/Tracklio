import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { signInWithGoogleDirect } from '../lib/googleAuth';
import { applyStudySessionLog, toDateKey, type StudySessionLog } from '../lib/studyLogic';

// --- Types ---
export interface Subject {
  id: string;
  name: string;
  progress: number;
  totalHours: number;
  targetHours: number;
  status: 'on track' | 'progressing' | 'needs focus';
  color: string;
  studyDates: string[]; // e.g., '2026-04-12'
  dailyHours: Record<string, number>; // date "YYYY-MM-DD" -> hours for this subject
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  timeStr: string;
  type: 'warning' | 'info' | 'success';
}

export interface ResourceItem {
  id: string;
  title: string;
  tag: string;
  color: string;
}

export interface ExamItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface SessionLog {
  id: string;
  subjectId?: string;
  subjectName?: string;
  startTime: string; // ISO string
  durationMinutes: number;
  quality: number; // 1-5 stars
}

export interface AppData {
  isLoggedIn: boolean;
  user: { name: string; avatar: string } | null;
  subjects: Subject[];
  activityData: Record<string, number>; // date "YYYY-MM-DD" -> hours
  activityDataMode: 'hours';
  reminders: Reminder[];
  resources: ResourceItem[];
  exams: ExamItem[];
  weeklyTargetHours: number;
  dailyTargetHours: number;
  pomodoroSettings: PomodoroSettings;
  sessionLogs: SessionLog[];
}

type ProgressPayload = Pick<AppData, 'subjects' | 'activityData' | 'activityDataMode' | 'reminders' | 'resources' | 'exams' | 'weeklyTargetHours' | 'dailyTargetHours' | 'pomodoroSettings' | 'sessionLogs'>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const defaultData: AppData = {
  isLoggedIn: false,
  user: null,
  subjects: [],
  activityData: {},
  activityDataMode: 'hours',
  reminders: [],
  resources: [],
  exams: [],
  weeklyTargetHours: 40,
  dailyTargetHours: 4,
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  },
  sessionLogs: [],
};

interface DataContextType {
  data: AppData;
  authMode: 'supabase-email' | 'local';
  isGoogleDirectEnabled: boolean;
  isAuthLoading: boolean;
  authPromptMessage: string | null;
  requestAuthPrompt: (message?: string) => void;
  dismissAuthPrompt: () => void;
  signInWithGoogle: () => Promise<{ ok: boolean; message: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
  requestEmailSignIn: (email: string) => Promise<{ ok: boolean; message: string }>;
  login: (name: string) => void;
  logout: () => Promise<void>;
  updateData: (newData: Partial<AppData>) => void;
  logStudySession: (session: StudySessionLog) => Promise<AuthResult>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'tracklio_data';
type AuthResult = { ok: boolean; message: string };

const GOOGLE_SESSION_KEY = 'tracklio_google_session';

type GoogleSession = {
  email: string;
  name: string;
  avatar: string;
  accessToken?: string;
  expiresAt?: number;
  scope?: string;
};

const toProgressPayload = (state: AppData): ProgressPayload => ({
  subjects: state.subjects,
  activityData: state.activityData,
  activityDataMode: state.activityDataMode,
  reminders: state.reminders,
  resources: state.resources,
  exams: state.exams,
  weeklyTargetHours: state.weeklyTargetHours,
  dailyTargetHours: state.dailyTargetHours,
  pomodoroSettings: state.pomodoroSettings,
  sessionLogs: state.sessionLogs,
});

const sanitizeProgressPayload = (rawPayload: unknown): Partial<ProgressPayload> => {
  if (!rawPayload || typeof rawPayload !== 'object') return {};
  const payload = rawPayload as Partial<ProgressPayload>;
  return {
    subjects: Array.isArray(payload.subjects) ? payload.subjects : undefined,
    activityData: payload.activityData && typeof payload.activityData === 'object'
      ? (payload.activityData as Record<string, number>)
      : undefined,
    activityDataMode: payload.activityDataMode === 'hours' ? 'hours' : undefined,
    reminders: Array.isArray(payload.reminders) ? payload.reminders : undefined,
    resources: Array.isArray(payload.resources) ? payload.resources : undefined,
    exams: Array.isArray(payload.exams) ? payload.exams : undefined,
    weeklyTargetHours: typeof payload.weeklyTargetHours === 'number' ? payload.weeklyTargetHours : undefined,
    dailyTargetHours:  typeof payload.dailyTargetHours  === 'number' ? payload.dailyTargetHours  : undefined,
    pomodoroSettings:  isRecord(payload.pomodoroSettings) ? {
      workDuration:       typeof payload.pomodoroSettings.workDuration       === 'number' ? payload.pomodoroSettings.workDuration       : 25,
      shortBreakDuration: typeof payload.pomodoroSettings.shortBreakDuration === 'number' ? payload.pomodoroSettings.shortBreakDuration : 5,
      longBreakDuration:  typeof payload.pomodoroSettings.longBreakDuration  === 'number' ? payload.pomodoroSettings.longBreakDuration  : 15,
    } : undefined,
    sessionLogs: Array.isArray(payload.sessionLogs) ? payload.sessionLogs : undefined,
  };
};

const normalizeActivityData = (activityData: unknown, mode: unknown): Record<string, number> => {
  if (!isRecord(activityData)) return {};
  const isHoursMode = mode === 'hours';
  const normalizedEntries = Object.entries(activityData)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
    .map(([dateKey, value]) => {
      if (isHoursMode) return [dateKey, value] as const;
      const legacyValue = value >= 0 && value <= 4 && Number.isInteger(value) ? value * 1.5 : value;
      return [dateKey, legacyValue] as const;
    });
  return Object.fromEntries(normalizedEntries) as Record<string, number>;
};

const normalizeSubjects = (subjects: unknown): Subject[] => {
  if (!Array.isArray(subjects)) return [];

  const toStatus = (progress: number): Subject['status'] => {
    if (progress >= 100) return 'on track';
    if (progress >= 50) return 'progressing';
    return 'needs focus';
  };

  return subjects.filter(isRecord).map((subject, index) => {
    const id = typeof subject.id === 'string' && subject.id.trim() ? subject.id : crypto.randomUUID();
    const name = typeof subject.name === 'string' && subject.name.trim() ? subject.name : `Subject ${index + 1}`;
    const color = typeof subject.color === 'string' && subject.color.trim() ? subject.color : '#5f8dff';
    const targetHours = typeof subject.targetHours === 'number' && Number.isFinite(subject.targetHours) && subject.targetHours > 0
      ? Number(subject.targetHours.toFixed(1))
      : 40;

    const dailyHours = isRecord(subject.dailyHours)
      ? Object.fromEntries(
        Object.entries(subject.dailyHours)
          .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
          .map(([dateKey, hours]) => [dateKey, Number(hours.toFixed(1))])
      ) as Record<string, number>
      : {};

    const legacyDates = Array.isArray(subject.studyDates)
      ? subject.studyDates.filter((value): value is string => typeof value === 'string')
      : [];

    for (const dateKey of legacyDates) {
      if (!dailyHours[dateKey]) dailyHours[dateKey] = 1.5;
    }

    const totalHoursRaw = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);
    const totalHours = Number(totalHoursRaw.toFixed(1));
    const progress = Math.min(100, Math.round((totalHours / targetHours) * 100));
    const status = toStatus(progress);
    const studyDates = Object.entries(dailyHours)
      .filter(([, hours]) => hours > 0)
      .map(([dateKey]) => dateKey)
      .sort();

    return { id, name, progress, totalHours, targetHours, status, color, studyDates, dailyHours };
  });
};

const normalizeAppData = (rawData: unknown): AppData => {
  const candidate = isRecord(rawData) ? rawData : {};
  const user = isRecord(candidate.user)
    ? {
      name: typeof candidate.user.name === 'string' ? candidate.user.name : '',
      avatar: typeof candidate.user.avatar === 'string' ? candidate.user.avatar : '',
    }
    : null;

  return {
    ...defaultData,
    isLoggedIn: typeof candidate.isLoggedIn === 'boolean' ? candidate.isLoggedIn : defaultData.isLoggedIn,
    user,
    subjects: normalizeSubjects(candidate.subjects),
    activityData: normalizeActivityData(candidate.activityData, candidate.activityDataMode),
    activityDataMode: 'hours',
    reminders: Array.isArray(candidate.reminders) ? candidate.reminders as Reminder[] : defaultData.reminders,
    resources: Array.isArray(candidate.resources) ? candidate.resources as ResourceItem[] : defaultData.resources,
    exams: Array.isArray(candidate.exams) ? candidate.exams as ExamItem[] : defaultData.exams,
    weeklyTargetHours: typeof candidate.weeklyTargetHours === 'number' ? candidate.weeklyTargetHours : defaultData.weeklyTargetHours,
    dailyTargetHours:  typeof candidate.dailyTargetHours  === 'number' && candidate.dailyTargetHours > 0
      ? candidate.dailyTargetHours
      : defaultData.dailyTargetHours,
    pomodoroSettings: isRecord(candidate.pomodoroSettings) ? {
      workDuration:       typeof candidate.pomodoroSettings.workDuration       === 'number' ? candidate.pomodoroSettings.workDuration       : defaultData.pomodoroSettings.workDuration,
      shortBreakDuration: typeof candidate.pomodoroSettings.shortBreakDuration === 'number' ? candidate.pomodoroSettings.shortBreakDuration : defaultData.pomodoroSettings.shortBreakDuration,
      longBreakDuration:  typeof candidate.pomodoroSettings.longBreakDuration  === 'number' ? candidate.pomodoroSettings.longBreakDuration  : defaultData.pomodoroSettings.longBreakDuration,
    } : defaultData.pomodoroSettings,
    sessionLogs: Array.isArray(candidate.sessionLogs) ? candidate.sessionLogs as SessionLog[] : defaultData.sessionLogs,
  };
};

/** Reads the stored Google session from localStorage. Returns null if missing or invalid. */
const readGoogleSession = (): GoogleSession | null => {
  const rawSession = localStorage.getItem(GOOGLE_SESSION_KEY);
  if (!rawSession) return null;
  try {
    const parsed = JSON.parse(rawSession) as Partial<GoogleSession>;
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string' || typeof parsed.avatar !== 'string') {
      return null;
    }
    return {
      email: parsed.email,
      name: parsed.name,
      avatar: parsed.avatar,
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined,
      expiresAt:   typeof parsed.expiresAt   === 'number' ? parsed.expiresAt   : undefined,
      scope:       typeof parsed.scope       === 'string' ? parsed.scope       : undefined,
    };
  } catch {
    return null;
  }
};

/** Persists the Google session to localStorage. */
const saveGoogleSession = (session: GoogleSession) =>
  localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(session));

const clearGoogleSession = () => localStorage.removeItem(GOOGLE_SESSION_KEY);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const isGoogleDirectEnabled = Boolean(googleClientId);
  const authMode: 'supabase-email' | 'local' = isSupabaseConfigured ? 'supabase-email' : 'local';
  const isHydratingFromSupabaseRef = useRef(false);
  const hydratedUserRef = useRef<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(authMode === 'supabase-email');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return normalizeAppData(JSON.parse(saved)); } catch { return defaultData; }
    }
    return defaultData;
  });

  const requestAuthPrompt = (message = 'Sign in to save changes.') => setAuthPromptMessage(message);
  const dismissAuthPrompt = () => setAuthPromptMessage(null);

  useEffect(() => {
    const supabaseClient = supabase;
    if (authMode !== 'supabase-email') { setIsAuthLoading(false); return; }
    if (!isSupabaseConfigured || !supabaseClient) { setIsAuthLoading(false); return; }

    const applySession = (session: Session | null) => {
      if (session?.user?.email) {
        const email = session.user.email;
        setData(prev => ({ ...prev, isLoggedIn: true, user: { name: email, avatar: email.slice(0, 2).toUpperCase() } }));
      } else {
        const savedGoogleSession = readGoogleSession();
        if (savedGoogleSession) {
          setData(prev => ({ ...prev, isLoggedIn: true, user: { name: savedGoogleSession.name, avatar: savedGoogleSession.avatar } }));
          return;
        }
        setData(prev => ({ ...prev, isLoggedIn: false, user: null }));
      }
    };

    let isMounted = true;
    const bootstrapAuth = async () => {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!isMounted) return;
      applySession(sessionData.session);
      setIsAuthLoading(false);
    };
    bootstrapAuth();

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setIsAuthLoading(false);
    });

    return () => { isMounted = false; authSubscription.subscription.unsubscribe(); };
  }, [authMode]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (!isSupabaseConfigured || !supabaseClient) return;
    if (!data.isLoggedIn || !data.user?.name) { hydratedUserRef.current = null; return; }
    if (hydratedUserRef.current === data.user.name) return;

    const userName = data.user.name;
    hydratedUserRef.current = userName;
    isHydratingFromSupabaseRef.current = true;
    let isCancelled = false;

    const hydrateFromSupabase = async () => {
      const { data: row, error } = await supabaseClient.from('user_progress').select('payload').eq('user_name', userName).maybeSingle();
      if (isCancelled) return;
      if (error) { console.error('Supabase fetch error:', error.message); isHydratingFromSupabaseRef.current = false; return; }
      if (row?.payload) {
        const remotePayload = sanitizeProgressPayload(row.payload);
        setData(prev => ({
          ...prev,
          subjects: normalizeSubjects(remotePayload.subjects ?? prev.subjects),
          activityData: normalizeActivityData(remotePayload.activityData ?? prev.activityData, remotePayload.activityDataMode ?? prev.activityDataMode),
          activityDataMode: 'hours',
          reminders: remotePayload.reminders ?? prev.reminders,
          resources: remotePayload.resources ?? prev.resources,
          exams: remotePayload.exams ?? prev.exams,
          weeklyTargetHours: remotePayload.weeklyTargetHours ?? prev.weeklyTargetHours,
          dailyTargetHours:  remotePayload.dailyTargetHours  ?? prev.dailyTargetHours,
          pomodoroSettings:  remotePayload.pomodoroSettings  ?? prev.pomodoroSettings,
        }));
      }
      isHydratingFromSupabaseRef.current = false;
    };

    hydrateFromSupabase();
    return () => { isCancelled = true; };
  }, [data.isLoggedIn, data.user?.name]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (!isSupabaseConfigured || !supabaseClient) return;
    if (!data.isLoggedIn || !data.user?.name) return;
    if (isHydratingFromSupabaseRef.current) return;

    const payload = toProgressPayload(data);
    const saveToSupabase = async () => {
      const { error } = await supabaseClient.from('user_progress').upsert(
        { user_name: data.user!.name, payload, updated_at: new Date().toISOString() },
        { onConflict: 'user_name' }
      );
      if (error) console.error('Supabase save error:', error.message);
    };
    saveToSupabase();
  }, [data]);

  const requestEmailSignIn = async (email: string) => {
    const supabaseClient = supabase;
    if (authMode !== 'supabase-email' || !isSupabaseConfigured || !supabaseClient) {
      return { ok: false, message: 'Email auth via Supabase is not enabled in current mode.' };
    }
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Magic link sent. Check your email to sign in.' };
  };

  /**
   * Google sign-in via GSI popup (profile + email scopes only, no Calendar).
   * Stores name, avatar, and access token in localStorage for session persistence.
   */
  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!isGoogleDirectEnabled) {
      return { ok: false, message: 'Direct Google auth is not enabled.' };
    }

    try {
      const profile = await signInWithGoogleDirect(googleClientId || '');
      const displayName = profile.name || profile.email;
      const initials = displayName.slice(0, 2).toUpperCase();

      saveGoogleSession({
        email: profile.email,
        name: displayName,
        avatar: initials,
        accessToken: profile.accessToken,
        expiresAt: profile.expiresAt,
        scope: profile.scope,
      });

      setData(prev => ({
        ...prev,
        isLoggedIn: true,
        user: { name: displayName, avatar: initials },
      }));
      dismissAuthPrompt();

      return { ok: true, message: `Signed in as ${profile.email}` };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Google sign-in failed.',
      };
    }
  };

  const signInWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    const supabaseClient = supabase;
    if (authMode !== 'supabase-email' || !isSupabaseConfigured || !supabaseClient) {
      return { ok: false, message: 'Email auth via Supabase is not enabled in current mode.' };
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Signed in successfully.' };
  };

  const signUpWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    const supabaseClient = supabase;
    if (authMode !== 'supabase-email' || !isSupabaseConfigured || !supabaseClient) {
      return { ok: false, message: 'Email auth via Supabase is not enabled in current mode.' };
    }
    const { data: signUpData, error } = await supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (error) return { ok: false, message: error.message };
    const hasSession = Boolean(signUpData.session);
    return { ok: true, message: hasSession ? 'Account created and signed in.' : 'Account created. Check your email to confirm.' };
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const supabaseClient = supabase;
    if (authMode !== 'supabase-email' || !isSupabaseConfigured || !supabaseClient) {
      return { ok: false, message: 'Email auth via Supabase is not enabled in current mode.' };
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Password reset email sent. Check your inbox.' };
  };

  const login = (name: string) => {
    if (authMode !== 'local') return;
    setData(prev => ({ ...prev, isLoggedIn: true, user: { name, avatar: name.slice(0, 2).toUpperCase() } }));
    dismissAuthPrompt();
  };

  const logout = async () => {
    const supabaseClient = supabase;
    if (authMode === 'supabase-email' && isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.auth.signOut();
      if (error) console.error('Supabase sign out error:', error.message);
    }
    clearGoogleSession();
    dismissAuthPrompt();
    setData(prev => ({ ...prev, isLoggedIn: false, user: null }));
  };

  const updateData = (newData: Partial<AppData>) => {
    if (!data.isLoggedIn) { requestAuthPrompt('Sign in to save your dashboard changes.'); return; }
    setData(prev => normalizeAppData({ ...prev, ...newData }));
  };

  /**
   * Logs a study session to activityData (and subject dailyHours if applicable).
   * @param session - StudySessionLog with source, dateKey, hours
   */
  const logStudySession = async (session: StudySessionLog): Promise<AuthResult> => {
    if (!data.isLoggedIn) {
      requestAuthPrompt('Sign in to save study changes.');
      return { ok: false, message: 'Sign in to save study changes.' };
    }
    setData(prev => normalizeAppData(applyStudySessionLog(prev, session)));
    return {
      ok: true,
      message: session.hours <= 0 ? 'Study session cleared.' : 'Study session logged.',
    };
  };

  return (
    <DataContext.Provider
      value={{
        data,
        authMode,
        isGoogleDirectEnabled,
        isAuthLoading,
        authPromptMessage,
        requestAuthPrompt,
        dismissAuthPrompt,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        requestPasswordReset,
        requestEmailSignIn,
        login,
        logout,
        updateData,
        logStudySession,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

// Re-export toDateKey so components can import it from here if needed
export { toDateKey };

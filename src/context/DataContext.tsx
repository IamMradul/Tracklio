import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// --- Types ---
export interface Subject {
  id: string;
  name: string;
  progress: number;
  totalHours: number;
  status: 'on track' | 'progressing' | 'needs focus';
  color: string;
  studyDates: string[]; // e.g., '2026-04-12'
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

export interface AppData {
  isLoggedIn: boolean;
  user: { name: string; avatar: string } | null;
  subjects: Subject[];
  activityData: Record<string, number>; // date "YYYY-MM-DD" -> level (1-4)
  reminders: Reminder[];
  resources: ResourceItem[];
}

type ProgressPayload = Pick<AppData, 'subjects' | 'activityData' | 'reminders' | 'resources'>;

const defaultData: AppData = {
  isLoggedIn: false,
  user: null,
  subjects: [
    { id: '1', name: 'Mathematics', progress: 78, totalHours: 12.5, status: 'on track', color: '#4ade80', studyDates: [] },
    { id: '2', name: 'Physics', progress: 52, totalHours: 8, status: 'progressing', color: '#f97316', studyDates: [] },
    { id: '3', name: 'Computer Sci', progress: 90, totalHours: 9.5, status: 'on track', color: '#a855f7', studyDates: [] },
    { id: '4', name: 'Chemistry', progress: 35, totalHours: 5.5, status: 'needs focus', color: '#ef4444', studyDates: [] },
    { id: '5', name: 'English Lit', progress: 60, totalHours: 3, status: 'progressing', color: '#a81111', studyDates: [] }
  ],
  activityData: {}, // Heatmap data
  reminders: [
    { id: 'r1', title: 'Weekly target on track', description: "You've studied only 8h - target is 15h. Catch up now!", timeStr: 'Today', type: 'warning' },
    { id: 'r2', title: 'Physics spaced repetition', description: "Last studied 5 days ago - spaced repetition suggests a review today.", timeStr: '2h ago', type: 'info' },
    { id: 'r3', title: 'Weekly goal almost done', description: "Only 1.5 hrs left to complete your 40-hour weekly target!", timeStr: 'Morning', type: 'success' }
  ],
  resources: [
    { id: 'res1', title: 'MIT OCW - Linear Algebra', tag: 'Math', color: '#4ade80' },
    { id: 'res2', title: '3Blue1Brown playlist', tag: 'Math', color: '#3b82f6' },
    { id: 'res3', title: 'Feynman Lectures - Physics', tag: 'Physics', color: '#f97316' },
    { id: 'res4', title: 'CS50 - Harvard OpenCourse', tag: 'CS', color: '#a855f7' }
  ]
};

interface DataContextType {
  data: AppData;
  login: (name: string) => void;
  logout: () => void;
  updateData: (newData: Partial<AppData>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'tracklio_data';

const toProgressPayload = (state: AppData): ProgressPayload => ({
  subjects: state.subjects,
  activityData: state.activityData,
  reminders: state.reminders,
  resources: state.resources,
});

const sanitizeProgressPayload = (rawPayload: unknown): Partial<ProgressPayload> => {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {};
  }

  const payload = rawPayload as Partial<ProgressPayload>;

  return {
    subjects: Array.isArray(payload.subjects) ? payload.subjects : undefined,
    activityData: payload.activityData && typeof payload.activityData === 'object'
      ? (payload.activityData as Record<string, number>)
      : undefined,
    reminders: Array.isArray(payload.reminders) ? payload.reminders : undefined,
    resources: Array.isArray(payload.resources) ? payload.resources : undefined,
  };
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isHydratingFromSupabaseRef = useRef(false);
  const hydratedUserRef = useRef<string | null>(null);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  });

  useEffect(() => {
    const supabaseClient = supabase;
    if (!isSupabaseConfigured || !supabaseClient) return;
    if (!data.isLoggedIn || !data.user?.name) {
      hydratedUserRef.current = null;
      return;
    }

    if (hydratedUserRef.current === data.user.name) {
      return;
    }

    const userName = data.user.name;
    hydratedUserRef.current = userName;
    isHydratingFromSupabaseRef.current = true;

    let isCancelled = false;

    const hydrateFromSupabase = async () => {
      const { data: row, error } = await supabaseClient
        .from('user_progress')
        .select('payload')
        .eq('user_name', userName)
        .maybeSingle();

      if (isCancelled) return;

      if (error) {
        console.error('Supabase fetch error:', error.message);
        isHydratingFromSupabaseRef.current = false;
        return;
      }

      if (row?.payload) {
        const remotePayload = sanitizeProgressPayload(row.payload);

        setData(prev => ({
          ...prev,
          subjects: remotePayload.subjects ?? prev.subjects,
          activityData: remotePayload.activityData ?? prev.activityData,
          reminders: remotePayload.reminders ?? prev.reminders,
          resources: remotePayload.resources ?? prev.resources,
        }));
      }

      isHydratingFromSupabaseRef.current = false;
    };

    hydrateFromSupabase();

    return () => {
      isCancelled = true;
    };
  }, [data.isLoggedIn, data.user?.name]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (!isSupabaseConfigured || !supabaseClient) return;
    if (!data.isLoggedIn || !data.user?.name) return;
    if (isHydratingFromSupabaseRef.current) return;

    const payload = toProgressPayload(data);

    const saveToSupabase = async () => {
      const { error } = await supabaseClient
        .from('user_progress')
        .upsert(
          {
            user_name: data.user!.name,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_name' }
        );

      if (error) {
        console.error('Supabase save error:', error.message);
      }
    };

    saveToSupabase();
  }, [data]);

  const login = (name: string) => {
    setData(prev => ({
      ...prev,
      isLoggedIn: true,
      user: { name, avatar: name.slice(0, 2).toUpperCase() }
    }));
  };

  const logout = () => {
    setData(prev => ({
      ...prev,
      isLoggedIn: false,
      user: null
    }));
  };

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  return (
    <DataContext.Provider value={{ data, login, logout, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

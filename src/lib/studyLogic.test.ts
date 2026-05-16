import { describe, expect, it } from 'vitest';
import type { AppData } from '../context/DataContext';
import { applyStudySessionLog, buildGeminiPrompt, calculateSubjectProgress } from './studyLogic';

const baseData: AppData = {
  isLoggedIn: true,
  user: { name: 'Mira', avatar: 'MI' },
  subjects: [
    {
      id: 'math',
      name: 'Mathematics',
      progress: 0,
      totalHours: 4,
      targetHours: 20,
      status: 'needs focus',
      color: '#5f8dff',
      studyDates: ['2026-04-18'],
      dailyHours: { '2026-04-18': 4 },
    },
  ],
  activityData: { '2026-04-19': 2 },
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

describe('study session logging', () => {
  it('updates the heatmap data for a logged general session', () => {
    const next = applyStudySessionLog(baseData, {
      source: 'heatmap',
      dateKey: '2026-04-20',
      hours: 3.5,
    });

    expect(next.activityData['2026-04-20']).toBe(3.5);
    expect(next.activityDataMode).toBe('hours');
  });

  it('updates a subject session and recalculates progress', () => {
    const next = applyStudySessionLog(baseData, {
      source: 'subject',
      dateKey: '2026-04-20',
      hours: 6,
      subjectId: 'math',
    });

    const updatedSubject = next.subjects[0];
    expect(updatedSubject.dailyHours['2026-04-20']).toBe(6);
    expect(updatedSubject.totalHours).toBe(10);
    expect(updatedSubject.progress).toBe(50);
    expect(updatedSubject.status).toBe('progressing');
  });
});

describe('subject progress calculation', () => {
  it('calculates progress and gap hours from the subject totals', () => {
    const progress = calculateSubjectProgress({
      id: 'physics',
      name: 'Physics',
      color: '#35d6b5',
      targetHours: 30,
      totalHours: 12,
      dailyHours: { '2026-04-16': 3, '2026-04-17': 4, '2026-04-18': 5 },
    });

    expect(progress.progress).toBe(40);
    expect(progress.status).toBe('needs focus');
    expect(progress.gapHours).toBe(18);
  });
});

describe('Gemini prompt builder', () => {
  it('includes the user study context in the prompt', () => {
    const prompt = buildGeminiPrompt({
      userName: 'Mira',
      todayKey: '2026-04-20',
      todayHours: 2.5,
      totalHours: 16,
      weeklyHours: 8,
      currentStreak: 3,
      longestStreak: 5,
      weeklyTargetHours: 40,
      subjectCount: 1,
      activeDays: 4,
      bestDay: { dateKey: '2026-04-19', hours: 4 },
      recentActivity: [{ dateKey: '2026-04-19', hours: 4 }],
      subjectSnapshots: [
        { id: 'math', name: 'Mathematics', color: '#5f8dff', targetHours: 20, totalHours: 4, progress: 20, status: 'needs focus', gapHours: 16, recentHours: 4 },
      ],
      weakSubjects: [
        { id: 'math', name: 'Mathematics', color: '#5f8dff', targetHours: 20, totalHours: 4, progress: 20, status: 'needs focus', gapHours: 16, recentHours: 4 },
      ],
      strongSubjects: [],
    }, 'What should I focus on tonight?');

    expect(prompt).toContain('Mira');
    expect(prompt).toContain('Mathematics');
    expect(prompt).toContain('Current streak: 3 days');
    expect(prompt).toContain('What should I focus on tonight?');
  });
});

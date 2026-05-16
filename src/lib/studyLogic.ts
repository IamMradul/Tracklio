import type { AppData, Subject } from '../context/DataContext';

export type StudySessionSource = 'heatmap' | 'subject' | 'pomodoro';

export interface StudySessionLog {
  source: StudySessionSource;
  dateKey: string;
  hours: number;
  subjectId?: string;
  subjectName?: string;
}

export interface SubjectSnapshot {
  id: string;
  name: string;
  color: string;
  targetHours: number;
  totalHours: number;
  progress: number;
  status: Subject['status'];
  gapHours: number;
  recentHours: number;
}

export interface StudyContext {
  userName: string;
  todayKey: string;
  todayHours: number;
  totalHours: number;
  weeklyHours: number;
  currentStreak: number;
  longestStreak: number;
  weeklyTargetHours: number;
  subjectCount: number;
  activeDays: number;
  bestDay: { dateKey: string; hours: number } | null;
  recentActivity: Array<{ dateKey: string; hours: number }>;
  subjectSnapshots: SubjectSnapshot[];
  weakSubjects: SubjectSnapshot[];
  strongSubjects: SubjectSnapshot[];
}

export interface StudyPlanItem {
  dateKey: string;
  subject: string;
  startTime: string;
  endTime: string;
  hours: number;
  focus: string;
  note: string;
}

export interface GeminiStudyPlan {
  summary: string;
  motivation: string;
  schedule: StudyPlanItem[];
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDateKey = (value: string) => DATE_KEY_PATTERN.test(value);

const createSortedDateEntries = (activityData: Record<string, number>) => Object.entries(activityData)
  .filter((entry): entry is [string, number] => isDateKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
  .sort((left, right) => left[0].localeCompare(right[0]));

export const getCurrentStreak = (activityData: Record<string, number>, referenceDate = new Date()) => {
  let streak = 0;
  const cursor = new Date(referenceDate);

  while ((activityData[toDateKey(cursor)] ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getLongestStreak = (activityData: Record<string, number>) => {
  const activeDates = createSortedDateEntries(activityData).map(([dateKey]) => dateKey);
  const activeSet = new Set(activeDates);
  let longest = 0;

  for (const dateKey of activeDates) {
    const previous = new Date(`${dateKey}T00:00:00`);
    previous.setDate(previous.getDate() - 1);

    if (activeSet.has(toDateKey(previous))) {
      continue;
    }

    let streak = 1;
    const cursor = new Date(`${dateKey}T00:00:00`);

    while (true) {
      cursor.setDate(cursor.getDate() + 1);
      const nextKey = toDateKey(cursor);
      if (!activeSet.has(nextKey)) {
        break;
      }
      streak += 1;
    }

    longest = Math.max(longest, streak);
  }

  return longest;
};

export const calculateSubjectProgress = (subject: Pick<Subject, 'id' | 'name' | 'color' | 'targetHours' | 'totalHours' | 'dailyHours'>) => {
  const targetHours = Number.isFinite(subject.targetHours) && subject.targetHours > 0
    ? Number(subject.targetHours.toFixed(1))
    : 40;
  const totalHours = Number(Math.max(0, subject.totalHours).toFixed(1));
  const progress = Math.min(100, Math.round((totalHours / Math.max(1, targetHours)) * 100));
  const status: Subject['status'] = progress >= 100 ? 'on track' : progress >= 50 ? 'progressing' : 'needs focus';
  const gapHours = Number(Math.max(0, targetHours - totalHours).toFixed(1));
  const recentHours = Object.entries(subject.dailyHours ?? {})
    .filter((entry): entry is [string, number] => isDateKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-7)
    .reduce((sum, [, hours]) => sum + hours, 0);

  return {
    id: subject.id,
    name: subject.name,
    color: subject.color,
    targetHours,
    totalHours,
    progress,
    status,
    gapHours,
    recentHours: Number(recentHours.toFixed(1)),
  } satisfies SubjectSnapshot;
};

const normalizeSubject = (subject: Subject): Subject => {
  const progressData = calculateSubjectProgress(subject);
  const studyDates = Object.entries(subject.dailyHours)
    .filter((entry): entry is [string, number] => isDateKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
    .map(([dateKey]) => dateKey)
    .sort();

  return {
    ...subject,
    targetHours: progressData.targetHours,
    totalHours: progressData.totalHours,
    progress: progressData.progress,
    status: progressData.status,
    studyDates,
    dailyHours: Object.fromEntries(
      Object.entries(subject.dailyHours)
        .filter((entry): entry is [string, number] => isDateKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
        .map(([dateKey, hours]) => [dateKey, Number(hours.toFixed(1))])
    ) as Record<string, number>,
  };
};

export const applyStudySessionLog = (data: AppData, session: StudySessionLog): AppData => {
  if (!Number.isFinite(session.hours) || !isDateKey(session.dateKey)) {
    return data;
  }

  const roundedHours = Number(session.hours.toFixed(1));

  if (session.hours <= 0) {
    if (session.source === 'heatmap') {
      const nextActivityData = { ...data.activityData };
      delete nextActivityData[session.dateKey];

      return {
        ...data,
        activityData: nextActivityData,
        activityDataMode: 'hours',
      };
    }

    const nextSubjects = data.subjects.map((subject) => {
      const matchesId = session.subjectId ? subject.id === session.subjectId : false;
      const matchesName = session.subjectName ? subject.name === session.subjectName : false;

      if (!matchesId && !matchesName) {
        return subject;
      }

      const nextDailyHours = { ...subject.dailyHours };
      delete nextDailyHours[session.dateKey];
      const totalHours = Number(Object.values(nextDailyHours).reduce((sum, value) => sum + value, 0).toFixed(1));

      return normalizeSubject({
        ...subject,
        dailyHours: nextDailyHours,
        totalHours,
      });
    });

    return {
      ...data,
      subjects: nextSubjects,
    };
  }

  if (session.source === 'heatmap') {
    return {
      ...data,
      activityData: {
        ...data.activityData,
        [session.dateKey]: roundedHours,
      },
      activityDataMode: 'hours',
    };
  }

  // Pomodoro sessions accumulate hours into activityData (don't overwrite)
  if (session.source === 'pomodoro') {
    const existing = data.activityData[session.dateKey] ?? 0;
    return {
      ...data,
      activityData: {
        ...data.activityData,
        [session.dateKey]: Number((existing + roundedHours).toFixed(1)),
      },
      activityDataMode: 'hours',
    };
  }

  const nextSubjects = data.subjects.map((subject) => {
    const matchesId = session.subjectId ? subject.id === session.subjectId : false;
    const matchesName = session.subjectName ? subject.name === session.subjectName : false;

    if (!matchesId && !matchesName) {
      return subject;
    }

    const nextDailyHours = {
      ...subject.dailyHours,
      [session.dateKey]: roundedHours,
    };

    const totalHours = Number(Object.values(nextDailyHours).reduce((sum, value) => sum + value, 0).toFixed(1));

    return normalizeSubject({
      ...subject,
      dailyHours: nextDailyHours,
      totalHours,
    });
  });

  return {
    ...data,
    subjects: nextSubjects,
  };
};

export const buildStudyContext = (data: AppData): StudyContext => {
  const todayKey = toDateKey(new Date());
  const sortedActivity = createSortedDateEntries(data.activityData);
  const totalHours = Number(sortedActivity.reduce((sum, [, hours]) => sum + hours, 0).toFixed(1));
  const todayHours = Number((data.activityData[todayKey] ?? 0).toFixed(1));
  const weeklyHours = Number(sortedActivity
    .filter(([dateKey]) => {
      const date = new Date(`${dateKey}T00:00:00`);
      const differenceInDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
      return differenceInDays >= 0 && differenceInDays < 7;
    })
    .reduce((sum, [, hours]) => sum + hours, 0)
    .toFixed(1));

  const subjectSnapshots = data.subjects.map(calculateSubjectProgress).sort((left, right) => left.progress - right.progress || right.gapHours - left.gapHours);
  const weakSubjects = subjectSnapshots.filter((subject) => subject.progress < 70);
  const strongSubjects = subjectSnapshots.filter((subject) => subject.progress >= 70).sort((left, right) => right.progress - left.progress);
  const bestDay = sortedActivity.reduce<{ dateKey: string; hours: number } | null>((best, current) => {
    if (!best || current[1] > best.hours) {
      return { dateKey: current[0], hours: current[1] };
    }

    return best;
  }, null);

  return {
    userName: data.user?.name || 'Student',
    todayKey,
    todayHours,
    totalHours,
    weeklyHours,
    currentStreak: getCurrentStreak(data.activityData),
    longestStreak: getLongestStreak(data.activityData),
    weeklyTargetHours: data.weeklyTargetHours,
    subjectCount: data.subjects.length,
    activeDays: sortedActivity.length,
    bestDay,
    recentActivity: sortedActivity.slice(-14).map(([dateKey, hours]) => ({ dateKey, hours: Number(hours.toFixed(1)) })),
    subjectSnapshots,
    weakSubjects,
    strongSubjects,
  };
};

const formatStudyPromptLines = (context: StudyContext) => [
  `Student: ${context.userName}`,
  `Today: ${context.todayHours.toFixed(1)}h logged`,
  `This week: ${context.weeklyHours.toFixed(1)}h / ${context.weeklyTargetHours.toFixed(1)}h target`,
  `Current streak: ${context.currentStreak} days`,
  `Longest streak: ${context.longestStreak} days`,
  `Active days: ${context.activeDays}`,
  `Weak subjects: ${context.weakSubjects.length ? context.weakSubjects.map((subject) => `${subject.name} (${subject.progress}%)`).join(', ') : 'none'}`,
  `Strong subjects: ${context.strongSubjects.length ? context.strongSubjects.slice(0, 3).map((subject) => `${subject.name} (${subject.progress}%)`).join(', ') : 'none'}`,
  `Best day: ${context.bestDay ? `${context.bestDay.dateKey} (${context.bestDay.hours.toFixed(1)}h)` : 'none'}`,
  `Recent activity: ${context.recentActivity.map((entry) => `${entry.dateKey}=${entry.hours.toFixed(1)}h`).join(', ') || 'none'}`,
  `Subject snapshots: ${context.subjectSnapshots.map((subject) => `${subject.name}:${subject.totalHours.toFixed(1)}/${subject.targetHours.toFixed(1)}h`).join(', ') || 'none'}`,
];

export const buildGeminiPrompt = (context: StudyContext, question: string) => [
  'You are StudyNX, a concise but sharp student productivity assistant.',
  'Use the study context to tailor every answer. Never answer generically if the context can help.',
  'Prioritize weak subjects, streak risk, motivation, and practical scheduling advice.',
  'When the user asks for a plan, give a clear, step-by-step answer with specific time blocks.',
  'When the user asks a question, answer in 3-6 short paragraphs or bullet points and stay grounded in the data.',
  '',
  ...formatStudyPromptLines(context),
  '',
  `User question: ${question}`,
  '',
  'Return plain text only.',
].join('\n');

export const buildGeminiPlanPrompt = (context: StudyContext, targetDateKey: string) => [
  'You are StudyNX generating a study schedule for tomorrow.',
  'Use the context to build a realistic plan focused on the weakest subjects and the current streak.',
  'Return valid JSON only with this exact shape:',
  '{"summary":"string","motivation":"string","schedule":[{"dateKey":"YYYY-MM-DD","subject":"string","startTime":"HH:MM","endTime":"HH:MM","hours":0,"focus":"string","note":"string"}]}',
  `Target date: ${targetDateKey}`,
  ...formatStudyPromptLines(context),
  '',
  'Constraints:',
  '- Keep the schedule realistic and do not exceed 6 focused hours total.',
  '- Use up to 4 blocks, each 45 to 90 minutes.',
  '- Include breaks implicitly between blocks by leaving gaps in the times.',
  '- Prefer weak subjects first, then maintain strong subjects briefly.',
].join('\n');

export const extractJsonBlock = (responseText: string) => {
  const trimmed = responseText.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return candidate.slice(firstBrace, lastBrace + 1);
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

export const createFallbackTomorrowPlan = (context: StudyContext, targetDateKey: string): GeminiStudyPlan => {
  const focusSubjects = context.weakSubjects.length > 0 ? context.weakSubjects : context.subjectSnapshots.slice(0, 3);
  const selectedSubjects = focusSubjects.slice(0, 4);
  const tomorrow = new Date(`${targetDateKey}T08:00:00`);
  const baseHour = selectedSubjects.length > 0 ? 17 : 18;
  const baseMinutes = 0;
  const schedule: StudyPlanItem[] = [];
  let cursorMinutes = baseHour * 60 + baseMinutes;

  for (const subject of selectedSubjects) {
    const durationMinutes = subject.progress < 40 ? 90 : 60;
    const startDate = new Date(tomorrow);
    startDate.setHours(Math.floor(cursorMinutes / 60), cursorMinutes % 60, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    schedule.push({
      dateKey: targetDateKey,
      subject: subject.name,
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      hours: Number((durationMinutes / 60).toFixed(1)),
      focus: subject.progress < 40 ? 'Deep catch-up block' : 'Focused revision block',
      note: `Close the ${subject.gapHours.toFixed(1)}h gap with one high-quality block.`,
    });

    cursorMinutes += durationMinutes + 20;
  }

  return {
    summary: selectedSubjects.length > 0
      ? `Tomorrow prioritizes ${selectedSubjects.map((subject) => subject.name).join(', ')}.`
      : 'Tomorrow keeps the session light and consistent.',
    motivation: context.currentStreak > 0
      ? `Your ${context.currentStreak}-day streak is worth protecting.`
      : 'A clean restart tomorrow will make the next streak easier to hold.',
    schedule,
  };
};

export const parseGeminiStudyPlan = (responseText: string, context: StudyContext, targetDateKey: string): GeminiStudyPlan => {
  const jsonBlock = extractJsonBlock(responseText);

  if (!jsonBlock) {
    return createFallbackTomorrowPlan(context, targetDateKey);
  }

  try {
    const parsed = JSON.parse(jsonBlock) as Partial<GeminiStudyPlan> & { schedule?: Array<Partial<StudyPlanItem>> };
    const schedule = Array.isArray(parsed.schedule)
      ? parsed.schedule
        .filter((entry) => typeof entry?.subject === 'string' && typeof entry?.startTime === 'string' && typeof entry?.endTime === 'string')
        .map((entry) => ({
          dateKey: typeof entry.dateKey === 'string' && isDateKey(entry.dateKey) ? entry.dateKey : targetDateKey,
          subject: entry.subject!,
          startTime: entry.startTime!,
          endTime: entry.endTime!,
          hours: typeof entry.hours === 'number' && Number.isFinite(entry.hours) ? Number(entry.hours.toFixed(1)) : 1,
          focus: typeof entry.focus === 'string' ? entry.focus : 'Focused revision block',
          note: typeof entry.note === 'string' ? entry.note : '',
        }))
      : [];

    if (schedule.length === 0) {
      return createFallbackTomorrowPlan(context, targetDateKey);
    }

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Tomorrow is organized around your weak subjects.',
      motivation: typeof parsed.motivation === 'string' ? parsed.motivation : 'Keep the momentum going.',
      schedule,
    };
  } catch {
    return createFallbackTomorrowPlan(context, targetDateKey);
  }
};

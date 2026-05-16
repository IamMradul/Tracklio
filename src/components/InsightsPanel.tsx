import React from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './InsightsPanel.css';

const isValidDateKey = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key);

const getCurrentStreak = (activityData: Record<string, number>) => {
  const now = new Date();
  let streak = 0;
  const cursor = new Date(now);

  while ((activityData[toDateKey(cursor)] ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const getLongestStreak = (activeDateKeys: string[]) => {
  const activeSet = new Set(activeDateKeys);
  let maxStreak = 0;

  for (const dateKey of activeDateKeys) {
    const previous = new Date(`${dateKey}T00:00:00`);
    previous.setDate(previous.getDate() - 1);
    const previousKey = toDateKey(previous);

    if (activeSet.has(previousKey)) {
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

    maxStreak = Math.max(maxStreak, streak);
  }

  return maxStreak;
};

const InsightsPanel: React.FC = () => {
  const { data } = useData();
  const now = new Date();

  const sortedEntries = Object.entries(data.activityData)
    .filter((entry): entry is [string, number] => isValidDateKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const totalHours = sortedEntries.reduce((sum, [, hours]) => sum + hours, 0);
  const activeDays = sortedEntries.length;
  const startDateKey = sortedEntries[0]?.[0] ?? null;
  const avgActiveDayHours = activeDays > 0 ? totalHours / activeDays : 0;

  const bestEntry = sortedEntries.reduce<[string, number] | null>((best, current) => {
    if (!best || current[1] > best[1]) {
      return current;
    }
    return best;
  }, null);

  const activeDateKeys = sortedEntries.map(([dateKey]) => dateKey);
  const currentStreak = getCurrentStreak(data.activityData);
  const longestStreak = getLongestStreak(activeDateKeys);

  const totalLevel = Math.max(1, Math.floor(totalHours / 25) + 1);
  const levelProgress = ((totalHours % 25) / 25) * 100;

  const levelBands = sortedEntries.reduce(
    (acc, [, hours]) => {
      if (hours < 2) acc.l1 += 1;
      else if (hours < 4) acc.l2 += 1;
      else if (hours < 6) acc.l3 += 1;
      else acc.l4 += 1;
      return acc;
    },
    { l1: 0, l2: 0, l3: 0, l4: 0 }
  );

  const weeklyTrends = Array.from({ length: 8 }, (_, idx) => {
    const offset = 7 - idx;
    const end = new Date(now);
    end.setDate(now.getDate() - offset * 7);

    const total = Array.from({ length: 7 }, (_, dayOffset) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (6 - dayOffset));
      return data.activityData[toDateKey(d)] ?? 0;
    }).reduce((sum, hours) => sum + hours, 0);

    return {
      label: `W${idx + 1}`,
      hours: total,
    };
  });

  const maxWeeklyHours = Math.max(1, ...weeklyTrends.map(item => item.hours));

  if (sortedEntries.length === 0) {
    return (
      <section className="insights-panel card">
        <div className="insights-heading">
          <h2>Study Insights</h2>
          <span>{now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="empty-state" style={{ minHeight: 240 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="currentColor" strokeWidth="2" opacity=".3"/>
            <path d="M24 48 Q36 24 48 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".6"/>
            <circle cx="36" cy="28" r="5" fill="currentColor" opacity=".4"/>
            <path d="M20 56h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".3"/>
          </svg>
          <p>No study sessions logged yet. Start studying to see your insights here!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="insights-panel card">
      <div className="insights-heading">
        <h2>Study Insights</h2>
        <span>{now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      <div className="insight-metrics-grid">
        <article className="insight-metric-card">
          <small>Start Date</small>
          <strong>{startDateKey ? new Date(`${startDateKey}T00:00:00`).toLocaleDateString() : 'No logs yet'}</strong>
        </article>
        <article className="insight-metric-card">
          <small>Total Study Hours</small>
          <strong>{totalHours.toFixed(1)}h</strong>
        </article>
        <article className="insight-metric-card">
          <small>Active Days</small>
          <strong>{activeDays}</strong>
        </article>
        <article className="insight-metric-card">
          <small>Average / Active Day</small>
          <strong>{avgActiveDayHours.toFixed(1)}h</strong>
        </article>
        <article className="insight-metric-card">
          <small>Current Streak</small>
          <strong>{currentStreak} days</strong>
        </article>
        <article className="insight-metric-card">
          <small>Longest Streak</small>
          <strong>{longestStreak} days</strong>
        </article>
      </div>

      <div className="insights-split-grid">
        <article className="insight-card-block">
          <div className="insight-block-title">Level Analysis</div>
          <div className="level-row">
            <span>Current Level</span>
            <strong>Level {totalLevel}</strong>
          </div>
          <div className="level-progress-track">
            <div className="level-progress-fill" style={{ width: `${Math.min(100, levelProgress)}%` }}></div>
          </div>
          <div className="level-progress-label">{(25 - (totalHours % 25)).toFixed(1)}h to next level</div>

          <div className="level-bands-grid">
            <div><small>Level 1 (0-2h)</small><strong>{levelBands.l1} days</strong></div>
            <div><small>Level 2 (2-4h)</small><strong>{levelBands.l2} days</strong></div>
            <div><small>Level 3 (4-6h)</small><strong>{levelBands.l3} days</strong></div>
            <div><small>Level 4 (6h+)</small><strong>{levelBands.l4} days</strong></div>
          </div>
        </article>

        <article className="insight-card-block">
          <div className="insight-block-title">Weekly Trend (Last 8 Weeks)</div>
          <div className="trend-bars">
            {weeklyTrends.map((week) => (
              <div key={week.label} className="trend-bar-col" title={`${week.label}: ${week.hours.toFixed(1)}h`}>
                <div className="trend-bar" style={{ height: `${Math.max(8, (week.hours / maxWeeklyHours) * 100)}%` }}></div>
                <small>{week.label}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="insights-split-grid">
        <article className="insight-card-block">
          <div className="insight-block-title">Subject Completion</div>
          <div className="subject-insight-list">
            {data.subjects.length === 0 && <p className="insight-empty">No subjects added yet.</p>}
            {data.subjects.map((subject) => {
              const progress = Math.min(100, Math.round((subject.totalHours / Math.max(1, subject.targetHours)) * 100));
              return (
                <div key={subject.id} className="subject-insight-item">
                  <div className="subject-insight-head">
                    <strong>{subject.name}</strong>
                    <span>{subject.totalHours.toFixed(1)}h / {subject.targetHours.toFixed(1)}h</span>
                  </div>
                  <div className="subject-track">
                    <div className="subject-fill" style={{ width: `${progress}%`, backgroundColor: subject.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="insight-card-block">
          <div className="insight-block-title">Best Day</div>
          <div className="best-day-card">
            <strong>{bestEntry ? `${bestEntry[1].toFixed(1)}h` : '0.0h'}</strong>
            <small>
              {bestEntry
                ? new Date(`${bestEntry[0]}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
                : 'Start logging sessions to see your best day'}
            </small>
          </div>
        </article>
      </div>
    </section>
  );
};

export default InsightsPanel;

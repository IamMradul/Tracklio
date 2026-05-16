import React from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './TopStats.css';

const TopStats: React.FC = () => {
  const { data } = useData();
  const now = new Date();
  const todayKey = toDateKey(now);
  const todayHours = data.activityData[todayKey] ?? 0;

  const weekEntries = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      fullLabel: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
      hours: data.activityData[toDateKey(d)] ?? 0,
    };
  });

  const weeklyHours = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const activeDays = weekEntries.filter((entry) => entry.hours > 0).length;
  const focusScore = Math.min(100, Math.round((weeklyHours / Math.max(1, data.weeklyTargetHours)) * 100));
  const streak = (() => {
    let count = 0;
    const cursor = new Date(now);
    while ((data.activityData[toDateKey(cursor)] ?? 0) > 0) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  const ringPercent = Math.max(0, Math.min(100, Math.round((todayHours / 9) * 100)));

  return (
    <section className="top-stats-container card">
      <div className="top-stats-heading">
        <h2>Today's progress</h2>
        <span>{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>

      <div className="progress-layout">
        <div className="progress-primary">
          <div className="progress-ring" style={{ background: `conic-gradient(from 90deg, #6d8fff 0 ${ringPercent * 3.6}deg, var(--bg-ring-track) ${ringPercent * 3.6}deg 360deg)` }}>
            <div className="ring-center">
              <strong>{todayHours.toFixed(1)}h</strong>
              <small>of 9h goal</small>
            </div>
          </div>
          <p className="progress-primary-label">Study time</p>
          <div className="progress-metrics">
            <div>
              <span>Focus</span>
              <strong>{todayHours.toFixed(1)}h</strong>
            </div>
            <div>
              <span>Break</span>
              <strong>{Math.max(0, (todayHours * 0.2)).toFixed(1)}h</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{ringPercent}%</strong>
            </div>
          </div>
        </div>

        <div className="progress-secondary">
          <article className="mini-stat-card">
            <span>Focus score</span>
            <strong>{focusScore}%</strong>
            <small>from activity logs</small>
          </article>
          <article className="mini-stat-card">
            <span>Hours logged</span>
            <strong>{weeklyHours.toFixed(1)}h</strong>
            <small>weekly total</small>
          </article>
          <article className="mini-stat-card wide">
            <span>This week</span>
            <div className="week-bars">
              {weekEntries.map((entry) => (
                <div
                  key={entry.fullLabel}
                  className="week-bar"
                  title={`${entry.fullLabel}: ${entry.hours.toFixed(1)}h`}
                  style={{ height: `${Math.max(16, entry.hours * 20)}%` }}
                ></div>
              ))}
            </div>
            <div className="week-days">
              {weekEntries.map((entry) => (
                <span key={`${entry.fullLabel}-label`}>{entry.label}</span>
              ))}
            </div>
          </article>
          <article className="mini-stat-card">
            <span>Streak</span>
            <strong>{streak} days</strong>
            <small>{activeDays}/7 active days</small>
          </article>
        </div>
      </div>
    </section>
  );
};

export default TopStats;

import React from 'react';
import { useData } from '../context/DataContext';
import './TopStats.css';

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const TopStats: React.FC = () => {
  const { data } = useData();
  const now = new Date();
  const todayKey = toDateKey(now);
  const todayHours = data.activityData[todayKey] ?? 0;

  const last7 = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    return data.activityData[toDateKey(d)] ?? 0;
  });

  const weeklyHours = last7.reduce((sum, hours) => sum + hours, 0);
  const activeDays = last7.filter(hours => hours > 0).length;
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
          <div className="progress-ring" style={{ background: `conic-gradient(from 90deg, #6d8fff 0 ${ringPercent * 3.6}deg, rgba(59, 77, 136, 0.6) ${ringPercent * 3.6}deg 360deg)` }}>
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
              {last7.map((bar, idx) => (
                <div key={idx} className="week-bar" style={{ height: `${Math.max(16, bar * 20)}%` }}></div>
              ))}
            </div>
            <div className="week-days">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <span key={`${day}-${idx}`}>{day}</span>
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

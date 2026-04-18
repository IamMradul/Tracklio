import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import './Heatmap.css';

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const Heatmap: React.FC = () => {
  const { data, updateData } = useData();
  const now = new Date();
  const todayKey = toDateKey(now);
  const todayHours = data.activityData[todayKey] ?? 0;
  const [todayHoursInput, setTodayHoursInput] = useState(String(todayHours));

  useEffect(() => {
    setTodayHoursInput(String(todayHours));
  }, [todayHours]);

  const saveTodayHours = () => {
    const parsedHours = Number.parseFloat(todayHoursInput);
    if (!Number.isFinite(parsedHours) || parsedHours < 0) {
      return;
    }

    const nextActivityData = { ...data.activityData };
    if (parsedHours === 0) {
      delete nextActivityData[todayKey];
    } else {
      nextActivityData[todayKey] = Number(parsedHours.toFixed(1));
    }

    updateData({
      activityData: nextActivityData,
      activityDataMode: 'hours',
    });
  };

  const last7 = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    const hours = data.activityData[toDateKey(d)] ?? 0;
    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
      hours,
    };
  });

  const totalWeeklyHours = last7.reduce((sum, item) => sum + item.hours, 0);
  const totalBreakHours = totalWeeklyHours * 0.2;
  const activeDays = last7.filter(item => item.hours > 0).length;
  const bestDay = last7.reduce((best, item) => item.hours > best.hours ? item : best, last7[0]);

  const recent28 = Array.from({ length: 28 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (27 - idx));
    return data.activityData[toDateKey(d)] ?? 0;
  });

  const trendPoints = [
    recent28.slice(0, 7),
    recent28.slice(7, 14),
    recent28.slice(14, 21),
    recent28.slice(21, 28),
  ].map(week => week.reduce((sum, h) => sum + h, 0));

  const maxTrend = Math.max(1, ...trendPoints);

  return (
    <section className="card heatmap-container">
      <div className="heatmap-title-row">
        <h3>Weekly Rhythm</h3>
        <span>{new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toLocaleDateString()} - {now.toLocaleDateString()}</span>
      </div>

      <div className="heatmap-log-row">
        <div>
          <span className="heatmap-log-label">Today</span>
          <strong className="heatmap-log-value">{todayHours.toFixed(1)}h logged</strong>
        </div>
        <div className="heatmap-log-controls">
          <input
            type="number"
            min="0"
            step="0.5"
            className="heatmap-hours-input"
            value={todayHoursInput}
            onChange={(e) => setTodayHoursInput(e.target.value)}
            placeholder="0.0"
          />
          <button type="button" className="widget-btn" onClick={saveTodayHours}>Save today</button>
        </div>
      </div>

      <div className="rhythm-metrics">
        <div className="rhythm-chip">
          <span>Study time</span>
          <strong>{totalWeeklyHours.toFixed(1)}h</strong>
        </div>
        <div className="rhythm-chip">
          <span>Break time</span>
          <strong>{totalBreakHours.toFixed(1)}h</strong>
        </div>
        <div className="rhythm-chip">
          <span>Active days</span>
          <strong>{activeDays}/7</strong>
        </div>
        <div className="rhythm-chip">
          <span>Best day</span>
          <strong>{bestDay.label}</strong>
        </div>
      </div>

      <div className="rhythm-panels">
        <article className="rhythm-panel">
          <div className="panel-label">Study hours trend</div>
          <div className="trend-line" aria-hidden="true">
            {trendPoints.map((point, idx) => (
              <div key={idx} className="trend-node" style={{ left: `${idx * 24}%`, bottom: `${Math.round((point / maxTrend) * 80) + 8}%` }}></div>
            ))}
          </div>
        </article>

        <article className="rhythm-panel">
          <div className="panel-label">Daily focus bars</div>
          <div className="focus-bars">
            {last7.map((bar, idx) => (
              <div key={idx} className="focus-column">
                <span>{bar.hours.toFixed(1)}h</span>
                <div className="focus-column-fill" style={{ height: `${Math.max(16, bar.hours * 18)}%` }}></div>
              </div>
            ))}
          </div>
          <div className="focus-days">
            {last7.map((day, idx) => (
              <span key={`${day.label}-${idx}`}>{day.label}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};

export default Heatmap;

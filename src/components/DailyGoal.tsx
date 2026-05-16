import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './DailyGoal.css';

const DAILY_GOAL_KEY = 'studynx_daily_goal';

/**
 * Reads the stored daily hour goal from localStorage.
 * Defaults to 4 hours if not set.
 */
const getStoredDailyGoal = (): number => {
  const stored = localStorage.getItem(DAILY_GOAL_KEY);
  const parsed = Number(stored);
  return stored && Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
};

/**
 * DailyGoal — lets users set a daily study hour goal and shows their progress.
 * - Displays a labelled progress bar: "X.X / Y hrs today"
 * - Shows weekly goal completion percentage
 * - Goal persisted in localStorage
 */
const DailyGoal: React.FC = () => {
  const { data } = useData();
  const [dailyGoal, setDailyGoal] = useState<number>(getStoredDailyGoal);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const todayKey   = toDateKey(new Date());
  const todayHours = data.activityData[todayKey] ?? 0;
  const dailyPercent  = Math.min(100, (todayHours / dailyGoal) * 100);

  // Weekly: sum last 7 days
  const weeklyHours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return data.activityData[toDateKey(d)] ?? 0;
  }).reduce((s, h) => s + h, 0);
  const weeklyGoal    = dailyGoal * 7;
  const weeklyPercent = Math.min(100, (weeklyHours / weeklyGoal) * 100);

  const startEdit = () => {
    setInputVal(String(dailyGoal));
    setEditing(true);
  };

  const saveEdit = () => {
    const parsed = parseFloat(inputVal);
    if (Number.isFinite(parsed) && parsed > 0) {
      const rounded = Math.round(parsed * 10) / 10;
      setDailyGoal(rounded);
      localStorage.setItem(DAILY_GOAL_KEY, String(rounded));
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div className="card daily-goal-card">
      <div className="card-title">Daily Goal</div>

      <div className="dg-today-row">
        <span className="dg-today-label">Today</span>
        {editing ? (
          <div className="dg-edit-row">
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              className="dg-edit-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label="Daily goal hours"
            />
            <button type="button" className="dg-save-btn" onClick={saveEdit}>✓</button>
          </div>
        ) : (
          <button
            type="button"
            className="dg-goal-display"
            onClick={startEdit}
            aria-label={`Daily goal: ${dailyGoal} hours. Click to edit.`}
            title="Click to change goal"
          >
            {dailyGoal} hrs/day
          </button>
        )}
      </div>

      <div className="dg-progress-label">
        <span>{todayHours.toFixed(1)} / {dailyGoal} hrs today</span>
        <span className={`dg-pct ${dailyPercent >= 100 ? 'goal-met' : ''}`}>
          {Math.round(dailyPercent)}%
        </span>
      </div>
      <div className="dg-track" role="progressbar" aria-valuenow={todayHours} aria-valuemax={dailyGoal} aria-label="Daily study progress">
        <div
          className={`dg-fill ${dailyPercent >= 100 ? 'dg-fill-complete' : ''}`}
          style={{ width: `${dailyPercent}%` }}
        />
      </div>

      <div className="dg-weekly-row">
        <span className="dg-weekly-label">Weekly completion</span>
        <span className={`dg-pct ${weeklyPercent >= 100 ? 'goal-met' : ''}`}>
          {weeklyHours.toFixed(1)} / {weeklyGoal}h ({Math.round(weeklyPercent)}%)
        </span>
      </div>
      <div className="dg-track dg-track-sm">
        <div
          className={`dg-fill ${weeklyPercent >= 100 ? 'dg-fill-complete' : ''}`}
          style={{ width: `${weeklyPercent}%` }}
        />
      </div>

      {dailyPercent >= 100 && (
        <div className="dg-congrats">🎉 Daily goal reached!</div>
      )}
    </div>
  );
};

export default DailyGoal;

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './StreakBadge.css';

/**
 * Calculates the current study streak (consecutive days with logged hours,
 * going backwards from today).
 */
const calcCurrentStreak = (activityData: Record<string, number>): number => {
  const cursor = new Date();
  let streak = 0;
  while ((activityData[toDateKey(cursor)] ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * StreakBadge — displays a 🔥 flame icon with the current consecutive study streak.
 * Shows a "Streak broken!" warning if yesterday had 0 hours but a streak existed before.
 */
const StreakBadge: React.FC = () => {
  const { data } = useData();

  const { streak, streakBroken } = useMemo(() => {
    const currentStreak = calcCurrentStreak(data.activityData);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    const todayKey = toDateKey(new Date());
    const todayHours = data.activityData[todayKey] ?? 0;
    const yesterdayHours = data.activityData[yesterdayKey] ?? 0;

    // Streak is broken if today has no hours yet AND yesterday also had no hours
    // AND there was some historical activity (meaning there was a streak to break)
    const hasHistory = Object.values(data.activityData).some(h => h > 0);
    const broken = hasHistory && todayHours === 0 && yesterdayHours === 0 && currentStreak === 0;

    return { streak: currentStreak, streakBroken: broken };
  }, [data.activityData]);

  if (!data.isLoggedIn) return null;

  return (
    <div
      className={`streak-badge ${streakBroken ? 'streak-broken' : streak > 0 ? 'streak-active' : ''}`}
      aria-label={`Study streak: ${streak} day${streak !== 1 ? 's' : ''}`}
      title={streakBroken ? 'You broke your streak!' : `${streak} day streak`}
    >
      <span className="streak-flame" aria-hidden="true">🔥</span>
      <span className="streak-count">{streak}</span>
      {streakBroken && (
        <span className="streak-warn" role="alert">Streak broken!</span>
      )}
    </div>
  );
};

export default StreakBadge;

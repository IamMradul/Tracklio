import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './Widgets.css';
import './PomodoroWidget.css';

type PomodoroMode = 'work' | 'short' | 'long';

const MODE_CONFIG: Record<PomodoroMode, { label: string; duration: number; color: string }> = {
  work:  { label: 'Focus',        duration: 25 * 60, color: '#5f8dff' },
  short: { label: 'Short Break',  duration:  5 * 60, color: '#35d6b5' },
  long:  { label: 'Long Break',   duration: 15 * 60, color: '#ffad4c' },
};

const RING_RADIUS = 54;
const RING_CIRC   = 2 * Math.PI * RING_RADIUS;

/**
 * Requests browser notification permission on first use.
 * Silently no-ops if notifications aren't supported.
 */
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

/**
 * Fires a browser notification when a Pomodoro session ends.
 * @param title - Notification title
 * @param body  - Notification body text
 */
const sendNotification = (title: string, body: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/StudyNX.png' });
};

/**
 * Pomodoro — full-featured Pomodoro timer widget.
 * - Modes: Work (25m), Short Break (5m), Long Break (15m)
 * - Circular SVG progress ring
 * - Controls: Start/Pause, Reset, Skip
 * - Browser notification on session end
 * - Auto-logs completed focus sessions (+0.42h) to activityData
 */
export const Pomodoro: React.FC = () => {
  const { logStudySession } = useData();
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.duration);
  const [isActive, setIsActive] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const notifRequested = useRef(false);

  const config = MODE_CONFIG[mode];
  const progress = timeLeft / config.duration;
  const dashOffset = RING_CIRC * progress;

  /** Switch to a mode and reset timer without auto-starting */
  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setIsActive(false);
    setMode(nextMode);
    setTimeLeft(MODE_CONFIG[nextMode].duration);
  }, []);

  /** Called when a session timer reaches 0 */
  const onSessionEnd = useCallback(() => {
    if (mode === 'work') {
      const next = completedPomodoros + 1;
      setCompletedPomodoros(next);
      sendNotification('Focus session complete! 🎉', 'Great work. Time for a break.');

      // Auto-log ~25 min = 0.42h to activityData
      void logStudySession({
        source: 'pomodoro',
        dateKey: toDateKey(new Date()),
        hours: 0.42,
      });

      // Every 4 pomodoros → long break
      switchMode(next % 4 === 0 ? 'long' : 'short');
    } else {
      sendNotification('Break over! 💪', 'Ready for another focus session?');
      switchMode('work');
    }
  }, [mode, completedPomodoros, logStudySession, switchMode]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(false);
          onSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, onSessionEnd]);

  const handleStartPause = () => {
    if (!notifRequested.current) {
      notifRequested.current = true;
      void requestNotificationPermission();
    }
    setIsActive(prev => !prev);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(config.duration);
  };

  const handleSkip = () => {
    setIsActive(false);
    onSessionEnd();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="card widget-card pomodoro-card">
      <div className="card-title">Pomodoro Timer</div>

      {/* Mode selector */}
      <div className="pomodoro-modes" role="tablist" aria-label="Pomodoro mode">
        {(Object.keys(MODE_CONFIG) as PomodoroMode[]).map(m => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`pomodoro-mode-btn ${mode === m ? 'active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Circular ring */}
      <div className="pomodoro-ring-wrap">
        <svg className="pomodoro-ring no-transition" viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
          {/* Track */}
          <circle
            cx="60" cy="60" r={RING_RADIUS}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={RING_RADIUS}
            fill="none"
            stroke={config.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: isActive ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>

        <div className="pomodoro-time-wrap">
          <div className="pomodoro-time" style={{ color: config.color }}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="pomodoro-mode-label">{config.label}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="timer-controls">
        <button
          type="button"
          className="widget-btn pomodoro-primary-btn"
          style={{ borderColor: `${config.color}66`, color: config.color }}
          onClick={handleStartPause}
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          type="button"
          className="widget-btn"
          onClick={handleReset}
          aria-label="Reset timer"
        >
          ↺ Reset
        </button>
        <button
          type="button"
          className="widget-btn"
          onClick={handleSkip}
          aria-label="Skip to next session"
        >
          ⏭ Skip
        </button>
      </div>

      {/* Completed sessions dots */}
      <div className="timer-dots" aria-label={`${completedPomodoros} focus sessions completed`}>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={`dot ${i < completedPomodoros % 4 ? 'active' : ''}`} />
        ))}
      </div>
      <div className="pomodoro-sessions-count">
        {completedPomodoros} session{completedPomodoros !== 1 ? 's' : ''} completed today
      </div>
    </div>
  );
};

export const ExamCountdown: React.FC = () => {
  const { data, updateData } = useData();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const exams = data.exams
    .map(exam => {
      const examDate = new Date(exam.date);
      const days = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const progress = Math.max(5, 100 - days * 3);
      return { ...exam, days, progress };
    })
    .sort((a, b) => a.days - b.days);

  const addExam = () => {
    if (!title.trim() || !date) return;
    const palette = ['#ff6c78', '#35d6b5', '#5f8dff', '#ffba5f'];
    updateData({
      exams: [...data.exams, {
        id: crypto.randomUUID(),
        title: title.trim(),
        date,
        color: palette[data.exams.length % palette.length],
      }],
    });
    setTitle('');
    setDate('');
  };

  const removeExam = (examId: string) =>
    updateData({ exams: data.exams.filter(e => e.id !== examId) });

  const editExam = (examId: string) => {
    const exam = data.exams.find(e => e.id === examId);
    if (!exam) return;
    const nextTitle = window.prompt('Edit exam title', exam.title)?.trim();
    if (!nextTitle) return;
    const nextDate = window.prompt('Edit exam date (YYYY-MM-DD)', exam.date)?.trim();
    if (!nextDate) return;
    updateData({ exams: data.exams.map(e => e.id === examId ? { ...e, title: nextTitle, date: nextDate } : e) });
  };

  const moveExam = (examId: string, direction: -1 | 1) => {
    const idx = data.exams.findIndex(e => e.id === examId);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= data.exams.length) return;
    const arr = [...data.exams];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    updateData({ exams: arr });
  };

  return (
    <div className="card widget-card">
      <div className="card-title">Exam Countdown</div>

      {exams.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>No exams added yet.</p>
        </div>
      )}

      <div className="exam-list">
        {exams.map(exam => (
          <div key={exam.id} className="exam-item" title={exam.date}>
            <div className="exam-days" style={{ color: exam.days < 10 ? '#ef4444' : 'var(--text-heading)' }}>
              {exam.days}
            </div>
            <div className="exam-info">
              <div className="exam-title">{exam.title}</div>
              <div className="exam-date">{new Date(exam.date).toLocaleDateString()}</div>
            </div>
            <div className="exam-progress-bar">
              <div className="exam-progress-fill" style={{ width: `${exam.progress}%`, backgroundColor: exam.color }} />
            </div>
            <div className="subject-actions">
              <button type="button" className="widget-btn mini" aria-label={`Move ${exam.title} up`} onClick={() => moveExam(exam.id, -1)}>↑</button>
              <button type="button" className="widget-btn mini" aria-label={`Move ${exam.title} down`} onClick={() => moveExam(exam.id, 1)}>↓</button>
              <button type="button" className="widget-btn mini" aria-label={`Edit ${exam.title}`} onClick={() => editExam(exam.id)}>edit</button>
              <button type="button" className="widget-btn mini danger" aria-label={`Delete ${exam.title}`} onClick={() => removeExam(exam.id)}>del</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-reminder-row exam-add-row" style={{ marginTop: '12px' }}>
        <input type="text" placeholder="exam title" className="add-reminder-input exam-add-title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="date" className="add-reminder-input exam-add-date" value={date} onChange={e => setDate(e.target.value)} />
        <button type="button" className="widget-btn exam-add-btn" aria-label="Add exam" onClick={addExam}>+</button>
      </div>
    </div>
  );
};

export const WeeklyGoal: React.FC = () => {
  const { data, updateData } = useData();
  const now = new Date();
  const current = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - idx);
    return data.activityData[toDateKey(d)] ?? 0;
  }).reduce((sum, h) => sum + h, 0);
  const target = data.weeklyTargetHours;
  const percent = (current / target) * 100;

  const adjustTarget = (delta: number) =>
    updateData({ weeklyTargetHours: Math.max(1, data.weeklyTargetHours + delta) });

  return (
    <div className="card widget-card">
      <div className="card-title">Weekly Goal</div>
      <div className="goal-display">
        <span className="goal-current">{current.toFixed(1)}</span>
        <span className="goal-target"> / {target} hrs</span>
      </div>
      <div className="goal-track">
        <div className="goal-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <div className="goal-text">
        {current >= target
          ? `🎉 Goal reached! You're ${(current - target).toFixed(1)}h ahead.`
          : `${(target - current).toFixed(1)} hrs to hit your weekly goal`}
      </div>
      <div className="add-reminder-row" style={{ marginTop: '10px' }}>
        <button type="button" className="widget-btn mini" aria-label="Decrease weekly goal by 1 hour" onClick={() => adjustTarget(-1)}>-1h</button>
        <button type="button" className="widget-btn mini" aria-label="Increase weekly goal by 1 hour" onClick={() => adjustTarget(1)}>+1h</button>
      </div>
    </div>
  );
};

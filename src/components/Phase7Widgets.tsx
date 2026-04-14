import React, { useState, useEffect } from 'react';
import './Widgets.css';

export const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="card widget-card">
      <div className="card-title">POMODORO TIMER</div>
      <div className="timer-display">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="timer-label">focus session</div>
      <div className="timer-controls">
        <button className="widget-btn" onClick={toggleTimer}>
          {isActive ? 'pause' : 'start'}
        </button>
        <button className="widget-btn" onClick={resetTimer}>
          reset
        </button>
      </div>
      <div className="timer-dots">
        <span className="dot active"></span>
        <span className="dot active"></span>
        <span className="dot active"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export const ExamCountdown: React.FC = () => {
  const exams = [
    { id: 1, days: 8, title: 'Physics finals', date: 'Apr 22', color: '#ef4444', progress: 80 },
    { id: 2, days: 21, title: 'Calculus midterm', date: 'May 5', color: '#4ade80', progress: 40 },
    { id: 3, days: 34, title: 'CS — Data Structures', date: 'May 18', color: '#3b82f6', progress: 15 },
  ];

  return (
    <div className="card widget-card">
      <div className="card-title">EXAM COUNTDOWN</div>
      <div className="exam-list">
        {exams.map(exam => (
          <div key={exam.id} className="exam-item">
            <div className="exam-days" style={{ color: exam.days < 10 ? '#ef4444' : 'var(--text-heading)' }}>
              {exam.days}
            </div>
            <div className="exam-info">
              <div className="exam-title">{exam.title}</div>
              <div className="exam-date">{exam.date}</div>
            </div>
            <div className="exam-progress-bar">
              <div className="exam-progress-fill" style={{ width: `${exam.progress}%`, backgroundColor: exam.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeeklyGoal: React.FC = () => {
  const current = 38.5;
  const target = 40;
  const percent = (current / target) * 100;

  return (
    <div className="card widget-card">
      <div className="card-title">WEEKLY GOAL</div>
      <div className="goal-display">
        <span className="goal-current">{current}</span>
        <span className="goal-target"> / {target} hrs</span>
      </div>
      <div className="goal-track">
        <div className="goal-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="goal-text">
        1.5 hrs to hit your weekly goal
      </div>
    </div>
  );
};

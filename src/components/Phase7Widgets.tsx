import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
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
  const { data, updateData } = useData();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const exams = data.exams
    .map(exam => {
      const examDate = new Date(exam.date);
      const days = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const progress = Math.max(5, 100 - days * 3);
      return {
        ...exam,
        days,
        progress,
      };
    })
    .sort((a, b) => a.days - b.days);

  const addExam = () => {
    if (!title.trim() || !date) {
      return;
    }

    const palette = ['#ff6c78', '#35d6b5', '#5f8dff', '#ffba5f'];
    const nextExam = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      color: palette[data.exams.length % palette.length],
    };

    updateData({ exams: [...data.exams, nextExam] });
    setTitle('');
    setDate('');
  };

  const removeExam = (examId: string) => {
    updateData({ exams: data.exams.filter(exam => exam.id !== examId) });
  };

  const editExam = (examId: string) => {
    const exam = data.exams.find(item => item.id === examId);
    if (!exam) return;

    const nextTitle = window.prompt('Edit exam title', exam.title)?.trim();
    if (!nextTitle) return;
    const nextDate = window.prompt('Edit exam date (YYYY-MM-DD)', exam.date)?.trim();
    if (!nextDate) return;

    updateData({
      exams: data.exams.map(item => (
        item.id === examId ? { ...item, title: nextTitle, date: nextDate } : item
      )),
    });
  };

  const moveExam = (examId: string, direction: -1 | 1) => {
    const currentIndex = data.exams.findIndex(item => item.id === examId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.exams.length) return;

    const nextExams = [...data.exams];
    [nextExams[currentIndex], nextExams[nextIndex]] = [nextExams[nextIndex], nextExams[currentIndex]];
    updateData({ exams: nextExams });
  };

  return (
    <div className="card widget-card">
      <div className="card-title">EXAM COUNTDOWN</div>
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
              <div className="exam-progress-fill" style={{ width: `${exam.progress}%`, backgroundColor: exam.color }}></div>
            </div>
            <div className="subject-actions">
              <button className="widget-btn mini" onClick={() => moveExam(exam.id, -1)}>↑</button>
              <button className="widget-btn mini" onClick={() => moveExam(exam.id, 1)}>↓</button>
              <button className="widget-btn mini" onClick={() => editExam(exam.id)}>edit</button>
              <button className="widget-btn mini danger" onClick={() => removeExam(exam.id)}>del</button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-reminder-row" style={{ marginTop: '12px' }}>
        <input
          type="text"
          placeholder="exam title"
          className="add-reminder-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="add-reminder-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="widget-btn" onClick={addExam}>+</button>
      </div>
    </div>
  );
};

export const WeeklyGoal: React.FC = () => {
  const { data, updateData } = useData();
  const now = new Date();
  const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
  const current = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - idx);
    return (data.activityData[toDateKey(d)] ?? 0) * 1.5;
  }).reduce((sum, hours) => sum + hours, 0);
  const target = data.weeklyTargetHours;
  const percent = (current / target) * 100;

  const adjustTarget = (delta: number) => {
    const nextTarget = Math.max(1, data.weeklyTargetHours + delta);
    updateData({ weeklyTargetHours: nextTarget });
  };

  return (
    <div className="card widget-card">
      <div className="card-title">WEEKLY GOAL</div>
      <div className="goal-display">
        <span className="goal-current">{current.toFixed(1)}</span>
        <span className="goal-target"> / {target} hrs</span>
      </div>
      <div className="goal-track">
        <div className="goal-fill" style={{ width: `${Math.min(100, percent)}%` }}></div>
      </div>
      <div className="goal-text">
        {current >= target
          ? `Goal reached. You are ${(current - target).toFixed(1)}h ahead.`
          : `${(target - current).toFixed(1)} hrs to hit your weekly goal`}
      </div>

      <div className="add-reminder-row" style={{ marginTop: '10px' }}>
        <button className="widget-btn mini" onClick={() => adjustTarget(-1)}>-1h</button>
        <button className="widget-btn mini" onClick={() => adjustTarget(1)}>+1h</button>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import type { Subject } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './SubjectsList.css';

const CircularProgress: React.FC<{ progress: number, color: string, label: string, onClick: () => void }> = ({ progress, color, label, onClick }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button type="button" className="progress-ring-container" onClick={onClick} aria-label={label}>
      <svg height="50" width="50" className="subject-progress-ring">
        <circle
          className="subject-progress-ring-circle-bg"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
        />
        <circle
          className="subject-progress-ring-circle"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
        />
      </svg>
      <div className="progress-text">{progress}%</div>
    </button>
  );
};

const SubjectsList: React.FC = () => {
  const { data, updateData, logStudySession } = useData();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectTargetHours, setNewSubjectTargetHours] = useState('40');
  const [todayHoursInput, setTodayHoursInput] = useState('');

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const selectedSubject = selectedSubjectId
    ? data.subjects.find(subject => subject.id === selectedSubjectId) ?? null
    : null;

  useEffect(() => {
    if (!selectedSubject) {
      setTodayHoursInput('');
      return;
    }

    const current = selectedSubject.dailyHours[todayKey] ?? 0;
    setTodayHoursInput(current > 0 ? String(current) : '');
  }, [selectedSubject, todayKey]);

  const deriveSubject = (subject: Subject): Subject => {
    const targetHours = Number.isFinite(subject.targetHours) && subject.targetHours > 0
      ? Number(subject.targetHours.toFixed(1))
      : 40;

    const sanitizedDailyHours = Object.fromEntries(
      Object.entries(subject.dailyHours)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
        .map(([dateKey, hours]) => [dateKey, Number(hours.toFixed(1))])
    ) as Record<string, number>;

    const totalHoursRaw = Object.values(sanitizedDailyHours).reduce((sum, hours) => sum + hours, 0);
    const totalHours = Number(totalHoursRaw.toFixed(1));
    const progress = Math.min(100, Math.round((totalHours / targetHours) * 100));
    const status: Subject['status'] = progress >= 100 ? 'on track' : progress >= 50 ? 'progressing' : 'needs focus';
    const studyDates = Object.keys(sanitizedDailyHours).sort();

    return {
      ...subject,
      targetHours,
      dailyHours: sanitizedDailyHours,
      totalHours,
      progress,
      status,
      studyDates,
    };
  };

  const setTodayHoursForSubject = async (subjectId: string) => {
    const parsed = Number(todayHoursInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    const boundedHours = Number(Math.min(parsed, 24).toFixed(1));
    const subject = data.subjects.find(item => item.id === subjectId);
    if (!subject) {
      return;
    }

    await logStudySession({
      source: 'subject',
      dateKey: todayKey,
      hours: boundedHours,
      subjectId,
      subjectName: subject.name,
    });
  };

  const addSubject = () => {
    const name = newSubjectName.trim();
    const parsedTarget = Number(newSubjectTargetHours);
    const targetHours = Number.isFinite(parsedTarget) && parsedTarget > 0 ? Number(parsedTarget.toFixed(1)) : 40;
    if (!name) return;

    const palette = ['#5f8dff', '#35d6b5', '#ffba5f', '#ff6c78', '#9f84ff'];
    const nextSubject = deriveSubject({
      id: crypto.randomUUID(),
      name,
      progress: 0,
      totalHours: 0,
      targetHours,
      status: 'needs focus',
      color: palette[data.subjects.length % palette.length],
      studyDates: [],
      dailyHours: {},
    });

    updateData({ subjects: [...data.subjects, nextSubject] });
    setNewSubjectName('');
    setNewSubjectTargetHours('40');
  };

  const editSubject = (subjectId: string) => {
    const subject = data.subjects.find(item => item.id === subjectId);
    if (!subject) return;

    const nextName = window.prompt('Edit subject name', subject.name)?.trim();
    if (!nextName) return;
    const nextTargetRaw = window.prompt('Edit target hours', String(subject.targetHours))?.trim();
    if (!nextTargetRaw) return;
    const nextTarget = Number(nextTargetRaw);
    if (!Number.isFinite(nextTarget) || nextTarget <= 0) return;

    updateData({
      subjects: data.subjects.map(item => (
        item.id === subjectId
          ? deriveSubject({ ...item, name: nextName, targetHours: Number(nextTarget.toFixed(1)) })
          : item
      )),
    });
  };

  const deleteSubject = (subjectId: string) => {
    updateData({
      subjects: data.subjects.filter(item => item.id !== subjectId),
    });
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
    }
  };

  const moveSubject = (subjectId: string, direction: -1 | 1) => {
    const currentIndex = data.subjects.findIndex(item => item.id === subjectId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.subjects.length) return;

    const nextSubjects = [...data.subjects];
    [nextSubjects[currentIndex], nextSubjects[nextIndex]] = [nextSubjects[nextIndex], nextSubjects[currentIndex]];
    updateData({ subjects: nextSubjects });
  };

  const heatmapWeeks = useMemo(() => {
    if (!selectedSubject) {
      return [] as Array<Array<{ dateKey: string; hours: number }>>;
    }

    const days = Array.from({ length: 112 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (111 - i));
      const dateKey = toDateKey(date);
      return {
        dateKey,
        hours: selectedSubject.dailyHours[dateKey] ?? 0,
      };
    });

    return Array.from({ length: 16 }, (_, weekIndex) => days.slice(weekIndex * 7, weekIndex * 7 + 7));
  }, [selectedSubject]);

  const hoursBucket = (hours: number) => {
    if (hours <= 0) return 0;
    if (hours < 1) return 1;
    if (hours < 2.5) return 2;
    if (hours < 4) return 3;
    return 4;
  };

  return (
    <>
      <div className="card subjects-container">
        <div className="card-title">SUBJECTS — CLICK RING FOR DETAILS</div>
        <div className="subject-create-row">
          <input
            type="text"
            className="subject-create-input"
            placeholder="Add subject..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <input
            type="number"
            min="1"
            step="0.5"
            className="subject-create-target"
            placeholder="Target hours"
            value={newSubjectTargetHours}
            onChange={(e) => setNewSubjectTargetHours(e.target.value)}
          />
          <button type="button" className="widget-btn" onClick={addSubject}>Add</button>
        </div>

        {data.subjects.length === 0 && (
          <div className="subject-empty">No subjects yet. Add one to begin tracking.</div>
        )}

        <div className="subjects-list">
          {data.subjects.map(subject => (
            <div key={subject.id} className="subject-item">
              <CircularProgress 
                progress={subject.progress} 
                color={subject.color} 
                label={`Open ${subject.name} study details`} 
                onClick={() => setSelectedSubjectId(subject.id)} 
              />
              <div className="subject-info">
                <div className="subject-name">{subject.name}</div>
                <div className="subject-hours">{subject.totalHours}h / {subject.targetHours}h target</div>
              </div>
              <div className="subject-meta-actions">
                <div className={`subject-status tag-${subject.status.replace(' ', '-')}`}>
                  {subject.status}
                </div>
                <div className="subject-actions">
                  <button type="button" className="widget-btn mini" aria-label={`Move ${subject.name} up`} onClick={() => moveSubject(subject.id, -1)}>↑</button>
                  <button type="button" className="widget-btn mini" aria-label={`Move ${subject.name} down`} onClick={() => moveSubject(subject.id, 1)}>↓</button>
                  <button type="button" className="widget-btn mini" aria-label={`Edit ${subject.name}`} onClick={() => editSubject(subject.id)}>edit</button>
                  <button type="button" className="widget-btn mini danger" aria-label={`Delete ${subject.name}`} onClick={() => deleteSubject(subject.id)}>del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for detailed view */}
      {selectedSubject && (
        <div className="modal-overlay" onClick={() => setSelectedSubjectId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedSubject.name} - Subject Heatmap</h3>
              <button type="button" className="close-btn" aria-label="Close subject details" onClick={() => setSelectedSubjectId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Set today's study hours and review your last 16 weeks for {selectedSubject.name}.</p>

              <div className="subject-log-row">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  className="subject-log-input"
                  placeholder="Hours studied today"
                  value={todayHoursInput}
                  onChange={(e) => setTodayHoursInput(e.target.value)}
                />
                <button type="button" className="widget-btn" onClick={() => setTodayHoursForSubject(selectedSubject.id)}>Save today</button>
              </div>

              <div className="subject-modal-stats">
                <span>{selectedSubject.totalHours.toFixed(1)}h done</span>
                <span>{selectedSubject.targetHours.toFixed(1)}h target</span>
                <span>{selectedSubject.progress}% complete</span>
              </div>

              <div className="subject-heatmap-board">
                <div className="subject-heatmap-grid">
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="subject-heatmap-week">
                      {week.map(day => (
                        <div
                          key={day.dateKey}
                          className={`subject-heatmap-cell subject-bucket-${hoursBucket(day.hours)}`}
                          title={`${day.dateKey}: ${day.hours.toFixed(1)}h`}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <div className="subject-heatmap-legend">
                  <span>Less</span>
                  <i className="subject-heatmap-cell subject-bucket-0" />
                  <i className="subject-heatmap-cell subject-bucket-1" />
                  <i className="subject-heatmap-cell subject-bucket-2" />
                  <i className="subject-heatmap-cell subject-bucket-3" />
                  <i className="subject-heatmap-cell subject-bucket-4" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectsList;

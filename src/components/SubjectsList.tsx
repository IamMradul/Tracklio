import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Subject } from '../context/DataContext';
import './SubjectsList.css';

const CircularProgress: React.FC<{ progress: number, color: string, onClick: () => void }> = ({ progress, color, onClick }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container" onClick={onClick}>
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
    </div>
  );
};

const SubjectsList: React.FC = () => {
  const { data, updateData } = useData();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');

  const selectedSubject = selectedSubjectId
    ? data.subjects.find(subject => subject.id === selectedSubjectId) ?? null
    : null;

  const recentDays = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  });

  const toggleStudyDate = (subjectId: string, dateKey: string) => {
    const updatedSubjects = data.subjects.map(subject => {
      if (subject.id !== subjectId) {
        return subject;
      }

      const hasDate = subject.studyDates.includes(dateKey);
      const studyDates = hasDate
        ? subject.studyDates.filter(date => date !== dateKey)
        : [...subject.studyDates, dateKey];

      const boundedCount = studyDates.filter(date => {
        const dateObj = new Date(date);
        const diffDays = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 13;
      }).length;

      const progress = Math.round((boundedCount / 14) * 100);
      const totalHours = Number((studyDates.length * 1.5).toFixed(1));
      const status: Subject['status'] = progress >= 70 ? 'on track' : progress >= 40 ? 'progressing' : 'needs focus';

      return {
        ...subject,
        studyDates,
        progress,
        totalHours,
        status,
      };
    });

    updateData({ subjects: updatedSubjects });
  };

  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;

    const palette = ['#5f8dff', '#35d6b5', '#ffba5f', '#ff6c78', '#9f84ff'];
    const nextSubject: Subject = {
      id: crypto.randomUUID(),
      name,
      progress: 0,
      totalHours: 0,
      status: 'needs focus',
      color: palette[data.subjects.length % palette.length],
      studyDates: [],
    };

    updateData({ subjects: [...data.subjects, nextSubject] });
    setNewSubjectName('');
  };

  const editSubject = (subjectId: string) => {
    const subject = data.subjects.find(item => item.id === subjectId);
    if (!subject) return;

    const nextName = window.prompt('Edit subject name', subject.name)?.trim();
    if (!nextName) return;

    updateData({
      subjects: data.subjects.map(item => (
        item.id === subjectId ? { ...item, name: nextName } : item
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
          <button className="widget-btn" onClick={addSubject}>Add</button>
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
                onClick={() => setSelectedSubjectId(subject.id)} 
              />
              <div className="subject-info">
                <div className="subject-name">{subject.name}</div>
                <div className="subject-hours">{subject.totalHours}h studied</div>
              </div>
              <div className="subject-meta-actions">
                <div className={`subject-status tag-${subject.status.replace(' ', '-')}`}>
                  {subject.status}
                </div>
                <div className="subject-actions">
                  <button type="button" className="widget-btn mini" onClick={() => moveSubject(subject.id, -1)}>↑</button>
                  <button type="button" className="widget-btn mini" onClick={() => moveSubject(subject.id, 1)}>↓</button>
                  <button type="button" className="widget-btn mini" onClick={() => editSubject(subject.id)}>edit</button>
                  <button type="button" className="widget-btn mini danger" onClick={() => deleteSubject(subject.id)}>del</button>
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
              <h3>{selectedSubject.name} - Study Details</h3>
              <button className="close-btn" onClick={() => setSelectedSubjectId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Check the dates you studied {selectedSubject.name}:</p>
              <div className="checkbox-grid">
                {recentDays.map((date, i) => {
                  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const dateKey = date.toISOString().slice(0, 10);
                  const isChecked = selectedSubject.studyDates.includes(dateKey);
                  return (
                    <label key={i} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudyDate(selectedSubject.id, dateKey)}
                      />
                      <span className="custom-checkbox" style={{ '--check-color': selectedSubject.color } as React.CSSProperties}></span>
                      {dateStr}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectsList;

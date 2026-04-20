import React from 'react';
import { useData } from '../context/DataContext';
import { buildStudyContext } from '../lib/studyLogic';
import './StudyAssistant.css';

const StudyAssistant: React.FC = () => {
  const { data, askGeminiAssistant, planTomorrowStudySchedule } = useData();
  const [question, setQuestion] = React.useState('What should I focus on next based on my current study pattern?');
  const [assistantResponse, setAssistantResponse] = React.useState('Ask Gemini to review your study pattern, weak subjects, and streak risk.');
  const [status, setStatus] = React.useState('Ready');
  const [loading, setLoading] = React.useState(false);

  const context = buildStudyContext(data);
  const weakSubjectsPreview = context.weakSubjects.slice(0, 3);

  const runAssistant = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setStatus('Type a question first.');
      return;
    }

    setLoading(true);
    setStatus('Thinking with your study context...');
    const result = await askGeminiAssistant(trimmedQuestion);
    setLoading(false);
    setStatus(result.message);

    if (result.ok && result.response) {
      setAssistantResponse(result.response);
    }
  };

  const runTomorrowPlan = async () => {
    setLoading(true);
    setStatus('Building tomorrow’s plan...');
    const result = await planTomorrowStudySchedule();
    setLoading(false);
    setStatus(result.message);

    if (result.ok && result.plan) {
      setAssistantResponse([
        result.plan.summary,
        result.plan.motivation,
        ...result.plan.schedule.map((item) => `${item.startTime}-${item.endTime} • ${item.subject}: ${item.focus}`),
      ].join('\n'));
    }
  };

  return (
    <section className="card study-assistant-card">
      <div className="study-assistant-header">
        <div>
          <div className="study-assistant-kicker">Gemini AI Assistant</div>
          <h3>Personal study coach</h3>
        </div>
        <span className="assistant-status">{status}</span>
      </div>

      <div className="study-assistant-summary">
        <div>
          <small>Streak</small>
          <strong>{context.currentStreak} days</strong>
        </div>
        <div>
          <small>Today</small>
          <strong>{context.todayHours.toFixed(1)}h</strong>
        </div>
        <div>
          <small>Weak focus</small>
          <strong>{weakSubjectsPreview.length > 0 ? weakSubjectsPreview[0].name : 'Balanced'}</strong>
        </div>
      </div>

      <div className="study-assistant-chips" aria-label="Weak subjects overview">
        {weakSubjectsPreview.length > 0 ? weakSubjectsPreview.map((subject) => (
          <span key={subject.id} className="assistant-chip">
            {subject.name} · {subject.progress}%
          </span>
        )) : <span className="assistant-chip muted">No weak subjects right now.</span>}
      </div>

      <textarea
        className="study-assistant-input"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={4}
        aria-label="Ask Gemini a study question"
        placeholder="Ask for a study plan, motivation nudge, or subject-specific advice..."
      />

      <div className="study-assistant-actions">
        <button type="button" className="widget-btn assistant-action-btn" onClick={runAssistant} disabled={loading}>
          {loading ? 'Working...' : 'Ask Gemini'}
        </button>
        <button type="button" className="widget-btn assistant-action-btn secondary" onClick={runTomorrowPlan} disabled={loading}>
          Plan Tomorrow
        </button>
      </div>

      <div className="study-assistant-response" aria-live="polite">
        {assistantResponse.split('\n').map((line, index) => (
          <p key={`${index}-${line}`}>{line}</p>
        ))}
      </div>
    </section>
  );
};

export default StudyAssistant;

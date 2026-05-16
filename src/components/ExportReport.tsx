import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './ExportReport.css';

/**
 * Calculates the current study streak (consecutive days from today going backward).
 */
const calcStreak = (activityData: Record<string, number>): number => {
  const cursor = new Date();
  let streak = 0;
  while ((activityData[toDateKey(cursor)] ?? 0) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * ExportReport — "Download Weekly Report" button that generates a PDF summary
 * using html2canvas + jsPDF.
 * Report includes: total hours, sessions, subject breakdown, current streak.
 */
const ExportReport: React.FC = () => {
  const { data } = useData();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();

  // Weekly stats (last 7 days)
  const weeklyHours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    return data.activityData[toDateKey(d)] ?? 0;
  }).reduce((s, h) => s + h, 0);

  const totalHours = Object.values(data.activityData).reduce((s, h) => s + h, 0);
  const streak     = calcStreak(data.activityData);
  const weekLabel  = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  /**
   * Generates and downloads a PDF of the hidden report div.
   */
  const handleExport = async () => {
    if (!reportRef.current) return;
    setLoading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#050c23',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfW  = pdf.internal.pageSize.getWidth();
      const pdfH  = (canvas.height / canvas.width) * pdfW;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`StudyNX_Report_${toDateKey(now)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="export-report-btn"
        onClick={handleExport}
        disabled={loading}
        aria-label="Download weekly study report as PDF"
      >
        {loading ? (
          <span className="export-spinner" aria-hidden="true" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        {loading ? 'Generating…' : 'Download Weekly Report'}
      </button>

      {/* Hidden report rendered off-screen for html2canvas */}
      <div className="export-report-hidden" aria-hidden="true">
        <div ref={reportRef} className="export-report-doc">
          <div className="export-report-header">
            <div className="export-report-logo">📚 StudyNX</div>
            <div className="export-report-date">Week ending {weekLabel}</div>
          </div>

          <div className="export-metrics-grid">
            <div className="export-metric">
              <div className="export-metric-value">{weeklyHours.toFixed(1)}h</div>
              <div className="export-metric-label">This Week</div>
            </div>
            <div className="export-metric">
              <div className="export-metric-value">{totalHours.toFixed(1)}h</div>
              <div className="export-metric-label">Total Hours</div>
            </div>
            <div className="export-metric">
              <div className="export-metric-value">🔥 {streak}</div>
              <div className="export-metric-label">Day Streak</div>
            </div>
          </div>

          <div className="export-section-title">Subject Breakdown</div>
          {data.subjects.length === 0 ? (
            <p className="export-empty">No subjects tracked yet.</p>
          ) : (
            <div className="export-subjects">
              {data.subjects.map(subject => (
                <div key={subject.id} className="export-subject-row">
                  <span className="export-subject-dot" style={{ backgroundColor: subject.color }} />
                  <span className="export-subject-name">{subject.name}</span>
                  <span className="export-subject-hours">{subject.totalHours.toFixed(1)}h</span>
                  <div className="export-subject-bar">
                    <div
                      className="export-subject-fill"
                      style={{
                        width: `${Math.min(100, (subject.totalHours / Math.max(1, subject.targetHours)) * 100)}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="export-footer">Generated by StudyNX • {now.toLocaleString()}</div>
        </div>
      </div>
    </>
  );
};

export default ExportReport;

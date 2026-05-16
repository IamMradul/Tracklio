import React, { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './SubjectCharts.css';

Chart.register(
  BarController, BarElement,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
);

/**
 * Reads a CSS custom property value from the document root.
 * Used to pass theme-aware colors into Chart.js which lives outside React.
 */
const getCssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * SubjectCharts — shows two Chart.js visualisations:
 *  1. Bar chart: study hours per subject this week
 *  2. Doughnut chart: time distribution across subjects
 * Colors are derived from each subject's own color and respect the active theme.
 */
const SubjectCharts: React.FC = () => {
  const { data } = useData();
  const barRef  = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const barChart  = useRef<Chart | null>(null);
  const donutChart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!barRef.current || !donutRef.current) return;

    const now = new Date();

    // Hours per subject this week
    const weeklySubjectHours = data.subjects.map(subject => {
      const hours = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return subject.dailyHours[toDateKey(d)] ?? 0;
      }).reduce((s, h) => s + h, 0);
      return { name: subject.name, hours, color: subject.color };
    });

    const gridColor  = getCssVar('--chart-grid')  || 'rgba(122,147,255,0.12)';
    const labelColor = getCssVar('--chart-label') || '#97a8d5';

    // ── Bar chart ──────────────────────────────────────────────────
    const barData: ChartData<'bar'> = {
      labels: weeklySubjectHours.map(s => s.name),
      datasets: [{
        label: 'Hours this week',
        data: weeklySubjectHours.map(s => s.hours),
        backgroundColor: weeklySubjectHours.map(s => `${s.color}99`),
        borderColor:     weeklySubjectHours.map(s => s.color),
        borderWidth: 2,
        borderRadius: 6,
      }],
    };

    const barOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} hrs` } },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } }, beginAtZero: true },
      },
    };

    if (barChart.current) barChart.current.destroy();
    barChart.current = new Chart(barRef.current, { type: 'bar', data: barData, options: barOptions });

    // ── Doughnut chart ─────────────────────────────────────────────
    const totalSubjectHours = weeklySubjectHours.map(s => s.hours);
    const hasData = totalSubjectHours.some(h => h > 0);

    const donutData: ChartData<'doughnut'> = {
      labels: weeklySubjectHours.map(s => s.name),
      datasets: [{
        data: hasData ? totalSubjectHours : [1],
        backgroundColor: hasData
          ? weeklySubjectHours.map(s => `${s.color}bb`)
          : ['rgba(122,147,255,0.1)'],
        borderColor: hasData
          ? weeklySubjectHours.map(s => s.color)
          : ['rgba(122,147,255,0.2)'],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    };

    const donutOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: labelColor,
            font: { size: 11 },
            padding: 12,
            boxWidth: 12,
          },
        },
        tooltip: hasData
          ? { callbacks: { label: ctx => ` ${ctx.label}: ${(ctx.parsed as number).toFixed(1)}h` } }
          : { filter: () => false },
      },
    };

    if (donutChart.current) donutChart.current.destroy();
    donutChart.current = new Chart(donutRef.current, { type: 'doughnut', data: donutData, options: donutOptions });

    return () => {
      barChart.current?.destroy();
      donutChart.current?.destroy();
    };
  // Rebuild charts whenever subjects, activityData, or theme change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.subjects, data.activityData]);

  const hasSubjects = data.subjects.length > 0;

  return (
    <section className="subject-charts card">
      <div className="subject-charts-header">
        <h3 className="subject-charts-title">Subject Progress Charts</h3>
        <span className="subject-charts-sub">This week</span>
      </div>

      {!hasSubjects ? (
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <rect x="6" y="34" width="12" height="16" rx="2" fill="currentColor" opacity=".3"/>
            <rect x="22" y="22" width="12" height="28" rx="2" fill="currentColor" opacity=".5"/>
            <rect x="38" y="12" width="12" height="38" rx="2" fill="currentColor" opacity=".7"/>
          </svg>
          <p>Add subjects to see your weekly study distribution here.</p>
        </div>
      ) : (
        <div className="subject-charts-grid">
          <div className="chart-block">
            <div className="chart-label">Hours per subject</div>
            <div className="bar-chart-wrap">
              <canvas ref={barRef} />
            </div>
          </div>
          <div className="chart-block">
            <div className="chart-label">Time distribution</div>
            <div className="donut-chart-wrap">
              <canvas ref={donutRef} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SubjectCharts;

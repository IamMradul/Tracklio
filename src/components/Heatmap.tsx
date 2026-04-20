import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './Heatmap.css';
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getBucketClass = (hours: number) => {
  if (hours <= 0) return 'bucket-0';
  if (hours <= 1.5) return 'bucket-1';
  if (hours <= 3) return 'bucket-2';
  if (hours <= 5) return 'bucket-3';
  return 'bucket-4';
};

type MonthCell = {
  dateKey: string | null;
  hours: number;
  inMonth: boolean;
};

const buildMonthCells = (year: number, monthIndex: number, activityData: Record<string, number>) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const cells: MonthCell[] = Array.from({ length: 42 }, () => ({
    dateKey: null,
    hours: 0,
    inMonth: false,
  }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const flatIndex = firstWeekday + day - 1;
    const dateKey = toDateKey(new Date(year, monthIndex, day));
    cells[flatIndex] = {
      dateKey,
      hours: activityData[dateKey] ?? 0,
      inMonth: true,
    };
  }

  const columns = Array.from({ length: 6 }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, weekday) => cells[weekIndex * 7 + weekday]);
  });

  const monthHours = cells.reduce((sum, cell) => sum + (cell.inMonth ? cell.hours : 0), 0);
  return { columns, monthHours };
};

const Heatmap: React.FC = () => {
  const { data, logStudySession } = useData();
  const now = new Date();
  const year = now.getFullYear();
  const todayKey = toDateKey(now);
  const todayHours = data.activityData[todayKey] ?? 0;
  const [todayHoursInput, setTodayHoursInput] = useState(String(todayHours));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  useEffect(() => {
    setTodayHoursInput(String(todayHours));
  }, [todayHours]);

  const saveTodayHours = async () => {
    const parsedHours = Number.parseFloat(todayHoursInput);
    if (!Number.isFinite(parsedHours) || parsedHours < 0) {
      return;
    }

    await logStudySession({
      source: 'heatmap',
      dateKey: todayKey,
      hours: Number(parsedHours.toFixed(1)),
    });
  };

  const months = monthNames.map((monthLabel, monthIndex) => {
    const { columns, monthHours } = buildMonthCells(year, monthIndex, data.activityData);

    return {
      monthLabel,
      columns,
      monthHours,
      isCurrentMonth: monthIndex === now.getMonth(),
    };
  });

  const totalYearHours = months.reduce((sum, month) => sum + month.monthHours, 0);
  const selectedDateHours = data.activityData[selectedDateKey] ?? 0;
  const selectedDateLabel = new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <section className="card heatmap-container">
      <div className="heatmap-title-row">
        <h3>Yearly Heatmap</h3>
        <span>{year} • {totalYearHours.toFixed(1)}h total</span>
      </div>

      <div className="heatmap-log-row">
        <div>
          <span className="heatmap-log-label">Today</span>
          <strong className="heatmap-log-value">{todayHours.toFixed(1)}h logged</strong>
        </div>
        <div className="heatmap-log-controls">
          <input
            type="number"
            min="0"
            step="0.5"
            className="heatmap-hours-input"
            value={todayHoursInput}
            onChange={(e) => setTodayHoursInput(e.target.value)}
            placeholder="0.0"
          />
          <button type="button" className="widget-btn" onClick={saveTodayHours}>Save today</button>
        </div>
      </div>

      <div className="heatmap-selection-row" aria-live="polite">
        <span className="heatmap-selection-label">Selected day</span>
        <strong>{selectedDateLabel}</strong>
        <span>{selectedDateHours.toFixed(1)}h studied</span>
      </div>

      <div className="year-heatmap-strip" aria-label="Yearly study heatmap">
        {months.map((month) => (
          <article key={month.monthLabel} className={`month-block ${month.isCurrentMonth ? 'current-month' : ''}`}>
            <div className="month-dot-grid">
              {month.columns.map((weekColumn, weekIndex) => (
                <div className="week-column" key={`${month.monthLabel}-w${weekIndex}`}>
                  {weekColumn.map((cell, dayIndex) => {
                    if (!cell.inMonth || !cell.dateKey) {
                      return (
                        <span
                          key={`${month.monthLabel}-empty-${weekIndex}-${dayIndex}`}
                          className="month-dot empty"
                          aria-hidden="true"
                        ></span>
                      );
                    }

                    const dateKey = cell.dateKey;

                    const dateLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    });

                    return (
                      <button
                        key={`${month.monthLabel}-${dateKey}`}
                        type="button"
                        className={`month-dot month-dot-button ${getBucketClass(cell.hours)} ${selectedDateKey === dateKey ? 'selected' : ''}`}
                        title={`${dateLabel}: ${cell.hours.toFixed(1)}h`}
                        aria-label={`${dateLabel}, ${cell.hours.toFixed(1)} hours studied`}
                        aria-pressed={selectedDateKey === dateKey}
                        onClick={() => setSelectedDateKey(dateKey)}
                      ></button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="month-meta">
              <strong>{month.monthLabel}</strong>
              <small>{month.monthHours.toFixed(1)}h</small>
            </div>
          </article>
        ))}
      </div>

      <div className="heatmap-legend-row">
        <span>Less</span>
        <i className="legend-dot bucket-0"></i>
        <i className="legend-dot bucket-1"></i>
        <i className="legend-dot bucket-2"></i>
        <i className="legend-dot bucket-3"></i>
        <i className="legend-dot bucket-4"></i>
        <span>More</span>
      </div>
    </section>
  );
};

export default Heatmap;

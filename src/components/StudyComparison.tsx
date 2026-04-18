import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import './StudyComparison.css';

type Timeframe = 'weekly' | 'monthly' | 'yearly';

const StudyComparison: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const { data } = useData();

  const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
  const readHours = (date: Date) => data.activityData[toDateKey(date)] ?? 0;

  const dataMap = {
    weekly: (() => {
      const now = new Date();
      return Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - idx));
        return {
          label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
          value: readHours(d),
          max: 10,
        };
      });
    })(),
    monthly: (() => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = now.getDate();
      const weekCount = Math.ceil(today / 7);

      return Array.from({ length: Math.max(4, weekCount) }, (_, idx) => {
        const from = idx * 7 + 1;
        const to = Math.min((idx + 1) * 7, today);
        let total = 0;
        for (let day = from; day <= to; day += 1) {
          const d = new Date(start.getFullYear(), start.getMonth(), day);
          total += readHours(d);
        }

        return {
          label: `W${idx + 1}`,
          value: total,
          max: 70,
        };
      });
    })(),
    yearly: (() => {
      const year = new Date().getFullYear();

      return Array.from({ length: 4 }, (_, quarterIdx) => {
        const startMonth = quarterIdx * 3;
        const endMonth = startMonth + 2;
        let total = 0;

        for (let month = startMonth; month <= endMonth; month += 1) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          for (let day = 1; day <= daysInMonth; day += 1) {
            total += readHours(new Date(year, month, day));
          }
        }

        return {
          label: `Q${quarterIdx + 1}`,
          value: total,
          max: Math.max(140, total || 140),
        };
      });
    })()
  };

  const currentData = dataMap[timeframe];

  return (
    <div className="card comparison-container">
      <div className="card-title">STUDY HOURS — COMPARISON</div>
      
      <div className="toggle-group">
        <button 
          className={`toggle-btn ${timeframe === 'weekly' ? 'active' : ''}`}
          onClick={() => setTimeframe('weekly')}
        >
          weekly
        </button>
        <button 
          className={`toggle-btn ${timeframe === 'monthly' ? 'active' : ''}`}
          onClick={() => setTimeframe('monthly')}
        >
          monthly
        </button>
        <button 
          className={`toggle-btn ${timeframe === 'yearly' ? 'active' : ''}`}
          onClick={() => setTimeframe('yearly')}
        >
          yearly
        </button>
      </div>

      <div className="bars-container">
        {currentData.map((item, index) => {
          const widthPercent = (item.value / item.max) * 100;
          return (
            <div key={index} className="bar-row">
              <div className="bar-label">{item.label}</div>
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ width: `${widthPercent}%` }}
                ></div>
              </div>
              <div className="bar-value">{item.value.toFixed(1)}h</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyComparison;

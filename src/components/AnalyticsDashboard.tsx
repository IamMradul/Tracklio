import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { useData } from '../context/DataContext';
import './AnalyticsDashboard.css';

const AMBER = '#f5a623';
const BLUE = '#5f8dff';
const QUALITY_COLORS = ['#ff5f74', '#ffad4c', '#f5cc23', '#86ebb0', '#18d5b6']; // Red to Green

const AnalyticsDashboard: React.FC = () => {
  const { data } = useData();
  const [trendsView, setTrendsView] = useState<'line' | 'bar'>('line');

  // 1. Focus Trends Data (Last 14 days)
  const trendsData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split('T')[0];
      const hours = data.activityData[key] || 0;
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutes: Math.round(hours * 60),
      };
    });
    return last14Days;
  }, [data.activityData]);

  // 2. Subject Distribution Data
  const distributionData = useMemo(() => {
    if (data.subjects.length === 0) {
      return [];
    }
    const total = data.subjects.reduce((sum, s) => sum + s.totalHours, 0) || 1;
    return data.subjects.map(s => ({
      name: s.name,
      value: Math.round((s.totalHours / total) * 100),
      hours: s.totalHours,
      color: s.color,
    })).filter(s => s.hours > 0).sort((a, b) => b.value - a.value);
  }, [data.subjects]);

  // 3. Time of Day Data (Mocked if sessionLogs empty)
  const timeOfDayData = useMemo(() => {
    const hourly = Array.from({ length: 12 }, (_, i) => {
      const hour = (i * 2) + 0; // 0, 2, 4, ... 22
      const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      
      // Try to find sessions in this window
      let count = 0;
      if (data.sessionLogs.length > 0) {
        count = data.sessionLogs.filter(s => {
          const h = new Date(s.startTime).getHours();
          return h >= hour && h < hour + 2;
        }).reduce((sum, s) => sum + s.durationMinutes, 0);
      } else {
        // Fallback: If no session logs, but we have activityData, distribute activityData slightly
        // for "Time of Day" to not look empty, but only for today
        const todayKey = new Date().toISOString().split('T')[0];
        const todayHours = data.activityData[todayKey] || 0;
        if (todayHours > 0 && hour >= 10 && hour <= 18) {
          count = (todayHours * 60) / 5; // Split today's hours across typical study window
        }
      }

      return { label, count };
    });
    return hourly;
  }, [data.sessionLogs, data.activityData]);

  // 4. Session Quality Data
  const qualityData = useMemo(() => {
    const ratings = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
    if (data.sessionLogs.length === 0) {
      return [];
    }
    return ratings.map((name, i) => {
      const count = data.sessionLogs.filter(s => s.quality === i + 1).length;
      return { name, value: count };
    }).filter(q => q.value > 0);
  }, [data.sessionLogs]);

  // 5. Weekly Patterns (Radar)
  const weeklyPatterns = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => {
      // Find intensity (avg hours for this day of week over last 4 weeks)
      let intensity = 0;
      const count = 4;
      for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + days.indexOf(day) - (i * 7));
        const key = d.toISOString().split('T')[0];
        intensity += data.activityData[key] || 0;
      }
      return { subject: day, A: Math.round((intensity / count) * 60) };
    });
  }, [data.activityData]);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-grid">
        
        {/* Focus Trends */}
        <div className="analytics-card trends-card">
          <div className="card-header">
            <h3>Focus Trends</h3>
            <div className="toggle-group-mini">
              <button 
                className={trendsView === 'line' ? 'active' : ''} 
                onClick={() => setTrendsView('line')}
              >
                <i className="chart-icon">📈</i>
              </button>
              <button 
                className={trendsView === 'bar' ? 'active' : ''} 
                onClick={() => setTrendsView('bar')}
              >
                <i className="chart-icon">📊</i>
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              {trendsView === 'line' ? (
                <AreaChart data={trendsData}>
                  <defs>
                    <linearGradient id="colorAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: AMBER }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke={AMBER} fillOpacity={1} fill="url(#colorAmber)" strokeWidth={3} />
                </AreaChart>
              ) : (
                <BarChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(245, 166, 35, 0.05)' }}
                  />
                  <Bar dataKey="minutes" fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="analytics-card distribution-card">
          <div className="card-header">
            <h3>Subject Distribution</h3>
          </div>
          <div className="chart-container donut-layout">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="total-label">Total</span>
                <span className="total-value">{distributionData.reduce((sum, d) => sum + d.hours, 0).toFixed(0)}h</span>
              </div>
            </div>
            <div className="donut-legend">
              {distributionData.slice(0, 5).map((d, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: d.color }}></span>
                  <span className="legend-name">{d.name}:</span>
                  <span className="legend-value">{d.hours.toFixed(1)}h ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time of Day Activity */}
        <div className="analytics-card activity-card">
          <div className="card-header">
            <h3>Time of Day Activity</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="label" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(95, 141, 255, 0.05)' }}
                />
                <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Quality */}
        <div className="analytics-card quality-card">
          <div className="card-header">
            <h3>Session Quality Distribution</h3>
          </div>
          <div className="chart-container quality-layout">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="quality-legend">
              {['Excel', 'Good', 'Avg', 'Poor', 'V.Poor'].reverse().map((label, i) => (
                <div key={i} className="q-legend-item">
                  <span className="q-legend-dot" style={{ backgroundColor: QUALITY_COLORS[4-i] }}></span>
                  <span className="q-legend-stars">{'⭐'.repeat(5-i)}</span>
                  <span className="q-legend-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Focus Patterns */}
        <div className="analytics-card patterns-card">
          <div className="card-header">
            <h3>Weekly Focus Patterns</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={weeklyPatterns}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" stroke="#777" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 600]} stroke="#444" fontSize={10} />
                <Radar
                  name="Minutes"
                  dataKey="A"
                  stroke={AMBER}
                  fill={AMBER}
                  fillOpacity={0.4}
                />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;

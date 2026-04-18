import React from 'react';
import { useData } from '../context/DataContext';
import TopStats from './TopStats';
import Heatmap from './Heatmap';
import SubjectsList from './SubjectsList';
import StudyComparison from './StudyComparison';
import { Pomodoro, ExamCountdown, WeeklyGoal } from './Phase7Widgets';
import { Resources, Reminders, CalendarWidget } from './Phase8Widgets';

const Dashboard: React.FC = () => {
  const { data, logout } = useData();

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="logo">
          Track<span>lio</span>
        </div>

        <div className="nav-pill-group">
          <button className="nav-pill active">Overview</button>
          <button className="nav-pill">Sessions</button>
          <button className="nav-pill">Insights</button>
        </div>

        <div className="profile-avatar" onClick={logout} title="Click to logout" style={{ cursor: 'pointer' }}>
          {data.user?.avatar || 'AK'}
        </div>
      </nav>

      <main className="dashboard-layout">
        <section className="dashboard-main">
          <Heatmap />
          <TopStats />
          <div className="dashboard-main-grid">
            <SubjectsList />
            <StudyComparison />
            <Resources />
            <Reminders />
          </div>
        </section>

        <aside className="dashboard-sidebar">
          <CalendarWidget />
          <Pomodoro />
          <ExamCountdown />
          <WeeklyGoal />
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;

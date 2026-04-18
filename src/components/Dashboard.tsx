import React from 'react';
import { useData } from '../context/DataContext';
import TopStats from './TopStats';
import Heatmap from './Heatmap';
import SubjectsList from './SubjectsList';
import StudyComparison from './StudyComparison';
import { Pomodoro, ExamCountdown, WeeklyGoal } from './Phase7Widgets';
import { Resources, Reminders, CalendarWidget } from './Phase8Widgets';
import InsightsPanel from './InsightsPanel';

type DashboardTab = 'overview' | 'sessions' | 'insights';

const Dashboard: React.FC = () => {
  const { data, logout } = useData();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="logo">
          Track<span>lio</span>
        </div>

        <div className="nav-pill-group">
          <button
            className={`nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={`nav-pill ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>

        <div className="profile-avatar" onClick={logout} title="Click to logout" style={{ cursor: 'pointer' }}>
          {data.user?.avatar || 'AK'}
        </div>
      </nav>

      {activeTab === 'overview' && (
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
      )}

      {activeTab === 'sessions' && (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <Heatmap />
            <CalendarWidget />
          </section>

          <aside className="dashboard-sidebar">
            <Pomodoro />
            <WeeklyGoal />
            <ExamCountdown />
          </aside>
        </main>
      )}

      {activeTab === 'insights' && (
        <main className="dashboard-layout dashboard-layout-single">
          <section className="dashboard-main">
            <InsightsPanel />
          </section>
        </main>
      )}
    </div>
  );
};

export default Dashboard;

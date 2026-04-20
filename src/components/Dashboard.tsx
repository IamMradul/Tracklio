import React from 'react';
import { useData } from '../context/DataContext';
import TopStats from './TopStats';
import Heatmap from './Heatmap';
import SubjectsList from './SubjectsList';
import StudyComparison from './StudyComparison';
import { Pomodoro, ExamCountdown, WeeklyGoal } from './Phase7Widgets';
import { Resources, Reminders, CalendarWidget } from './Phase8Widgets';
import InsightsPanel from './InsightsPanel';
import StudyAssistant from './StudyAssistant';

type DashboardTab = 'overview' | 'sessions' | 'insights';

const Dashboard: React.FC = () => {
  const { data, logout, requestAuthPrompt } = useData();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="logo">
          <img src="/StudyNX.png" alt="StudyNX logo" className="logo-mark" />
          Study<span>NX</span>
        </div>

        <div className="nav-pill-group">
          <button
            type="button"
            className={`nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            type="button"
            className={`nav-pill ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>

        {data.isLoggedIn ? (
          <button type="button" className="profile-avatar profile-button" onClick={logout} aria-label="Log out of StudyNX" title="Click to logout">
            {data.user?.avatar || 'AK'}
          </button>
        ) : (
          <button
            type="button"
            className="profile-avatar profile-button profile-signin-button"
            onClick={() => requestAuthPrompt('Sign in to save your changes.')}
            aria-label="Sign in to StudyNX"
            title="Click to sign in"
          >
            Sign in
          </button>
        )}
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
            <StudyAssistant />
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
            <StudyAssistant />
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

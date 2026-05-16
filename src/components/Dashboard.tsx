import React from 'react';
import { useData } from '../context/DataContext';
import TopStats from './TopStats';
import Heatmap from './Heatmap';
import SubjectsList from './SubjectsList';
import StudyComparison from './StudyComparison';
import { Pomodoro, ExamCountdown, WeeklyGoal } from './Phase7Widgets';
import { Resources, Reminders, CalendarWidget } from './Phase8Widgets';
import InsightsPanel from './InsightsPanel';
import ThemeToggle from './ThemeToggle';
import StreakBadge from './StreakBadge';
import SubjectCharts from './SubjectCharts';
import DailyGoal from './DailyGoal';
import ExportReport from './ExportReport';
import AnalyticsDashboard from './AnalyticsDashboard';

type DashboardTab = 'overview' | 'sessions' | 'insights';

const Dashboard: React.FC = () => {
  const { data, logout, requestAuthPrompt } = useData();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');

  return (
    <div className="app-container">
      <nav className="top-nav" aria-label="Main navigation">
        {/* Brand */}
        <div className="logo">
          <img src="/StudyNX.png" alt="StudyNX logo" className="logo-mark" />
          Study<span>NX</span>
        </div>

        {/* Tab pills */}
        <div className="nav-pill-group" role="tablist" aria-label="Dashboard views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sessions'}
            className={`nav-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'insights'}
            className={`nav-pill ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>

        {/* Right-side controls */}
        <div className="nav-right">
          <StreakBadge />
          <ThemeToggle />
          {data.isLoggedIn ? (
            <button
              type="button"
              className="profile-avatar profile-button"
              onClick={logout}
              aria-label="Log out of StudyNX"
              title="Click to logout"
            >
              {data.user?.avatar || 'SN'}
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
        </div>
      </nav>

      {/* ── Overview tab ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <main className="dashboard-layout" role="main">
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

          <aside className="dashboard-sidebar" aria-label="Widgets">
            <DailyGoal />
            <Pomodoro />
            <CalendarWidget />
            <ExamCountdown />
            <WeeklyGoal />
          </aside>
        </main>
      )}

      {/* ── Sessions tab ─────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <main className="dashboard-layout" role="main">
          <section className="dashboard-main">
            <Heatmap />
            <CalendarWidget />
          </section>

          <aside className="dashboard-sidebar" aria-label="Widgets">
            <DailyGoal />
            <Pomodoro />
            <WeeklyGoal />
            <ExamCountdown />
          </aside>
        </main>
      )}

      {/* ── Insights tab ─────────────────────────────────── */}
      {activeTab === 'insights' && (
        <main className="dashboard-layout dashboard-layout-single" role="main">
          <section className="dashboard-main">
            <InsightsPanel />
            <AnalyticsDashboard />
            <div className="insights-bottom-row">
              <ExportReport />
            </div>
          </section>
        </main>
      )}
    </div>
  );
};

export default Dashboard;

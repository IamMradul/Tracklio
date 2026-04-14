import React from 'react';
import { useData } from '../context/DataContext';
import TopStats from './TopStats';
import Heatmap from './Heatmap';
import SubjectsList from './SubjectsList';
import StudyComparison from './StudyComparison';
import { Pomodoro, ExamCountdown, WeeklyGoal } from './Phase7Widgets';

const Dashboard: React.FC = () => {
  const { data, logout } = useData();

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="logo">
          study<span>arc</span>
        </div>
        
        <div className="nav-pill-group">
          <button className="nav-pill active">dashboard</button>
          <button className="nav-pill">notes</button>
          <button className="nav-pill">settings</button>
        </div>

        <div 
          className="profile-avatar" 
          onClick={logout} 
          title="Click to logout" 
          style={{ cursor: 'pointer' }}
        >
          {data.user?.avatar || 'AK'}
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-grid">
        <TopStats />
        <Heatmap />
        
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SubjectsList />
          <StudyComparison />
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Pomodoro />
          <ExamCountdown />
          <WeeklyGoal />
        </div>

      </main>
    </div>
  );
};

export default Dashboard;

import './App.css'

function App() {
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

        <div className="profile-avatar">
          AK
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-grid">
        {/* We will add dashboard components here in Phase 3 */}
      </main>
    </div>
  )
}

export default App

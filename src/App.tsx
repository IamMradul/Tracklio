import { useEffect, useState } from 'react';
import { useData } from './context/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

type LegalRoute = 'terms' | 'privacy' | null;

const getLegalRouteFromHash = (): LegalRoute => {
  const hash = window.location.hash.toLowerCase();

  if (hash === '#/terms' || hash === '#terms') {
    return 'terms';
  }

  if (hash === '#/privacy' || hash === '#privacy') {
    return 'privacy';
  }

  return null;
};

function App() {
  const { authPromptMessage, dismissAuthPrompt } = useData();
  const [legalRoute, setLegalRoute] = useState<LegalRoute>(() => getLegalRouteFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setLegalRoute(getLegalRouteFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  let content = null;

  if (legalRoute === 'terms') {
    content = <TermsOfService />;
  } else if (legalRoute === 'privacy') {
    content = <PrivacyPolicy />;
  } else {
    content = <Dashboard />;
  }

  return (
    <div className="app-shell">
      <div className="app-view">{content}</div>

      <footer className="site-footer" aria-label="Legal links">
        <p className="site-footer-text">© {new Date().getFullYear()} StudyNX</p>
        <nav className="site-footer-links" aria-label="Terms and privacy">
          <a href="#/terms">Terms of Service</a>
          <span aria-hidden="true">•</span>
          <a href="#/privacy">Privacy Policy</a>
        </nav>
      </footer>

      {authPromptMessage && legalRoute === null && (
        <Login message={authPromptMessage} onDismiss={dismissAuthPrompt} />
      )}
    </div>
  );
}

export default App;

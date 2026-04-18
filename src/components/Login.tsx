import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import './Login.css';

type AuthView = 'signin' | 'signup' | 'magic';

const Login: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localName, setLocalName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);
  const {
    login,
    authMode,
    signInWithGoogle,
    requestEmailSignIn,
    signInWithPassword,
    signUpWithPassword,
    requestPasswordReset,
  } = useData();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode !== 'local') {
      return;
    }

    if (localName.trim()) {
      login(localName.trim());
    }
  };

  const setResult = (ok: boolean, message: string) => {
    setFeedbackTone(ok ? 'success' : 'error');
    setFeedback(message);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await signInWithPassword(email.trim(), password);
    setResult(result.ok, result.message);
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setResult(false, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setResult(false, 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await signUpWithPassword(email.trim(), password);
    setResult(result.ok, result.message);
    setSubmitting(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setResult(false, 'Enter your email first.');
      return;
    }

    setSubmitting(true);
    const result = await requestEmailSignIn(normalizedEmail);
    setResult(result.ok, result.message);
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setResult(false, 'Enter your email to reset password.');
      return;
    }

    setSubmitting(true);
    const result = await requestPasswordReset(normalizedEmail);
    setResult(result.ok, result.message);
    setSubmitting(false);
  };

  const switchView = (nextView: AuthView) => {
    setAuthView(nextView);
    setFeedback(null);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    const result = await signInWithGoogle();
    setResult(result.ok, result.message);
    setSubmitting(false);
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="login-logo">
          Track<span>lio</span>
        </div>

        {authMode === 'google-direct' ? (
          <div className="google-only-panel">
            <p className="login-helper">Sign in directly with your Google account</p>
            <button
              type="button"
              className="google-auth-btn"
              disabled={submitting}
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </button>
            {feedback && <p className={`login-feedback ${feedbackTone}`}>{feedback}</p>}
          </div>
        ) : authMode === 'supabase-email' ? (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authView === 'signin' ? 'active' : ''}`}
                onClick={() => switchView('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${authView === 'signup' ? 'active' : ''}`}
                onClick={() => switchView('signup')}
              >
                Sign Up
              </button>
              <button
                type="button"
                className={`auth-tab ${authView === 'magic' ? 'active' : ''}`}
                onClick={() => switchView('magic')}
              >
                Magic Link
              </button>
            </div>

            {authView === 'signin' && (
              <form onSubmit={handleSignIn}>
                <p className="login-helper">Sign in with your email and password</p>
                <input
                  type="email"
                  className="login-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit" className="login-btn" disabled={submitting}>
                  {submitting ? 'Signing In...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  className="auth-link-btn"
                  disabled={submitting}
                  onClick={handleResetPassword}
                >
                  Forgot password?
                </button>
              </form>
            )}

            {authView === 'signup' && (
              <form onSubmit={handleSignUp}>
                <p className="login-helper">Create a new account</p>
                <input
                  type="email"
                  className="login-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="submit" className="login-btn" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            )}

            {authView === 'magic' && (
              <form onSubmit={handleMagicLink}>
                <p className="login-helper">Sign in via one-time magic link</p>
                <input
                  type="email"
                  className="login-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="login-btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            )}

            {feedback && <p className={`login-feedback ${feedbackTone}`}>{feedback}</p>}
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <p className="login-helper">Local mode (no Supabase)</p>
            <input
              type="text"
              className="login-input"
              placeholder="Enter your name to continue..."
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
            <button type="submit" className="login-btn">
              Enter Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

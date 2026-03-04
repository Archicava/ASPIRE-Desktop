import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../components/AuthContext';

export function LoginPage() {
  const { user, login, loading, error, webAppBaseUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/workspace';

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFormError('Username and password are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await login({
        username: username.trim(),
        password
      });
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <form className="panel login-card" onSubmit={handleSubmit}>
        <header>
          <p className="eyebrow">ASPIRE Desktop</p>
          <h1>Sign in</h1>
          <p className="login-copy">
            Authenticate with the same credentials used by the ASPIRE web platform.
          </p>
          <p className="login-meta">
            Backend: {webAppBaseUrl ?? 'Unavailable'}
          </p>
        </header>

        <label className="form-label">
          <span>Username</span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="operator"
            autoComplete="username"
          />
        </label>

        <label className="form-label">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </label>

        {formError || error ? (
          <p className="form-error">{formError ?? error}</p>
        ) : null}

        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

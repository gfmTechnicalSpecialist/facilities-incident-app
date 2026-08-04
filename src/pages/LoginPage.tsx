import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

type LoginUser = {
  id: string;
  fullName: string;
};

type LoginCardProps = {
  role: UserRole;
  heading: string;
  users: LoginUser[];
};

function LoginCard({ role, heading, users }: LoginCardProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!selectedUserId) {
      setMessage('Please select your name.');
      return;
    }

    if (!password.trim()) {
      setMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await login(role, selectedUserId, password);

      if (result.ok) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setMessage(result.message);
    } catch (error) {
      console.error('Login failed:', error);
      setMessage('Could not reach the sign-in service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !isLoading) {
      void handleLogin();
    }
  }

  return (
    <section className="card auth-card login-role-card">
      <div className="auth-tab-panel">
        <div>
          <p className="eyebrow">
            {role === 'admin' ? 'Enter as Admin' : 'Enter as Viewer'}
          </p>

          <h2>{heading}</h2>
        </div>

        <div className="fields login-card-fields">
          <label>
            <span>Select your name</span>

            <select
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setMessage('');
              }}
              disabled={isLoading}
            >
              <option value="">Choose a user</option>

              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Password</span>

            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <button
          className="solid-button full-width login-gradient-button"
          type="button"
          onClick={() => void handleLogin()}
          disabled={isLoading}
        >
          <KeyRound size={16} />

          {isLoading ? 'Signing in…' : 'Log in'}
        </button>

        {message && (
          <p
            className={
              message.toLowerCase().includes('successful')
                ? 'success-text'
                : 'form-error'
            }
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

export function LoginPage() {
  const { user, adminUsers, viewerUsers } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-shell final-login-shell">
      <div className="login-panel hero-panel">
        <Logo className="hero-logo" />

        <p className="eyebrow">Momentum Group</p>

        <h1>Facilities Incident Hub</h1>

        <p>
          Capture facility incidents, track action status, manage viewer review
          and approval, and print clean report PDFs when work is closed.
        </p>

        <div className="hero-points card translucent-card">
          <p>Admins log and update reports.</p>
          <p>Viewers review, approve, and comment.</p>
          <p>Dashboard and closed reports print cleanly to PDF.</p>
        </div>
      </div>

      <div className="login-panel auth-panel dual-login-panel">
        <LoginCard
          role="admin"
          heading="Admin sign in"
          users={adminUsers.map((item) => ({
            id: item.id,
            fullName: item.fullName,
          }))}
        />

        <LoginCard
          role="viewer"
          heading="Viewer sign in"
          users={viewerUsers.map((item) => ({
            id: item.id,
            fullName: item.fullName,
          }))}
        />
      </div>
    </div>
  );
}
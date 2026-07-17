import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

function LoginCard({
  role,
  heading,
  users,
}: {
  role: UserRole;
  heading: string;
  users: { id: string; fullName: string }[];
}) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setIsLoading(true);
    setMessage('');
    const result = await login(role, selectedUserId, password);
    if (result.ok) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setMessage(result.message);
    setIsLoading(false);
  }

  return (
    <div className="auth-tab-panel">
      <div>
        <p className="eyebrow">{role === 'admin' ? 'Enter as Admin' : 'Enter as Viewer'}</p>
        <h2>{heading}</h2>
      </div>
      <div className="fields one-column">
        <label>
          <span>Select your name</span>
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
      </div>
      <button className="solid-button full-width" type="button" onClick={handleLogin} disabled={isLoading}>
        <KeyRound size={16} /> {isLoading ? 'Signing in…' : 'Log in'}
      </button>
      {message && <p className={message.includes('successful') ? 'success-text' : 'form-error'}>{message}</p>}
    </div>
  );
}

export function LoginPage() {
  const { user, adminUsers, viewerUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>('admin');

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
          Capture facility incidents, track action status, manage viewer review and approval, and print clean report PDFs
          when work is closed.
        </p>
        <div className="hero-points card translucent-card">
          <p>Admins log and update reports.</p>
          <p>Viewers review, approve, and comment.</p>
          <p>Dashboard and closed reports print cleanly to PDF.</p>
        </div>
      </div>

      <div className="login-panel auth-panel">
        <section className="card auth-card auth-card-tabbed">
          <div className="auth-tabs">
            <button
              type="button"
              className={activeTab === 'admin' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={activeTab === 'viewer' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => setActiveTab('viewer')}
            >
              Viewer
            </button>
          </div>
          {activeTab === 'admin' ? (
            <LoginCard
              role="admin"
              heading="Admin sign in"
              users={adminUsers.map((item) => ({ id: item.id, fullName: item.fullName }))}
            />
          ) : (
            <LoginCard
              role="viewer"
              heading="Viewer sign in"
              users={viewerUsers.map((item) => ({ id: item.id, fullName: item.fullName }))}
            />
          )}
        </section>
      </div>
    </div>
  );
}


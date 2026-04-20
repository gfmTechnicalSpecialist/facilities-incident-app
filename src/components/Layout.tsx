import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, Eye, EyeOff, LogOut, PlusCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

export function Layout() {
  const { user, logout, changePassword } = useAuth();
  const location = useLocation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  function handlePasswordChange() {
    const result = changePassword(currentPassword, newPassword);
    setPasswordMessage(result.message);
    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="brand">
            <Logo className="brand-logo" />
            <div>
              <p className="eyebrow">Momentum Group</p>
              <h1>Incident Hub</h1>
            </div>
          </div>

          <nav className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ShieldAlert size={18} /> Dashboard
            </NavLink>
            <NavLink to="/incidents" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ClipboardList size={18} /> Reports
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/incidents/new" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <PlusCircle size={18} /> Log report
              </NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-name">Logged in as</p>
            <p className="user-meta strong">{user?.fullName}</p>
            <p className="user-meta">{user?.role === 'admin' ? 'Admin access' : 'Viewer access'}</p>
          </div>

          <div className="user-card no-print password-card visible-panel">
            <div className="password-card-header">
              <p className="user-name">Change password</p>
              <button className="password-toggle on-dark" type="button" onClick={() => setShowPasswords((value) => !value)}>
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="password-card-fields">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
              />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
              />
              <button className="solid-button full-width" type="button" onClick={handlePasswordChange}>
                Save password
              </button>
              {passwordMessage && <p className={passwordMessage.includes('successfully') ? 'sidebar-message success' : 'sidebar-message error'}>{passwordMessage}</p>}
            </div>
          </div>
          <button className="ghost-button full-width no-print" type="button" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar no-print">
          <div>
            <p className="eyebrow">Facilities Incident Management</p>
            <h2>{location.pathname === '/dashboard' ? 'Overview' : 'Incident workspace'}</h2>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

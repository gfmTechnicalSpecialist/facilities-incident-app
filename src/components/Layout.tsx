import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, LogOut, PlusCircle, ShieldAlert, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { isApprover } from '../utils/constants';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

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
            <NavLink to="/incidents" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ClipboardList size={18} /> Reports
            </NavLink>
            <NavLink to="/my-reports" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <User size={18} /> My Reports
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/incidents/new" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <PlusCircle size={18} /> Log report
              </NavLink>
            )}
            {isApprover(user) && (
              <NavLink to="/approvals" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <ClipboardList size={18} /> Approvals
              </NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-name">Logged in as</p>
            <p className="user-meta strong">{user?.fullName}</p>
            <p className="user-meta">{user?.role === 'admin' ? 'Admin access' : 'Viewer access'}</p>
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
            <h2>{
              location.pathname === '/dashboard' ? 'Overview'
              : location.pathname === '/incidents/new' ? 'Log report'
              : location.pathname.includes('/incidents/view/') ? 'Incident detail'
              : location.pathname === '/incidents' ? 'Incident workspace'
              : location.pathname === '/reports' ? 'Reports'
              : location.pathname === '/approvals' ? 'Approvals'
              : 'Incident workspace'
            }</h2>
          </div>
        </header>

        <Outlet key={location.pathname} />
      </main>

      <nav className="mobile-nav no-print">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
          <ShieldAlert size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/incidents" end className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
          <ClipboardList size={20} />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/my-reports" className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
          <User size={20} />
          <span>Mine</span>
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/incidents/new" className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
            <PlusCircle size={20} />
            <span>Log</span>
          </NavLink>
        )}
        {isApprover(user) && (
          <NavLink to="/approvals" className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
            <ClipboardList size={20} />
            <span>Approvals</span>
          </NavLink>
        )}
        <button className="mobile-nav-link mobile-nav-logout" type="button" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}

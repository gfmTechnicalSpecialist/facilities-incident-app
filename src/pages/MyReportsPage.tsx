import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardEdit, Eye, FolderClock, Loader2, ShieldEllipsis } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { actionStatuses } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel } from '../utils/helpers';
import { API_BASE } from '../lib/apiBase';
import type { ActionStatus } from '../types';

const USER_REPORTS_URL = `${API_BASE}/api/GetUserReports?code=awKAfLvDmotkEbqd2UUHUs_Ca3lSLfmH-91Fss_I2zsoAzFuEdhOow==`;

interface ApiUserReport {
  incidentId: string;
  title: string;
  site: string;
  type: string;
  severity: string;
  actionStatus: string;
  approvalStatus: string;
  date: string;
}

export function MyReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ApiUserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'All'>('All');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(USER_REPORTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: user.fullName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<ApiUserReport[]>;
      })
      .then((data) => { if (!cancelled) setReports(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load your reports');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    return reports.filter((i) => {
      const haystack = [i.title, i.incidentId, i.site, i.type].join(' ').toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || i.actionStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  const totalCount = reports.length;
  const openCount = reports.filter((i) => i.actionStatus === 'Open').length;
  const inProgressCount = reports.filter((i) => i.actionStatus === 'In Progress' || i.actionStatus === 'Pending Review').length;
  const closedCount = reports.filter((i) => i.actionStatus === 'Closed').length;

  return (
    <div className="page-stack">

      {/* Header */}
      <header className="card my-reports-header">
        <div className="my-reports-header-left">
          <p className="eyebrow">Personal records</p>
          <h2 className="dashboard-title">My Reports</h2>
          <p className="dashboard-subtitle">
            Incidents submitted under your account - track status, approval and make edits where permitted.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/incidents/new" className="solid-button">
            + Log new report
          </Link>
        )}
      </header>

      {/* Loading */}
      {loading && (
        <div className="card loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading your reports...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card">
          <p className="muted-text" style={{ color: 'var(--red)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI summary */}
          <section className="my-reports-kpi-row">
            <div className="card my-reports-kpi-card" style={{ borderLeft: '5px solid #0057b8' }}>
              <span className="my-reports-kpi-icon" style={{ background: '#0057b81a', color: '#0057b8' }}>
                <ShieldEllipsis size={18} />
              </span>
              <div>
                <p className="stat-label-v2">Total submitted</p>
                <p className="my-reports-kpi-value">{totalCount}</p>
              </div>
            </div>
            <div className="card my-reports-kpi-card" style={{ borderLeft: '5px solid #ffb000' }}>
              <span className="my-reports-kpi-icon" style={{ background: '#ffb0001a', color: '#b07800' }}>
                <FolderClock size={18} />
              </span>
              <div>
                <p className="stat-label-v2">Open</p>
                <p className="my-reports-kpi-value">{openCount}</p>
              </div>
            </div>
            <div className="card my-reports-kpi-card" style={{ borderLeft: '5px solid #7b61ff' }}>
              <span className="my-reports-kpi-icon" style={{ background: '#7b61ff1a', color: '#5a41d9' }}>
                <Loader2 size={18} />
              </span>
              <div>
                <p className="stat-label-v2">In progress / review</p>
                <p className="my-reports-kpi-value">{inProgressCount}</p>
              </div>
            </div>
            <div className="card my-reports-kpi-card" style={{ borderLeft: '5px solid #43a047' }}>
              <span className="my-reports-kpi-icon" style={{ background: '#43a0471a', color: '#2e7031' }}>
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="stat-label-v2">Closed</p>
                <p className="my-reports-kpi-value">{closedCount}</p>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="card filters-card no-print">
            <div className="my-reports-filters">
              <label className="my-reports-search-label">
                <span>Search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, ID, site or type..."
                />
              </label>
              <label>
                <span>Action status</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'All')}>
                  <option value="All">All statuses</option>
                  {actionStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Table */}
          {filtered.length === 0 ? (
            <section className="card">
              {totalCount === 0 ? (
                <div className="my-reports-empty">
                  <p className="eyebrow">No reports found</p>
                  <p className="muted-text">You have not submitted any incident reports yet.</p>
                  {user?.role === 'admin' && (
                    <Link to="/incidents/new" className="solid-button" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                      Log your first report
                    </Link>
                  )}
                </div>
              ) : (
                <p className="muted-text">No reports match the current filters.</p>
              )}
            </section>
          ) : (
            <section className="card table-card">
              <div className="my-reports-table-header">
                <h3 className="my-reports-table-title">
                  {filtered.length} report{filtered.length === 1 ? '' : 's'}
                  {statusFilter !== 'All' && <span className="my-reports-filter-chip">{statusFilter}</span>}
                </h3>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Title</th>
                      <th>Site</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Action status</th>
                      <th>Approval</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((incident) => (
                      <tr key={incident.incidentId}>
                        <td><span className="my-reports-ref">{incident.incidentId}</span></td>
                        <td><span className="my-reports-title-cell">{incident.title}</span></td>
                        <td>{incident.site}</td>
                        <td>{incident.type}</td>
                        <td>
                          <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                        </td>
                        <td>
                          <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                            {incident.actionStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>
                            {approvalStatusLabel(incident.approvalStatus)}
                          </span>
                        </td>
                        <td>{incident.date}</td>
                        <td>
                          <div className="my-reports-actions">
                            <button
                              className="ghost-button my-reports-action-btn"
                              type="button"
                              onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                              title="View report"
                            >
                              <Eye size={15} /> View
                            </button>
                            {user?.role === 'admin' && incident.actionStatus !== 'Closed' && (
                              <button
                                className="outline-button my-reports-action-btn"
                                type="button"
                                onClick={() => navigate(`/incidents/view/${incident.incidentId}/edit`)}
                                title="Edit report"
                              >
                                <ClipboardEdit size={15} /> Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

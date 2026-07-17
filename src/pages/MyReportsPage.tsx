import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardEdit, Eye, FolderClock, Loader2, ShieldEllipsis } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { actionStatuses } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel } from '../utils/helpers';
import { MobileReportCard } from '../components/MobileReportCard';
import { USER_REPORTS_API_URL } from '../lib/apiBase';
import type { ActionStatus } from '../types';

const USER_REPORTS_URL = USER_REPORTS_API_URL;

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
    <div className="page-stack pbi-dashboard">

      {/* Header */}
      <header className="pbi-header">
        <div className="my-reports-header-left">
          <h2 className="pbi-title">My Reports</h2>
          <p className="pbi-subtitle">
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
          <section className="pbi-kpi-row">
            <div className="pbi-tile pbi-kpi" style={{ ['--kpi-accent' as string]: '#118DFF' }}>
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon"><ShieldEllipsis size={16} /></span>
                <span className="pbi-kpi-label">Total Submitted</span>
              </div>
              <p className="pbi-kpi-value">{totalCount}</p>
            </div>
            <div className="pbi-tile pbi-kpi" style={{ ['--kpi-accent' as string]: '#E66C37' }}>
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon"><FolderClock size={16} /></span>
                <span className="pbi-kpi-label">Open</span>
              </div>
              <p className="pbi-kpi-value">{openCount}</p>
            </div>
            <div className="pbi-tile pbi-kpi" style={{ ['--kpi-accent' as string]: '#6B007B' }}>
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon"><Loader2 size={16} /></span>
                <span className="pbi-kpi-label">In Progress / Review</span>
              </div>
              <p className="pbi-kpi-value">{inProgressCount}</p>
            </div>
            <div className="pbi-tile pbi-kpi" style={{ ['--kpi-accent' as string]: '#107C10' }}>
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon"><CheckCircle2 size={16} /></span>
                <span className="pbi-kpi-label">Closed</span>
              </div>
              <p className="pbi-kpi-value">{closedCount}</p>
            </div>
          </section>

          {/* Filters */}
          <section className="pbi-tile filters-card no-print">
            <div className="pbi-visual-header">
              <p className="pbi-visual-title">Filters</p>
            </div>
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
            <section className="pbi-tile">
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
            <section className="pbi-tile table-card">
              <div className="my-reports-table-header">
                <h3 className="my-reports-table-title">
                  {filtered.length} report{filtered.length === 1 ? '' : 's'}
                  {statusFilter !== 'All' && <span className="my-reports-filter-chip">{statusFilter}</span>}
                </h3>
              </div>
              <div className="table-scroll desktop-only">
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
                        <td data-label="Reference"><span className="my-reports-ref">{incident.incidentId}</span></td>
                        <td data-label="Title"><span className="my-reports-title-cell">{incident.title}</span></td>
                        <td data-label="Site">{incident.site}</td>
                        <td data-label="Type">{incident.type}</td>
                        <td data-label="Severity">
                          <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                        </td>
                        <td data-label="Action status">
                          <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                            {incident.actionStatus}
                          </span>
                        </td>
                        <td data-label="Approval">
                          <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>
                            {approvalStatusLabel(incident.approvalStatus)}
                          </span>
                        </td>
                        <td data-label="Date">{incident.date}</td>
                        <td data-label="Actions">
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

              <div className="m-card-list mobile-only">
                {filtered.map((incident) => (
                  <MobileReportCard
                    key={incident.incidentId}
                    reference={incident.incidentId}
                    title={incident.title}
                    badge={<span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>}
                    fields={[
                      { label: 'Site', value: incident.site },
                      { label: 'Type', value: incident.type },
                      {
                        label: 'Action status',
                        value: <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{incident.actionStatus}</span>,
                      },
                      {
                        label: 'Approval',
                        value: <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>,
                      },
                      { label: 'Date', value: incident.date },
                    ]}
                    actions={
                      <>
                        <button
                          className="ghost-button my-reports-action-btn"
                          type="button"
                          onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                        >
                          <Eye size={15} /> View
                        </button>
                        {user?.role === 'admin' && incident.actionStatus !== 'Closed' && (
                          <button
                            className="outline-button my-reports-action-btn"
                            type="button"
                            onClick={() => navigate(`/incidents/view/${incident.incidentId}/edit`)}
                          >
                            <ClipboardEdit size={15} /> Edit
                          </button>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardEdit, Eye, FolderClock, Loader2, Search, ShieldEllipsis } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { actionStatuses } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel, sortIncidentsByApprovalPriority } from '../utils/helpers';
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
  const [activeTab, setActiveTab] = useState<'submitted' | 'drafts'>('submitted');

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

  const draftReports = useMemo(() => reports.filter((i) => i.approvalStatus === 'Draft'), [reports]);
  const submittedReports = useMemo(() => reports.filter((i) => i.approvalStatus !== 'Draft'), [reports]);

  const filtered = useMemo(() => {
    return sortIncidentsByApprovalPriority(submittedReports.filter((i) => {
      const haystack = [i.title, i.incidentId, i.site, i.type].join(' ').toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || i.actionStatus === statusFilter;
      return matchSearch && matchStatus;
    }));
  }, [submittedReports, search, statusFilter]);

  const totalCount = submittedReports.length;
  const openCount = submittedReports.filter((i) => i.actionStatus === 'Open').length;
  const inProgressCount = submittedReports.filter((i) => i.actionStatus === 'In Progress' || i.actionStatus === 'Pending Review').length;
  const closedCount = submittedReports.filter((i) => i.actionStatus === 'Closed').length;

  const stats = [
    { key: 'total', label: 'Total submitted', value: totalCount, accent: '#118DFF', icon: <ShieldEllipsis size={15} /> },
    { key: 'open', label: 'Open', value: openCount, accent: '#E66C37', icon: <FolderClock size={15} /> },
    { key: 'progress', label: 'In progress / review', value: inProgressCount, accent: '#6B007B', icon: <Loader2 size={15} /> },
    { key: 'closed', label: 'Closed', value: closedCount, accent: '#107C10', icon: <CheckCircle2 size={15} /> },
  ];

  return (
    <div className="page-stack pbi-dashboard">

      {/* Overview: title, action and inline KPI strip */}
      <section className="my-reports-overview">
        <div className="my-reports-overview-head">
          <div className="my-reports-overview-titles">
            <h2 className="pbi-title">My Reports</h2>
            <p className="pbi-subtitle">
              Incidents submitted under your account &mdash; track status, approval and make edits where permitted.
            </p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/incidents/new" className="solid-button">
              + Log new report
            </Link>
          )}
        </div>

        {!loading && !error && (
          <dl className="my-reports-stat-strip">
            {stats.map((stat) => (
              <div className="my-reports-stat" key={stat.key} style={{ ['--stat-accent' as string]: stat.accent }}>
                <span className="my-reports-stat-icon">{stat.icon}</span>
                <div className="my-reports-stat-text">
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

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
          <section className="pbi-tile table-card my-reports-panel">
            <div className="my-reports-panel-head">
              <div className="my-reports-tabs" role="tablist" aria-label="Report groups">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'submitted'}
                  className={activeTab === 'submitted' ? 'my-reports-tab active' : 'my-reports-tab'}
                  onClick={() => setActiveTab('submitted')}
                >
                  Submitted <span className="my-reports-tab-count">{submittedReports.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'drafts'}
                  className={activeTab === 'drafts' ? 'my-reports-tab active' : 'my-reports-tab'}
                  onClick={() => setActiveTab('drafts')}
                >
                  Drafts <span className="my-reports-tab-count">{draftReports.length}</span>
                </button>
              </div>

              {activeTab === 'submitted' && (
                <div className="my-reports-toolbar no-print">
                  <div className="my-reports-search">
                    <Search size={15} aria-hidden="true" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, ID, site or type..."
                      aria-label="Search reports"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'All')}
                    aria-label="Filter by action status"
                  >
                    <option value="All">All statuses</option>
                    {actionStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeTab === 'drafts' ? (
              draftReports.length === 0 ? (
                <div className="my-reports-empty">
                  <p className="eyebrow">No drafts</p>
                  <p className="muted-text">Reports you save without submitting will appear here.</p>
                </div>
              ) : (
                <div className="my-reports-drafts-list">
                  {draftReports.map((incident) => (
                    <div key={incident.incidentId} className="my-reports-draft-item">
                      <div className="my-reports-draft-info">
                        <span className="my-reports-title-cell">{incident.title || 'Untitled draft'}</span>
                        <span className="my-reports-draft-meta">{incident.site} • {incident.date}</span>
                      </div>
                      <button
                        className="outline-button my-reports-action-btn"
                        type="button"
                        onClick={() => navigate(`/incidents/view/${incident.incidentId}/edit`)}
                      >
                        <ClipboardEdit size={15} /> Continue editing
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : filtered.length === 0 ? (
              totalCount === 0 ? (
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
                <div className="my-reports-empty">
                  <p className="muted-text">No reports match the current filters.</p>
                </div>
              )
            ) : (
              <>
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
                            {user?.role === 'admin' && incident.approvalStatus !== 'Approved' && (incident.actionStatus !== 'Closed' || incident.approvalStatus === 'Rejected') && (
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
                        {user?.role === 'admin' && incident.approvalStatus !== 'Approved' && (incident.actionStatus !== 'Closed' || incident.approvalStatus === 'Rejected') && (
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
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

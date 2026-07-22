import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { actionStatuses, severities, sites } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel } from '../utils/helpers';
import { MobileReportCard } from '../components/MobileReportCard';
import { REPORTS_DATA_API_URL } from '../lib/apiBase';
import { useAuth } from '../contexts/AuthContext';
import { ApprovalDialog } from '../components/ApprovalDialog';

const INCIDENTS_API_URL = REPORTS_DATA_API_URL;

interface ApiIncident {
  incidentId: string;
  title: string;
  site: string;
  type: string;
  severity: string;
  actionStatus: string;
  approvalStatus: string;
  date: string;
}

interface MonthGroup {
  monthGroup: string;
  reportCount: number;
  incidents: ApiIncident[];
}

export function IncidentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewIncidentId, setReviewIncidentId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [site, setSite] = useState('All');
  const [type, setType] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isApprover = user?.role === 'approver';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(INCIDENTS_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<MonthGroup[]>;
      })
      .then((json) => {
        if (!cancelled) setGroups(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load incidents');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allIncidents = useMemo(() => groups.flatMap((g) => g.incidents), [groups]);

  const availableTypes = useMemo(
    () => [...new Set(allIncidents.map((i) => i.type))].sort(),
    [allIncidents],
  );

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        const filtered = group.incidents.filter((incident) => {
          const haystack = [incident.title, incident.incidentId, incident.site, incident.type]
            .join(' ')
            .toLowerCase();
          const matchesSearch = haystack.includes(search.toLowerCase());
          const matchesSite = site === 'All' || incident.site === site;
          const matchesType = type === 'All' || incident.type === type;
          const matchesSeverity = severity === 'All' || incident.severity === severity;
          const matchesStatus = status === 'All' || incident.actionStatus === status;
          const incidentDate = new Date(incident.date);
          const matchesFrom = !dateFrom || incidentDate >= new Date(dateFrom);
          const matchesTo = !dateTo || incidentDate <= new Date(dateTo);
          return matchesSearch && matchesSite && matchesType && matchesSeverity && matchesStatus && matchesFrom && matchesTo;
        });
        return { ...group, incidents: filtered };
      })
      .filter((group) => group.incidents.length > 0);
  }, [groups, search, site, type, severity, status, dateFrom, dateTo]);

  const totalFiltered = filteredGroups.reduce((sum, g) => sum + g.incidents.length, 0);

  if (loading) {
    return (
      <div className="page-stack pbi-dashboard">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incidents…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack pbi-dashboard">
        <p className="muted-text" style={{ color: 'var(--color-danger, #d71920)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-stack pbi-dashboard">
      <section className="pbi-tile filters-card no-print">
        <div className="pbi-visual-header">
          <p className="pbi-visual-title">Filters</p>
        </div>
        <div className="filters-grid filters-grid-wide final-filters-grid">
          <label>
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, ID, site, or type" />
          </label>
          <label>
            <span>Site</span>
            <select value={site} onChange={(e) => setSite(e.target.value)}>
              <option>All</option>
              {sites.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>All</option>
              {availableTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Severity</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>All</option>
              {severities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Action status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {actionStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Date from</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            <span>Date to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
      </section>

      {filteredGroups.map((group) => (
        <section className="pbi-tile table-card" key={group.monthGroup}>
          <div className="grouped-header">
            <h3>{group.monthGroup}</h3>
            <p className="muted-text">{group.incidents.length} report{group.incidents.length === 1 ? '' : 's'}</p>
          </div>
          <div className="table-scroll desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Title</th>
                  <th>Site</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Action status</th>
                  <th>Approval status</th>
                  <th>Date</th>
                  {isApprover && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {group.incidents.map((incident) => (
                  <tr
                    key={incident.incidentId}
                    className="clickable-row"
                    onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                  >
                    <td data-label="Incident ID">{incident.incidentId}</td>
                    <td data-label="Title">{incident.title}</td>
                    <td data-label="Site">{incident.site}</td>
                    <td data-label="Type">{incident.type}</td>
                    <td data-label="Severity">
                      <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                    </td>
                    <td data-label="Action status">
                      <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{incident.actionStatus}</span>
                    </td>
                    <td data-label="Approval status">
                      <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>
                    </td>
                    <td data-label="Date">{incident.date}</td>
                    {isApprover && (
                      <td data-label="Actions">
                        {incident.approvalStatus === 'Pending' && (
                          <button
                            className="outline-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewIncidentId(incident.incidentId);
                            }}
                          >
                            Review
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="m-card-list mobile-only">
            {group.incidents.map((incident) => (
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
                  <div className="inline-actions">
                    <button
                      className="solid-button full-width"
                      type="button"
                      onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                    >
                      View report
                    </button>
                    {isApprover && incident.approvalStatus === 'Pending' && (
                      <button
                        className="outline-button full-width"
                        type="button"
                        onClick={() => setReviewIncidentId(incident.incidentId)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </section>
      ))}

      {!loading && totalFiltered === 0 && (
        <section className="pbi-tile"><p className="muted-text">No reports match the current filters.</p></section>
      )}

      {reviewIncidentId && (
        <ApprovalDialog
          incidentId={reviewIncidentId}
          onClose={() => setReviewIncidentId(null)}
          onSubmitted={(status) => {
            setGroups((prev) =>
              prev.map((group) => ({
                ...group,
                incidents: group.incidents.map((incident) =>
                  incident.incidentId === reviewIncidentId ? { ...incident, approvalStatus: status } : incident,
                ),
              })),
            );
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { actionStatuses, severities, sites } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel } from '../utils/helpers';
import { API_BASE } from '../lib/apiBase';

const INCIDENTS_API_URL = `${API_BASE}/api/GetReportsData?code=0kvBybL_C3lVuX5kuG2KjA1vUox0iXnt_GrJYgFMqatZAzFuJjpabQ==`;

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
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [site, setSite] = useState('All');
  const [type, setType] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
      <div className="page-stack">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incidents…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <p className="muted-text" style={{ color: 'var(--color-danger, #d71920)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="card filters-card no-print">
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
        <section className="card table-card" key={group.monthGroup}>
          <div className="grouped-header">
            <h3>{group.monthGroup}</h3>
            <p className="muted-text">{group.incidents.length} report{group.incidents.length === 1 ? '' : 's'}</p>
          </div>
          <div className="table-scroll">
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
                </tr>
              </thead>
              <tbody>
                {group.incidents.map((incident) => (
                  <tr
                    key={incident.incidentId}
                    className="clickable-row"
                    onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                  >
                    <td>{incident.incidentId}</td>
                    <td>{incident.title}</td>
                    <td>{incident.site}</td>
                    <td>{incident.type}</td>
                    <td>
                      <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                    </td>
                    <td>
                      <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{incident.actionStatus}</span>
                    </td>
                    <td>
                      <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>
                    </td>
                    <td>{incident.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {!loading && totalFiltered === 0 && (
        <section className="card"><p>No reports match the current filters.</p></section>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listIncidents } from '../services/incidentService';
import { actionStatuses, incidentCategories, severities, sites } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel, formatListDate, monthYearLabel } from '../utils/helpers';

export function IncidentsPage() {
  const incidents = listIncidents();
  const [search, setSearch] = useState('');
  const [site, setSite] = useState('All');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(
    () =>
      incidents.filter((incident) => {
        const haystack = [incident.title, incident.incidentId, incident.specificLocation, incident.incidentType, incident.reporterName]
          .join(' ')
          .toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesSite = site === 'All' || incident.site === site;
        const matchesCategory = category === 'All' || incident.incidentCategory === category;
        const matchesSeverity = severity === 'All' || incident.severity === severity;
        const matchesStatus = status === 'All' || incident.actionStatus === status;
        const matchesFrom = !dateFrom || incident.incidentDate >= dateFrom;
        const matchesTo = !dateTo || incident.incidentDate <= dateTo;
        return matchesSearch && matchesSite && matchesCategory && matchesSeverity && matchesStatus && matchesFrom && matchesTo;
      }),
    [category, dateFrom, dateTo, incidents, search, severity, site, status],
  );

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, typeof filtered>>((acc, incident) => {
      const key = monthYearLabel(incident.incidentDate);
      acc[key] = [...(acc[key] ?? []), incident];
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="page-stack">
      <section className="card filters-card no-print">
        <div className="filters-grid filters-grid-wide final-filters-grid">
          <label>
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, ID, location, reporter, or type" />
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
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              {incidentCategories.map((item) => (
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

      {Object.entries(grouped).map(([label, items]) => (
        <section className="card table-card" key={label}>
          <div className="grouped-header">
            <h3>{label}</h3>
            <p className="muted-text">{items.length} report{items.length === 1 ? '' : 's'}</p>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.incidentId}</td>
                    <td>{incident.title}</td>
                    <td>{incident.site}</td>
                    <td>{incident.incidentType === 'Other' && incident.otherIncidentType ? incident.otherIncidentType : incident.incidentType}</td>
                    <td>
                      <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                    </td>
                    <td>
                      <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{incident.actionStatus}</span>
                    </td>
                    <td>
                      <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>
                    </td>
                    <td>{formatListDate(incident.incidentDate)}</td>
                    <td>
                      <Link className="text-link" to={`/incidents/${incident.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {!filtered.length && <section className="card"><p>No reports match the current filters.</p></section>}
    </div>
  );
}

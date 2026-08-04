import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REPORTS_DATA_API_URL } from '../lib/apiBase';
import { approvalStatusClass, approvalStatusLabel, sortIncidentsByApprovalPriority } from '../utils/helpers';
import { MobileReportCard } from '../components/MobileReportCard';

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

export function ApprovalsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(REPORTS_DATA_API_URL)
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

  const approvalPriorityIncidents = useMemo(
    () => sortIncidentsByApprovalPriority(
      groups.flatMap((g) => g.incidents).filter(
        (incident) => incident.approvalStatus === 'Pending' || incident.approvalStatus === 'Rejected',
      ),
    ),
    [groups],
  );

  if (loading) {
    return (
      <div className="page-stack pbi-dashboard">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incidents awaiting approval…</p>
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
      <section className="pbi-tile table-card">
        <div className="grouped-header">
          <h3>Incidents awaiting approval / rejected</h3>
          <p className="muted-text">{approvalPriorityIncidents.length} report{approvalPriorityIncidents.length === 1 ? '' : 's'}</p>
        </div>
        <div className="table-scroll desktop-only">
          <table>
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Title</th>
                <th>Site</th>
                <th>Severity</th>
                <th>Approval status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {approvalPriorityIncidents.map((incident) => (
                <tr
                  key={incident.incidentId}
                  className="clickable-row"
                  onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                >
                  <td data-label="Incident ID">{incident.incidentId}</td>
                  <td data-label="Title">{incident.title}</td>
                  <td data-label="Site">{incident.site}</td>
                  <td data-label="Severity">
                    <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                  </td>
                  <td data-label="Approval status">
                    <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>
                  </td>
                  <td data-label="Date">{incident.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="m-card-list mobile-only">
          {approvalPriorityIncidents.map((incident) => (
            <MobileReportCard
              key={incident.incidentId}
              reference={incident.incidentId}
              title={incident.title}
              badge={<span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>}
              fields={[
                { label: 'Site', value: incident.site },
                {
                  label: 'Approval',
                  value: <span className={`approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>,
                },
                { label: 'Date', value: incident.date },
              ]}
              actions={
                <button
                  className="ghost-button my-reports-action-btn"
                  type="button"
                  onClick={() => navigate(`/incidents/view/${incident.incidentId}`, { state: incident })}
                >
                  View
                </button>
              }
            />
          ))}
        </div>
        {!approvalPriorityIncidents.length && <p className="muted-text">No incidents are currently awaiting approval or rejected.</p>}
      </section>
    </div>
  );
}


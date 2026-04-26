import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { incidentTypeColorMap, siteColorMap } from '../utils/helpers';

const REPORTS_API_URL =
  'https://gfmapi-fpgth4e8aqa8auae.northeurope-01.azurewebsites.net/api/GetReportsData?code=0kvBybL_C3lVuX5kuG2KjA1vUox0iXnt_GrJYgFMqatZAzFuJjpabQ==';

interface ReportIncident {
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
  incidents: ReportIncident[];
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

function tally(items: string[], colorMap: Record<string, string>): ChartItem[] {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1;
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value, color: colorMap[name] ?? '#6c757d' }))
    .sort((a, b) => b.value - a.value);
}

function severityClass(severity: string): string {
  if (severity === 'Critical') return 'badge badge-critical';
  if (severity === 'High') return 'badge badge-high';
  if (severity === 'Moderate') return 'badge badge-moderate';
  return 'badge badge-low';
}

export function ReportsPage() {
  const [groups, setGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(REPORTS_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<MonthGroup[]>;
      })
      .then((json) => {
        if (!cancelled) setGroups(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-stack">
        <p className="muted-text">Loading reports data…</p>
      </div>
    );
  }

  if (error || groups.length === 0) {
    return (
      <div className="page-stack">
        <p className="muted-text" style={{ color: 'var(--color-danger, #d71920)' }}>
          {error ?? 'No report data available.'}
        </p>
      </div>
    );
  }

  const allIncidents = groups.flatMap((g) => g.incidents);
  const byType = tally(allIncidents.map((i) => i.type), incidentTypeColorMap);
  const bySite = tally(allIncidents.map((i) => i.site), siteColorMap);

  return (
    <div className="page-stack">
      <section className="card headline-card">
        <div>
          <p className="eyebrow">Analysis</p>
          <h3>Which incidents are reported the most?</h3>
        </div>
        <p className="muted-text">The ranking cards and charts below make the most common incident types and affected sites easier to read.</p>
      </section>

      <section className="detail-grid">
        <div className="card">
          <h3>Incident type ranking</h3>
          <ol className="ranking-list">
            {byType.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3>Site ranking</h3>
          <ol className="ranking-list">
            {bySite.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="charts-grid">
        <div className="card chart-card">
          <h3>Incident type distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byType} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {byType.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Site distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bySite} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {bySite.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.monthGroup} className="card">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{group.monthGroup}</h3>
            <span className="muted-text">{group.reportCount} incident{group.reportCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Site</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {group.incidents.map((incident) => (
                  <tr key={incident.incidentId}>
                    <td><code>{incident.incidentId}</code></td>
                    <td>{incident.title}</td>
                    <td>{incident.site}</td>
                    <td>{incident.type}</td>
                    <td><span className={severityClass(incident.severity)}>{incident.severity}</span></td>
                    <td>{incident.actionStatus}</td>
                    <td>{incident.approvalStatus}</td>
                    <td>{incident.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

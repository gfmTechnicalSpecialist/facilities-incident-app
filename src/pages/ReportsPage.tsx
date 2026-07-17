import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { incidentTypeColorMap, siteColorMap } from '../utils/helpers';
import { REPORTS_DATA_API_URL } from '../lib/apiBase';

const REPORTS_API_URL = REPORTS_DATA_API_URL;

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
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading reports…</p>
        </div>
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
    <div className="page-stack pbi-dashboard">
      <header className="pbi-header">
        <div>
          <h2 className="pbi-title">Incident Analysis</h2>
          <p className="pbi-subtitle">Which incidents are reported the most? Rankings and distributions across types and sites.</p>
        </div>
      </header>

      <section className="detail-grid">
        <div className="pbi-tile">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Incident Type Ranking</p>
          </div>
          <ol className="ranking-list">
            {byType.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ol>
        </div>

        <div className="pbi-tile">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Site Ranking</p>
          </div>
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
        <div className="pbi-tile chart-card">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Incident Count by Type</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byType} margin={{ top: 18, right: 8, left: -14, bottom: 58 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E6E6E6" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" height={78} interval={0} tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={{ stroke: '#E6E6E6' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(17, 141, 255, 0.06)' }} contentStyle={{ borderRadius: 4, border: '1px solid #E6E6E6', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="value" name="Incidents" radius={[2, 2, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#252423' }} />
                {byType.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pbi-tile chart-card">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Incident Count by Site</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bySite} margin={{ top: 18, right: 8, left: -14, bottom: 8 }} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E6E6E6" />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={{ stroke: '#E6E6E6' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(17, 141, 255, 0.06)' }} contentStyle={{ borderRadius: 4, border: '1px solid #E6E6E6', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="value" name="Incidents" radius={[2, 2, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#252423' }} />
                {bySite.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.monthGroup} className="pbi-tile">
          <div className="grouped-header" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
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

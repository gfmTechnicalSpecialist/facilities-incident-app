import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderClock, Printer, ShieldEllipsis } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '../components/StatCard';
import { incidentTypeColorMap, monthPalette, siteColorMap } from '../utils/helpers';

const DASHBOARD_API_URL =
  'https://gfmapi-fpgth4e8aqa8auae.northeurope-01.azurewebsites.net/api/GetDashboardData?code=1FyUacAQl5-aBeSRIppmNIv2dfipzTbnhgzajeJTVD-OAzFu5DynZg==';

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardData {
  overview: {
    totalIncidents: number;
    openIncidents: number;
    closedIncidents: number;
    criticalIncidents: number;
    mostReportedType: string;
  };
  charts: {
    incidentsByType: { type: string; count: number }[];
    incidentsBySite: { site: string; count: number }[];
    monthlyTrend: { month: string; count: number }[];
  };
}

function mapByType(items: { type: string; count: number }[]): ChartItem[] {
  return items.map((item) => ({
    name: item.type,
    value: item.count,
    color: incidentTypeColorMap[item.type] ?? '#6c757d',
  }));
}

function mapBySite(items: { site: string; count: number }[]): ChartItem[] {
  return items.map((item) => ({
    name: item.site,
    value: item.count,
    color: siteColorMap[item.site] ?? '#6c757d',
  }));
}

function mapByMonth(items: { month: string; count: number }[]): ChartItem[] {
  return items.map((item, index) => ({
    name: item.month,
    value: item.count,
    color: monthPalette[index % monthPalette.length],
  }));
}

function LegendList({ items, title }: { items: ChartItem[]; title: string }) {
  return (
    <aside className="chart-legend-panel" aria-label={title}>
      <h4>{title}</h4>
      <ul className="chart-legend-list">
        {items.map((item) => (
          <li key={item.name}>
            <span className="legend-key" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(DASHBOARD_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<DashboardData>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
        <p className="muted-text">Loading dashboard data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-stack">
        <p className="muted-text" style={{ color: 'var(--color-danger, #d71920)' }}>
          {error ?? 'No data available.'}
        </p>
      </div>
    );
  }

  const { overview, charts } = data;
  const byType = mapByType(charts.incidentsByType);
  const bySite = mapBySite(charts.incidentsBySite);
  const byMonth = mapByMonth(charts.monthlyTrend);

  return (
    <div className="page-stack">
      <section className="page-actions no-print">
        <button className="solid-button" type="button" onClick={() => window.print()}>
          <Printer size={16} /> Print dashboard
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="Total incidents" value={overview.totalIncidents} subtext="All reports in the system" icon={<ShieldEllipsis />} />
        <StatCard label="Open incidents" value={overview.openIncidents} subtext="Items still being worked on" icon={<FolderClock />} />
        <StatCard label="Closed incidents" value={overview.closedIncidents} subtext="Resolved and reviewed" icon={<CheckCircle2 />} />
        <StatCard label="Critical incidents" value={overview.criticalIncidents} subtext="Highest severity count" icon={<AlertTriangle />} />
      </section>

      <section className="card headline-card">
        <div>
          <p className="eyebrow">Most reported incident type</p>
          <h3>{overview.mostReportedType}</h3>
        </div>
        <p className="muted-text">This helps the team see repeat failures and prioritise preventive action.</p>
      </section>

      <section className="card chart-card chart-card-split">
        <div className="chart-copy">
          <h3>Incidents by type</h3>
          <p className="muted-text">Each bar represents the number of reports logged for a specific incident type.</p>
        </div>
        <div className="chart-layout">
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byType} margin={{ top: 10, right: 10, left: 10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={90} interval={0} label={{ value: 'Incident type', position: 'insideBottom', offset: -48 }} />
                <YAxis allowDecimals={false} label={{ value: 'Number of reports', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Report count" radius={[8, 8, 0, 0]}>
                  {byType.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LegendList items={byType} title="Incident type key" />
        </div>
      </section>

      <section className="card chart-card chart-card-split">
        <div className="chart-copy">
          <h3>Incidents by site</h3>
          <p className="muted-text">Each slice shows what share of reports came from each site.</p>
        </div>
        <div className="chart-layout">
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie data={bySite} dataKey="value" nameKey="name" outerRadius={110} label>
                  {bySite.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendList items={bySite} title="Site key" />
        </div>
      </section>

      <section className="card chart-card chart-card-split">
        <div className="chart-copy">
          <h3>Monthly incident trend</h3>
          <p className="muted-text">This chart shows how many incidents were logged each month.</p>
        </div>
        <div className="chart-layout">
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byMonth} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                <YAxis allowDecimals={false} label={{ value: 'Number of reports', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Monthly incidents" radius={[8, 8, 0, 0]}>
                  {byMonth.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LegendList items={byMonth} title="Month key" />
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderClock, Printer, ShieldEllipsis, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '../components/StatCard';
import { incidentTypeColorMap, monthPalette, siteColorMap } from '../utils/helpers';
import { DASHBOARD_API_URL } from '../lib/apiBase';

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

function LegendRow({ items }: { items: ChartItem[] }) {
  return (
    <div className="chart-legend-row">
      {items.map((item) => (
        <span key={item.name} className="legend-row-item">
          <span className="legend-key" style={{ backgroundColor: item.color }} />
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
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
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading dashboard…</p>
        </div>
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

  const reportDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <header className="card dashboard-header">
        <div className="dashboard-header-left">
          <p className="eyebrow">Facilities Incident Management</p>
          <h2 className="dashboard-title">Operations Dashboard</h2>
          <p className="dashboard-subtitle">Live summary of incident activity across all sites and categories</p>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-meta">
            <p>Report generated</p>
            <strong>{reportDate}</strong>
          </div>
          <button className="solid-button no-print" type="button" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </header>

      {/* ── KPI cards ── */}
      <section className="stats-grid">
        <StatCard
          label="Total incidents"
          value={overview.totalIncidents}
          subtext="All reports logged in the system"
          icon={<ShieldEllipsis size={18} />}
          accentColor="#0057b8"
        />
        <StatCard
          label="Open incidents"
          value={overview.openIncidents}
          subtext="Currently under investigation"
          icon={<FolderClock size={18} />}
          accentColor="#ffb000"
        />
        <StatCard
          label="Closed incidents"
          value={overview.closedIncidents}
          subtext="Resolved and signed off"
          icon={<CheckCircle2 size={18} />}
          accentColor="#43a047"
        />
        <StatCard
          label="Critical incidents"
          value={overview.criticalIncidents}
          subtext="Highest severity — requires attention"
          icon={<AlertTriangle size={18} />}
          accentColor="#d71920"
        />
      </section>

      {/* ── Key insight ── */}
      <section className="card insight-card">
        <div>
          <p className="insight-label">Most reported incident type</p>
          <h3 className="insight-value">{overview.mostReportedType}</h3>
          <p className="insight-desc">
            This category accounts for the highest volume of reports. Review preventive measures to reduce recurrence across all sites.
          </p>
        </div>
        <span className="insight-badge">
          <TrendingUp size={14} />
          High frequency
        </span>
      </section>

      {/* ── Charts: by type & by site ── */}
      <div className="charts-two-col">
        <section className="card chart-card">
          <div className="section-title-bar">
            <h3>Incidents by type</h3>
            <p>Report count per category</p>
          </div>
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byType} margin={{ top: 10, right: 10, left: -10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" height={90} interval={0} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', fontSize: 12 }} />
                <Bar dataKey="value" name="Reports" radius={[5, 5, 0, 0]}>
                  {byType.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LegendRow items={byType} />
        </section>

        <section className="card chart-card">
          <div className="section-title-bar">
            <h3>Incidents by site</h3>
            <p>Distribution across facilities</p>
          </div>
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySite}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={48}
                  paddingAngle={3}
                >
                  {bySite.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendRow items={bySite} />
        </section>
      </div>

      {/* ── Monthly trend ── */}
      <section className="card chart-card">
        <div className="section-title-bar">
          <h3>Monthly incident trend</h3>
          <p>Volume of reports per calendar month</p>
        </div>
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byMonth} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', fontSize: 12 }} />
              <Bar dataKey="value" name="Incidents" radius={[5, 5, 0, 0]}>
                {byMonth.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

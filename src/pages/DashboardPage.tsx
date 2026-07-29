import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, FolderClock, Printer, ShieldEllipsis, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { incidentTypeColorMap, siteColorMap } from '../utils/helpers';
import { DASHBOARD_API_URL } from '../lib/apiBase';
import { PrintHeader } from '../components/PrintHeader';

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface PendingApprovalItem {
  reportId: string;
  reportName: string;
  submittedBy: string;
  dateSubmitted: string;
  status: string;
  site: string;
}

interface DashboardData {
  overview: {
    totalIncidents: number;
    openIncidents: number;
    closedIncidents: number;
    criticalIncidents: number;
    pendingApprovalsCount?: number;
    mostReportedType: string;
  };
  charts: {
    incidentsByType: { type: string; count: number }[];
    incidentsBySite: { site: string; count: number }[];
    monthlyTrend: { month: string; count: number }[];
  };
  pendingApprovals?: PendingApprovalItem[];
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
  return items.map((item) => ({
    name: item.month,
    value: item.count,
    color: '#118DFF',
  }));
}

function LegendRow({ items }: { items: ChartItem[] }) {
  return (
    <div className="pbi-legend">
      {items.map((item) => (
        <span key={item.name} className="pbi-legend-item">
          <span className="pbi-legend-swatch" style={{ backgroundColor: item.color }} />
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
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
      <div className="page-stack pbi-dashboard">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-stack pbi-dashboard">
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
  const pendingApprovalsCount = overview.pendingApprovalsCount ?? data.pendingApprovals?.length ?? 0;

  const reportDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const kpis = [
    { label: 'Total Incidents', value: overview.totalIncidents, icon: <ShieldEllipsis size={16} />, accent: '#118DFF' },
    { label: 'Open Incidents', value: overview.openIncidents, icon: <FolderClock size={16} />, accent: '#E66C37' },
    { label: 'Closed Incidents', value: overview.closedIncidents, icon: <CheckCircle2 size={16} />, accent: '#6B007B' },
    { label: 'Critical Incidents', value: overview.criticalIncidents, icon: <AlertTriangle size={16} />, accent: '#D64550' },
    {
      label: 'Pending Approvals',
      value: pendingApprovalsCount,
      icon: <ClipboardList size={16} />,
      accent: '#8A8886',
      onClick: () => navigate('/approvals'),
    },
  ];

  return (
    <div className="page-stack pbi-dashboard">
      <PrintHeader
        title="Facilities Incident Report"
        subtitle="Operations overview · All sites · All categories"
        reference={`Data as of ${reportDate}`}
      />
      {/* ── Report header bar ── */}
      <header className="pbi-header">
        <div className="pbi-header-left">
          <h2 className="pbi-title">Facilities Incident Report</h2>
          <p className="pbi-subtitle">Operations overview · All sites · All categories</p>
        </div>
        <div className="pbi-header-right">
          <span className="pbi-refresh">Data as of {reportDate}</span>
          <button className="solid-button no-print" type="button" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </header>

      {/* ── KPI card visuals ── */}
      <section className="pbi-kpi-row">
        {kpis.map((kpi) => (
          kpi.onClick ? (
            <button
              key={kpi.label}
              className="pbi-tile pbi-kpi pbi-kpi-button"
              style={{ ['--kpi-accent' as string]: kpi.accent }}
              type="button"
              onClick={kpi.onClick}
              aria-label={`Open ${kpi.label}`}
            >
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon">{kpi.icon}</span>
                <span className="pbi-kpi-label">{kpi.label}</span>
              </div>
              <p className="pbi-kpi-value">{kpi.value}</p>
            </button>
          ) : (
            <div key={kpi.label} className="pbi-tile pbi-kpi" style={{ ['--kpi-accent' as string]: kpi.accent }}>
              <div className="pbi-kpi-head">
                <span className="pbi-kpi-icon">{kpi.icon}</span>
                <span className="pbi-kpi-label">{kpi.label}</span>
              </div>
              <p className="pbi-kpi-value">{kpi.value}</p>
            </div>
          )
        ))}
      </section>

      {/* ── Key insight strip ── */}
      <section className="pbi-tile pbi-insight">
        <div>
          <p className="pbi-visual-title">Most Reported Incident Type</p>
          <h3 className="pbi-insight-value">{overview.mostReportedType}</h3>
        </div>
        <span className="pbi-insight-badge">
          <TrendingUp size={13} />
          Highest volume category
        </span>
      </section>

      {/* ── Charts: by type & by site (hidden on mobile) ── */}
      <div className="charts-two-col desktop-only">
        <section className="pbi-tile">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Incident Count by Type</p>
          </div>
          <div className="chart-canvas">
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
          <LegendRow items={byType} />
        </section>

        <section className="pbi-tile">
          <div className="pbi-visual-header">
            <p className="pbi-visual-title">Incidents by Site</p>
          </div>
          <div className="chart-canvas pbi-donut-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySite}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={112}
                  innerRadius={72}
                  paddingAngle={1.5}
                  strokeWidth={2}
                >
                  {bySite.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid #E6E6E6', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pbi-donut-center">
              <strong>{overview.totalIncidents}</strong>
              <span>Total</span>
            </div>
          </div>
          <LegendRow items={bySite} />
        </section>
      </div>

      {/* ── Monthly trend (hidden on mobile) ── */}
      <section className="pbi-tile desktop-only">
        <div className="pbi-visual-header">
          <p className="pbi-visual-title">Incident Count by Month</p>
        </div>
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byMonth} margin={{ top: 18, right: 16, left: -14, bottom: 4 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E6E6E6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={{ stroke: '#E6E6E6' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#605E5C' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(17, 141, 255, 0.06)' }} contentStyle={{ borderRadius: 4, border: '1px solid #E6E6E6', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="value" name="Incidents" fill="#118DFF" radius={[2, 2, 0, 0]} maxBarSize={36}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#252423' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

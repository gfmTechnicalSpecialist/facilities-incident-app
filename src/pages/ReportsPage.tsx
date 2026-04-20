import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { countBySite, countByType } from '../utils/helpers';
import { listIncidents } from '../services/incidentService';

export function ReportsPage() {
  const incidents = listIncidents();
  const byType = [...countByType(incidents)].sort((a, b) => b.value - a.value);
  const bySite = [...countBySite(incidents)].sort((a, b) => b.value - a.value);

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
    </div>
  );
}

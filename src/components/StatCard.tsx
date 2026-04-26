import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon?: ReactNode;
  accentColor?: string;
}

export function StatCard({ label, value, subtext, icon, accentColor = '#0057b8' }: StatCardProps) {
  const iconBg = `${accentColor}1a`;
  return (
    <div className="card stat-card-v2" style={{ borderLeft: `5px solid ${accentColor}` }}>
      <div className="stat-card-top">
        <p className="stat-label-v2">{label}</p>
        {icon && (
          <span className="stat-icon-wrap" style={{ background: iconBg, color: accentColor }}>
            {icon}
          </span>
        )}
      </div>
      <p className="stat-value-v2">{value}</p>
      <p className="stat-desc-v2">{subtext}</p>
    </div>
  );
}

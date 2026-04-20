import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, subtext, icon }: StatCardProps) {
  return (
    <div className="card stat-card">
      <div className="stat-header">
        <p>{label}</p>
        {icon}
      </div>
      <h3>{value}</h3>
      <p className="muted-text">{subtext}</p>
    </div>
  );
}

import { Logo } from './Logo';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  reference?: string;
}

/**
 * Print-only banner rendered at the top of every printed/PDF report.
 * Hidden on screen (`.print-only`) and revealed by the `@media print` rules.
 */
export function PrintHeader({ title, subtitle, reference }: PrintHeaderProps) {
  const printedOn = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-only print-doc-header">
      <div className="print-doc-header-brand">
        <Logo className="print-doc-logo" />
        <div className="print-doc-brand-text">
          <span className="print-doc-brand-name">Momentum Group</span>
          <span className="print-doc-brand-tag">Facilities Incident Reporting</span>
        </div>
      </div>
      <div className="print-doc-header-meta">
        <h1 className="print-doc-title">{title}</h1>
        {subtitle && <p className="print-doc-subtitle">{subtitle}</p>}
        <div className="print-doc-meta-line">
          {reference && <span className="print-doc-ref">{reference}</span>}
          <span className="print-doc-date">Generated {printedOn}</span>
        </div>
      </div>
    </div>
  );
}

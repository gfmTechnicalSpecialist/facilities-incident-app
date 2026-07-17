import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardField {
  label: string;
  value: ReactNode;
}

export function MobileReportCard({
  reference,
  title,
  badge,
  fields,
  actions,
}: {
  reference: string;
  title: string;
  badge?: ReactNode;
  fields: CardField[];
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={open ? 'm-card open' : 'm-card'}>
      <button className="m-card-summary" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="m-card-summary-main">
          <span className="m-card-ref">{reference}</span>
          <span className="m-card-title">{title}</span>
        </span>
        <span className="m-card-summary-side">
          {badge}
          <ChevronDown size={18} className="m-card-chevron" />
        </span>
      </button>
      {open && (
        <div className="m-card-body">
          <dl className="m-card-fields">
            {fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          {actions && <div className="m-card-actions">{actions}</div>}
        </div>
      )}
    </div>
  );
}

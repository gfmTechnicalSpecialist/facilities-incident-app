import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function CollapsibleFiltersCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const classes = ['pbi-tile', 'filters-card', 'collapsible-filters-card', open ? 'open' : 'collapsed', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      <button
        type="button"
        className="collapsible-filters-card-head"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="pbi-visual-header">
          <p className="pbi-visual-title">{title}</p>
        </span>
        <ChevronDown size={18} className="collapsible-filters-card-chevron" />
      </button>
      <div className="collapsible-filters-card-body">{children}</div>
    </section>
  );
}

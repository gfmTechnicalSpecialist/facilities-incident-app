import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, ChevronDown, FileText, History, Paperclip, Search, ShieldCheck, SquarePen } from 'lucide-react';
import { EDIT_HISTORY_API_URL } from '../lib/apiBase';

interface IncidentChange {
  id: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
}

interface IncidentChangeSet {
  changeSetId: string;
  incidentPk: string;
  incidentId: string;
  editedByUserId: string;
  editedByName: string;
  editedAt: string;
  changeCount: number;
  changes: IncidentChange[];
}

const ATTACHMENTS_FIELD = 'attachments';

const FIELD_LABELS: Record<string, string> = {
  approval_status: 'Approval status',
  reviewed_by: 'Reviewed by',
  review_comments: 'Review comments',
  approved_by: 'Approved by',
  critical_load_affected: 'Critical load affected',
  restored_at: 'Restored at',
  system_restored: 'System restored',
  attachments: 'Attachments',
};

function humanizeFieldName(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return field
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return 'True';
  if (lower === 'false') return 'False';
  if (/^\d{4}-\d{2}-\d{2}[ t]\d{2}:\d{2}/i.test(trimmed)) {
    const parsed = new Date(trimmed.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return value;
}

/** Splits a change value into individual attachment file names, supporting single or multi-file changes. */
function splitAttachmentNames(value: string | null): string[] {
  if (!value) return [];
  const byDelimiter = value
    .split(/\r?\n|;|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byDelimiter.length > 1) return byDelimiter;
  const byComma = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (byComma.length > 1 && byComma.every((part) => /\.[a-zA-Z0-9]{2,5}$/.test(part))) {
    return byComma;
  }
  return [value.trim()];
}

const LONG_VALUE_THRESHOLD = 40;

function isLongChange(change: IncidentChange): boolean {
  return (change.oldValue?.length ?? 0) > LONG_VALUE_THRESHOLD || (change.newValue?.length ?? 0) > LONG_VALUE_THRESHOLD;
}

function formatTimestamp(value: string): string {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const APPROVAL_FIELDS = new Set(['approval_status', 'reviewed_by', 'review_comments', 'approved_by']);

function isApprovalChangeSet(changeSet: IncidentChangeSet): boolean {
  return changeSet.changes.length > 0 && changeSet.changes.every((change) => APPROVAL_FIELDS.has(change.fieldChanged));
}

function isAttachmentOnlyChangeSet(changeSet: IncidentChangeSet): boolean {
  return changeSet.changes.length > 0 && changeSet.changes.every((change) => change.fieldChanged === ATTACHMENTS_FIELD);
}

/** Splits a change set's changes into attachment changes and regular field changes. */
function splitChanges(changeSet: IncidentChangeSet) {
  const attachmentChanges = changeSet.changes.filter((change) => change.fieldChanged === ATTACHMENTS_FIELD);
  const fieldChanges = changeSet.changes.filter((change) => change.fieldChanged !== ATTACHMENTS_FIELD);
  return { attachmentChanges, fieldChanges };
}

interface AttachmentEntry {
  name: string;
  action: 'added' | 'removed';
}

function collectAttachmentEntries(attachmentChanges: IncidentChange[]): AttachmentEntry[] {
  const entries: AttachmentEntry[] = [];
  for (const change of attachmentChanges) {
    if (change.newValue) {
      splitAttachmentNames(change.newValue).forEach((name) => entries.push({ name, action: 'added' }));
    } else if (change.oldValue) {
      splitAttachmentNames(change.oldValue).forEach((name) => entries.push({ name, action: 'removed' }));
    }
  }
  return entries;
}

function approvalActionLabel(changeSet: IncidentChangeSet): string {
  const status = changeSet.changes.find((change) => change.fieldChanged === 'approval_status')?.newValue;
  if (status === 'Pending') return 'Pending Review';
  if (status === 'Approved' || status === 'Rejected') return status;
  return 'Approval action';
}

function approvalActionClass(changeSet: IncidentChangeSet): string {
  const status = changeSet.changes.find((change) => change.fieldChanged === 'approval_status')?.newValue;
  if (status === 'Approved') return 'approved';
  if (status === 'Rejected') return 'rejected';
  return 'approval';
}

/** Returns the badge label + class for a change set, accounting for approval and regular edit rows (attachment-only edits also show as "Edit"). */
function changeSetBadge(changeSet: IncidentChangeSet): { label: string; className: string } {
  if (isApprovalChangeSet(changeSet)) {
    return { label: approvalActionLabel(changeSet), className: approvalActionClass(changeSet) };
  }
  return { label: 'Edit', className: 'edit' };
}

/** Returns the "N field(s)" / "N attachment(s)" chip text for a change set. */
function changeSetCountLabel(changeSet: IncidentChangeSet): string {
  if (isAttachmentOnlyChangeSet(changeSet)) {
    const count = collectAttachmentEntries(changeSet.changes).length;
    return `${count} attachment${count === 1 ? '' : 's'}`;
  }
  return `${changeSet.changeCount} field${changeSet.changeCount === 1 ? '' : 's'}`;
}

function AttachmentChangeList({ entries }: { entries: AttachmentEntry[] }) {
  return (
    <ul className="edit-history-attachment-list">
      {entries.map((entry, i) => (
        <li key={`${entry.name}-${i}`} className={`edit-history-attachment-chip ${entry.action}`}>
          <FileText size={14} />
          <span className="edit-history-attachment-name">{entry.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function EditHistoryPage() {
  const [changeSets, setChangeSets] = useState<IncidentChangeSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

  const toggleSet = (changeSetId: string) => {
    setExpandedSets((prev) => {
      const next = new Set(prev);
      if (next.has(changeSetId)) {
        next.delete(changeSetId);
      } else {
        next.add(changeSetId);
      }
      return next;
    });
  };

  const runSearch = (rawId: string) => {
    const incidentId = rawId.trim();
    setError(null);
    if (!incidentId) {
      setChangeSets([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setExpandedSets(new Set());
    fetch(EDIT_HISTORY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<IncidentChangeSet[]>;
      })
      .then((json) => {
        setChangeSets(Array.isArray(json) ? json : []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load edit history');
        setChangeSets([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(search);
  };

  const summary = useMemo(() => {
    let fieldChangeCount = 0;
    let attachmentCount = 0;
    let approvalCount = 0;
    for (const changeSet of changeSets) {
      const { attachmentChanges, fieldChanges } = splitChanges(changeSet);
      fieldChangeCount += fieldChanges.length;
      attachmentCount += collectAttachmentEntries(attachmentChanges).length;
      if (isApprovalChangeSet(changeSet)) approvalCount += 1;
    }
    return [
      { key: 'sets', label: 'Change sets', value: changeSets.length, accent: '#118DFF', icon: <History size={15} /> },
      { key: 'fields', label: 'Field updates', value: fieldChangeCount, accent: '#6B007B', icon: <SquarePen size={15} /> },
      { key: 'attachments', label: 'Attachment changes', value: attachmentCount, accent: '#E66C37', icon: <Paperclip size={15} /> },
      { key: 'approvals', label: 'Approval actions', value: approvalCount, accent: '#107C10', icon: <ShieldCheck size={15} /> },
    ];
  }, [changeSets]);

  const allExpanded = changeSets.length > 0 && expandedSets.size === changeSets.length;

  const toggleAll = () => {
    setExpandedSets(allExpanded ? new Set() : new Set(changeSets.map((c) => c.changeSetId)));
  };

  const showResults = !loading && !error && hasSearched;

  return (
    <div className="page-stack pbi-dashboard">

      {/* Lookup: title, description and incident search */}
      <section className="edit-history-overview">
        <div className="edit-history-overview-head">
          <div className="edit-history-overview-titles">
            <h2 className="pbi-title">Edit History</h2>
            <p className="pbi-subtitle">
              Look up an incident to review its full audit trail &mdash; field updates, approval actions and attachment changes.
            </p>
          </div>
        </div>

        <form className="edit-history-search no-print" onSubmit={handleSubmit}>
          <div className="edit-history-search-field">
            <Search size={15} aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Incident ID (e.g. INC-2026-001)"
              aria-label="Incident ID"
            />
          </div>
          <button type="submit" className="solid-button" disabled={loading || !search.trim()}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {showResults && changeSets.length > 0 && (
          <dl className="edit-history-stat-strip">
            {summary.map((stat) => (
              <div className="edit-history-stat" key={stat.key} style={{ ['--stat-accent' as string]: stat.accent }}>
                <span className="edit-history-stat-icon">{stat.icon}</span>
                <div className="edit-history-stat-text">
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

      {loading && (
        <div className="pbi-tile loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading edit history…</p>
        </div>
      )}

      {!loading && error && (
        <section className="pbi-tile edit-history-empty">
          <span className="edit-history-empty-icon error"><AlertTriangle size={22} /></span>
          <div>
            <p className="pbi-visual-title">Couldn’t load edit history</p>
            <p className="muted-text">{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && !hasSearched && (
        <section className="pbi-tile edit-history-empty">
          <span className="edit-history-empty-icon"><History size={22} /></span>
          <div>
            <p className="pbi-visual-title">Search for an incident</p>
            <p className="muted-text">Enter an incident ID above to view its full edit history.</p>
          </div>
        </section>
      )}

      {showResults && changeSets.length === 0 && (
        <section className="pbi-tile edit-history-empty">
          <span className="edit-history-empty-icon"><History size={22} /></span>
          <div>
            <p className="pbi-visual-title">No edits recorded</p>
            <p className="muted-text">Nothing has been changed on “{search.trim()}” yet.</p>
          </div>
        </section>
      )}

      {showResults && changeSets.length > 0 && (
        <section className="pbi-tile edit-history-panel">
          <div className="edit-history-panel-head">
            <div className="edit-history-panel-titles">
              <h3 className="pbi-visual-title">Change log</h3>
              <p className="muted-text">
                {changeSets.length} change set{changeSets.length === 1 ? '' : 's'} for {changeSets[0].incidentId}
              </p>
            </div>
            <button type="button" className="ghost-button edit-history-toggle-all no-print" onClick={toggleAll}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <ol className="edit-history-timeline">
            {changeSets.map((changeSet) => {
              const isOpen = expandedSets.has(changeSet.changeSetId);
              const badge = changeSetBadge(changeSet);
              const { attachmentChanges, fieldChanges } = splitChanges(changeSet);
              const attachmentEntries = collectAttachmentEntries(attachmentChanges);
              return (
                <li className={isOpen ? 'edit-history-entry open' : 'edit-history-entry'} key={changeSet.changeSetId}>
                  <button
                    type="button"
                    className="edit-history-entry-head"
                    aria-expanded={isOpen}
                    onClick={() => toggleSet(changeSet.changeSetId)}
                  >
                    <ChevronDown size={16} className="edit-history-entry-chevron" aria-hidden="true" />
                    <span className={`report-history-type-badge ${badge.className}`}>
                      {badge.className === 'attachment' && <Paperclip size={11} />} {badge.label}
                    </span>
                    <span className="edit-history-entry-author">{changeSet.editedByName}</span>
                    <span className="edit-history-entry-date">{formatTimestamp(changeSet.editedAt)}</span>
                    <span className="edit-history-entry-count">{changeSetCountLabel(changeSet)}</span>
                  </button>

                  {isOpen && (
                    <dl className="edit-history-entry-body">
                      {attachmentEntries.length > 0 && (
                        <div className="edit-history-change">
                          <dt>Attachments</dt>
                          <dd><AttachmentChangeList entries={attachmentEntries} /></dd>
                        </div>
                      )}
                      {fieldChanges.map((change) => {
                        const stacked = isLongChange(change);
                        return (
                          <div className="edit-history-change" key={change.id}>
                            <dt>{humanizeFieldName(change.fieldChanged)}</dt>
                            <dd>
                              <span className={stacked ? 'edit-history-change-inline stacked' : 'edit-history-change-inline'}>
                                <span className="edit-history-old">{formatValue(change.oldValue)}</span>
                                <span className="edit-history-arrow" aria-hidden="true">{stacked ? '↓' : '→'}</span>
                                <span className="edit-history-new">{formatValue(change.newValue)}</span>
                              </span>
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

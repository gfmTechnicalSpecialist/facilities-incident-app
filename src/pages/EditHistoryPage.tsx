import { useState, type FormEvent } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { CollapsibleFiltersCard } from '../components/CollapsibleFiltersCard';
import { MobileReportCard } from '../components/MobileReportCard';
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

function formatValue(value: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return value;
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

  return (
    <div className="page-stack pbi-dashboard">
      <CollapsibleFiltersCard title="Filters" className="no-print">
        <form className="my-reports-filters" onSubmit={handleSubmit}>
          <label className="my-reports-search-label">
            <span>Incident ID</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter incident ID (e.g. INC-2026-001)"
            />
          </label>
          <button type="submit" className="solid-button" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </CollapsibleFiltersCard>

      {loading && (
        <div className="pbi-tile loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading edit history…</p>
        </div>
      )}

      {!loading && error && (
        <section className="pbi-tile edit-history-empty">
          <span className="edit-history-empty-icon"><History size={22} /></span>
          <div>
            <p className="pbi-visual-title">No edit history available yet</p>
            <p className="muted-text">Once the edit history service is connected, changes will appear here.</p>
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

      {!loading && !error && hasSearched && (
        <section className="pbi-tile table-card">
          <div className="grouped-header">
            <h3>Incident edits</h3>
            <p className="muted-text">
              {changeSets.length} change{changeSets.length === 1 ? '' : 's'} recorded
            </p>
          </div>

          {changeSets.length === 0 ? (
            <p className="muted-text">No edits found for “{search.trim()}”.</p>
          ) : (
            <>
              <div className="table-scroll desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Field changed</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  {changeSets.map((changeSet) => {
                    const isOpen = expandedSets.has(changeSet.changeSetId);
                    const isApproval = isApprovalChangeSet(changeSet);
                    return (
                      <tbody key={changeSet.changeSetId} className={isOpen ? 'edit-history-group open' : 'edit-history-group'}>
                        <tr className="edit-history-group-header" onClick={() => toggleSet(changeSet.changeSetId)}>
                          <td colSpan={2}>
                            <span className="edit-history-group-toggle">
                              <ChevronDown size={16} className="edit-history-group-chevron" />
                              <span className={isApproval ? `report-history-type-badge ${approvalActionClass(changeSet)}` : 'report-history-type-badge edit'}>
                                {isApproval ? approvalActionLabel(changeSet) : 'Edit'}
                              </span>
                              <span className="my-reports-ref">{changeSet.incidentId}</span>
                              <span className="edit-history-group-author">{changeSet.editedByName}</span>
                              <span className="edit-history-group-date">{formatTimestamp(changeSet.editedAt)}</span>
                              <span className="edit-history-group-count">
                                {changeSet.changeCount} field{changeSet.changeCount === 1 ? '' : 's'}
                              </span>
                            </span>
                          </td>
                        </tr>
                        {isOpen && changeSet.changes.map((change) => (
                          <tr key={change.id} className="edit-history-detail-row">
                            <td data-label="Field changed"><span className="edit-history-field">{change.fieldChanged}</span></td>
                            <td data-label="Change">
                              <span className="edit-history-change-inline">
                                <span className="edit-history-old">{formatValue(change.oldValue)}</span>
                                <span className="edit-history-arrow" aria-hidden="true">→</span>
                                <span className="edit-history-new">{formatValue(change.newValue)}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    );
                  })}
                </table>
              </div>

              <div className="m-card-list mobile-only">
                {changeSets.map((changeSet) => {
                  const isApproval = isApprovalChangeSet(changeSet);
                  return (
                    <MobileReportCard
                      key={changeSet.changeSetId}
                      reference={changeSet.incidentId}
                      title={formatTimestamp(changeSet.editedAt)}
                      badge={(
                        <span className={isApproval ? `report-history-type-badge ${approvalActionClass(changeSet)}` : 'report-history-type-badge edit'}>
                          {isApproval ? approvalActionLabel(changeSet) : 'Edit'}
                        </span>
                      )}
                      fields={[
                        ...changeSet.changes.map((change) => ({
                          label: change.fieldChanged,
                          value: (
                            <span className="edit-history-change-inline">
                              <span className="edit-history-old">{formatValue(change.oldValue)}</span>
                              {' → '}
                              <span className="edit-history-new">{formatValue(change.newValue)}</span>
                            </span>
                          ),
                        })),
                        { label: 'Edited by', value: changeSet.editedByName },
                        { label: 'User ID', value: changeSet.editedByUserId },
                      ]}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

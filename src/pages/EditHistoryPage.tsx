import { useState, type FormEvent } from 'react';
import { History } from 'lucide-react';
import { CollapsibleFiltersCard } from '../components/CollapsibleFiltersCard';
import { MobileReportCard } from '../components/MobileReportCard';
import { EDIT_HISTORY_API_URL } from '../lib/apiBase';

interface IncidentEdit {
  id: string;
  incidentPk: string;
  incidentId: string;
  editedByUserId: string;
  editedByName: string;
  editedAt: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
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

export function EditHistoryPage() {
  const [edits, setEdits] = useState<IncidentEdit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = (rawId: string) => {
    const incidentId = rawId.trim();
    setError(null);
    if (!incidentId) {
      setEdits([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    fetch(EDIT_HISTORY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<IncidentEdit[]>;
      })
      .then((json) => {
        setEdits(Array.isArray(json) ? json : []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load edit history');
        setEdits([]);
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
              {edits.length} change{edits.length === 1 ? '' : 's'} recorded
            </p>
          </div>

          {edits.length === 0 ? (
            <p className="muted-text">No edits found for “{search.trim()}”.</p>
          ) : (
            <>
              <div className="table-scroll desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Field changed</th>
                      <th>Old value</th>
                      <th>New value</th>
                      <th>Edited by</th>
                      <th>User ID</th>
                      <th>Edited at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edits.map((edit) => (
                      <tr key={edit.id}>
                        <td data-label="Incident ID"><span className="my-reports-ref">{edit.incidentId}</span></td>
                        <td data-label="Field changed"><span className="edit-history-field">{edit.fieldChanged}</span></td>
                        <td data-label="Old value"><span className="edit-history-old">{formatValue(edit.oldValue)}</span></td>
                        <td data-label="New value"><span className="edit-history-new">{formatValue(edit.newValue)}</span></td>
                        <td data-label="Edited by">{edit.editedByName}</td>
                        <td data-label="User ID"><span className="my-reports-ref">{edit.editedByUserId}</span></td>
                        <td data-label="Edited at">{formatTimestamp(edit.editedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="m-card-list mobile-only">
                {edits.map((edit) => (
                  <MobileReportCard
                    key={edit.id}
                    reference={edit.incidentId}
                    title={edit.fieldChanged}
                    badge={<span className="edit-history-chip">{edit.fieldChanged}</span>}
                    fields={[
                      { label: 'Old value', value: <span className="edit-history-old">{formatValue(edit.oldValue)}</span> },
                      { label: 'New value', value: <span className="edit-history-new">{formatValue(edit.newValue)}</span> },
                      { label: 'Edited by', value: edit.editedByName },
                      { label: 'User ID', value: edit.editedByUserId },
                      { label: 'Edited at', value: formatTimestamp(edit.editedAt) },
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

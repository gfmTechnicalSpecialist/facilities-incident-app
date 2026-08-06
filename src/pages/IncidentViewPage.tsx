import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, FileText, MapPin, Paperclip, Printer } from 'lucide-react';
import { approvalStatusClass, approvalStatusLabel, parseJiraTicketReferences } from '../utils/helpers';
import { INCIDENT_DETAILS_API_URL, EDIT_HISTORY_API_URL, ADD_INCIDENT_COMMENT_API_URL } from '../lib/apiBase';
import { useAuth } from '../contexts/AuthContext';
import { ApprovalDialog } from '../components/ApprovalDialog';
import { PrintHeader } from '../components/PrintHeader';
import { AttachmentsPanel } from '../components/AttachmentsPanel';
import { isApprover } from '../utils/constants';
import type { IncidentAttachmentFile } from '../types';

const DETAILS_API_URL = INCIDENT_DETAILS_API_URL;

interface IncidentDetails {
  header: {
    incidentId: string;
    title: string;
    site: string;
    specificLocation: string | null;
    severity: string;
    actionStatus: string;
    approvalStatus: string;
  };
  incidentDetail: {
    category: string | null;
    type: string | null;
    severity: string | null;
    impactOnOperations: string | null;
    criticalLoadAffected: string | null;
    systemRestored: string | null;
    restoredAt: string | null;
    jiraTicketReference: string | null;
    impactedSystem: string | null;
    dateTime: string | null;
    submittedBy: string | null;
    description: string | null;
    incidentSummary: string | null;
    rootCauseCategory: string | null;
  };
  actionsTaken: {
    actionByFacilities: string | null;
    actionByVendor: string | null;
    mitigationApplied: string | null;
  };
  rootCauseAnalysis: {
    why1: string | null;
    why2: string | null;
    why3: string | null;
    why4: string | null;
    why5: string | null;
  };
  workflow: {
    lessonsLearned: string | null;
    recommendations: string | null;
    followUpOwner: string | null;
    targetCompletionDate: string | null;
    reviewedBy: string | null;
    approvedBy: string | null;
    reviewComments: string | null;
  };
  viewerComments: {
    userName: string;
    userRole: string;
    date: string;
    comment: string;
  }[];
  hasAttachments: boolean;
  attachments: IncidentAttachmentFile[];
}

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

const NA = 'Not captured yet.';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || NA}</dd>
    </div>
  );
}

function formatHistoryValue(value: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return 'True';
  if (lower === 'false') return 'False';
  // Clean up ISO datetimes to readable form
  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (isoMatch) return `${isoMatch[1]} ${isoMatch[2]}`;
  return value;
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

/** Format an ISO datetime string to a readable form without timezone conversion: 2026-08-04 11:06 */
function formatReadableDateTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : raw;
}

const LONG_VALUE_THRESHOLD = 40;

function isLongChange(change: IncidentChange): boolean {
  return (change.oldValue?.length ?? 0) > LONG_VALUE_THRESHOLD || (change.newValue?.length ?? 0) > LONG_VALUE_THRESHOLD;
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

function formatHistoryTimestamp(value: string): string {
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

export function IncidentViewPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<IncidentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [changeSets, setChangeSets] = useState<IncidentChangeSet[]>([]);
  const [editsLoading, setEditsLoading] = useState(true);
  const [editsError, setEditsError] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);

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

  function fetchDetails(): Promise<IncidentDetails> {
    return fetch(DETAILS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    }).then((res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      return res.json() as Promise<IncidentDetails>;
    });
  }

  function refetchDetails() {
    fetchDetails()
      .then((json) => setData(json))
      .catch(() => { /* keep existing data on refresh failure */ });
  }

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDetails()
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load incident details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [incidentId]);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;
    setEditsLoading(true);
    setEditsError(null);

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
        if (!cancelled) setChangeSets(Array.isArray(json) ? json : []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setEditsError(err instanceof Error ? err.message : 'Failed to load report history');
      })
      .finally(() => {
        if (!cancelled) setEditsLoading(false);
      });

    return () => { cancelled = true; };
  }, [incidentId]);

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !incidentId || !user) return;
    setCommentSubmitting(true);
    setCommentError(null);
    setCommentSuccess(false);
    try {
      const res = await fetch(ADD_INCIDENT_COMMENT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          commentText: commentText.trim(),
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setCommentText('');
      setCommentSuccess(true);
      // Refresh incident details to get updated comments
      refetchDetails();
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack pbi-dashboard">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incident details…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-stack pbi-dashboard">
        <section className="card">
          <p style={{ color: 'var(--color-danger, #d71920)' }}>{error ?? 'Incident not found.'}</p>
          <button className="outline-button" type="button" onClick={() => navigate('/incidents')}>
            <ArrowLeft size={16} /> Back to workspace
          </button>
        </section>
      </div>
    );
  }

  const { header, incidentDetail, actionsTaken, rootCauseAnalysis, workflow, viewerComments: rawComments } = data;
  const viewerComments = [...rawComments].reverse();
  const jiraTicketReferences = parseJiraTicketReferences(incidentDetail.jiraTicketReference);

  return (
    <div className="page-stack pbi-dashboard incident-print-shell">
      <PrintHeader
        title={header.title}
        subtitle={`${header.site}${header.specificLocation ? ` • ${header.specificLocation}` : ''}`}
        reference={header.incidentId}
      />
      {/* Header */}
      <section className={`incident-hero print-report-header sev-${header.severity.toLowerCase()}`}>
        <div className="incident-hero-top">
          <button className="incident-hero-back no-print" type="button" onClick={() => navigate('/incidents')}>
            <ArrowLeft size={15} /> Back to workspace
          </button>
          <div className="incident-hero-actions no-print">
            {isApprover(user) && header.approvalStatus === 'Pending' && (
              <button className="solid-button" type="button" onClick={() => setIsApprovalDialogOpen(true)}>Review</button>
            )}
            <button className="outline-button" type="button" onClick={() => window.print()}>
              <Printer size={16} /> Print PDF
            </button>
          </div>
        </div>

        <div className="incident-hero-main">
          <div className="incident-hero-body">
            <div className="incident-hero-headline">
              <span className="incident-hero-id">{header.incidentId}</span>
              <h2 className="incident-hero-title">{header.title}</h2>
            </div>
            <p className="incident-hero-location">
              <MapPin size={13} aria-hidden="true" />
              <span>{header.site}{header.specificLocation ? ` • ${header.specificLocation}` : ''}</span>
            </p>
          </div>

          <dl className="incident-hero-meta">
            <div className="incident-hero-meta-item">
              <dt>Severity</dt>
              <dd><span className={`badge badge-${header.severity.toLowerCase()}`}>{header.severity}</span></dd>
            </div>
            <div className="incident-hero-meta-item">
              <dt>Status</dt>
              <dd><span className={`status-pill status-${header.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{header.actionStatus}</span></dd>
            </div>
            <div className="incident-hero-meta-item">
              <dt>Approval</dt>
              <dd><span className={`approval-pill detail-approval-pill ${approvalStatusClass(header.approvalStatus)}`}>{approvalStatusLabel(header.approvalStatus)}</span></dd>
            </div>
          </dl>
        </div>
      </section>


      {/* Incident detail + actions taken */}
      <section className="detail-grid">
        <div className="card">
          <h3>Incident detail</h3>
          <dl className="detail-list">
            <Field label="Category" value={incidentDetail.category} />
            <Field label="Type" value={incidentDetail.type} />
            <Field label="Severity" value={incidentDetail.severity} />
            <Field label="Impact on operations" value={incidentDetail.impactOnOperations} />
            <Field label="Critical load affected" value={incidentDetail.criticalLoadAffected} />
            <Field label="System restored" value={incidentDetail.systemRestored} />
            {incidentDetail.systemRestored === 'Yes' && (
              <Field label="Restored at" value={formatReadableDateTime(incidentDetail.restoredAt)} />
            )}
            <div className="full-span-item">
              <dt>Jira ticket references</dt>
              <dd>
                {jiraTicketReferences.length > 0 ? (
                  <ul className="jira-ticket-list">
                    {jiraTicketReferences.map((ticket, index) => (
                      <li key={`${ticket}-${index}`}>{ticket}</li>
                    ))}
                  </ul>
                ) : (
                  NA
                )}
              </dd>
            </div>
            <Field label="Impacted system" value={incidentDetail.impactedSystem} />
            <Field label="Date / time" value={incidentDetail.dateTime} />
            <Field label="Submitted by" value={incidentDetail.submittedBy} />
          </dl>
          {incidentDetail.description && (
            <>
              <h4>Description</h4>
              <p>{incidentDetail.description}</p>
            </>
          )}
          <div className="summary-pair">
            <div>
              <h4>Incident summary</h4>
              <p>{incidentDetail.incidentSummary || NA}</p>
            </div>
            <div>
              <h4>Root cause category</h4>
              <p>{incidentDetail.rootCauseCategory || NA}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Actions taken</h3>
          <h4>Action by facilities</h4>
          <p>{actionsTaken.actionByFacilities || NA}</p>
          <h4>Action by vendor</h4>
          <p>{actionsTaken.actionByVendor || NA}</p>
          <h4>Mitigation applied</h4>
          <p>{actionsTaken.mitigationApplied || NA}</p>
        </div>
      </section>

      <AttachmentsPanel
        incidentId={header.incidentId}
        attachments={data.attachments ?? []}
      />

      {/* Root cause analysis */}
      <section className="card">
        <h3>Root cause analysis (5 Whys)</h3>
        <dl className="detail-list">
          <Field label="Why 1" value={rootCauseAnalysis.why1} />
          <Field label="Why 2" value={rootCauseAnalysis.why2} />
          <Field label="Why 3" value={rootCauseAnalysis.why3} />
          <Field label="Why 4" value={rootCauseAnalysis.why4} />
          <Field label="Why 5" value={rootCauseAnalysis.why5} />
        </dl>
      </section>

      {/* Lessons learned + recommendations */}
      <section className="detail-grid">
        <div className="card">
          <h3>Lessons learned</h3>
          <p>{workflow.lessonsLearned || NA}</p>
        </div>
        <div className="card">
          <h3>Recommendations</h3>
          <p>{workflow.recommendations || NA}</p>
          {workflow.followUpOwner && (
            <>
              <h4>Follow-up owner</h4>
              <p>{workflow.followUpOwner}</p>
            </>
          )}
          {workflow.targetCompletionDate && (
            <>
              <h4>Target completion date</h4>
              <p>{workflow.targetCompletionDate}</p>
            </>
          )}
        </div>
      </section>

      {/* Review and closure */}
      <section className="card">
        <h3>Review and closure</h3>
        <dl className="detail-list">
          <div>
            <dt>Action status</dt>
            <dd>{header.actionStatus}</dd>
          </div>
          <div>
            <dt>Approval status</dt>
            <dd>
              <span className={`approval-pill detail-approval-pill ${approvalStatusClass(header.approvalStatus)}`}>
                {approvalStatusLabel(header.approvalStatus)}
              </span>
            </dd>
          </div>
          <Field label="Reviewed by" value={workflow.reviewedBy} />
          <Field label="Approved by" value={workflow.approvedBy} />
          <div className="full-span-item">
            <dt>Review comments</dt>
            <dd>{workflow.reviewComments || 'No review comments yet.'}</dd>
          </div>
        </dl>
        {isApprover(user) && header.approvalStatus === 'Pending' && (
          <div className="form-actions inline-actions no-print">
            <button className="solid-button" type="button" onClick={() => setIsApprovalDialogOpen(true)}>Approve / Reject</button>
          </div>
        )}
      </section>

      {isApprovalDialogOpen && incidentId && (
        <ApprovalDialog
          incidentId={incidentId}
          onClose={() => setIsApprovalDialogOpen(false)}
          onSubmitted={(status) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    header: { ...prev.header, approvalStatus: status },
                    workflow: { ...prev.workflow, approvedBy: status === 'Approved' ? (user?.fullName ?? prev.workflow.approvedBy) : prev.workflow.approvedBy, reviewedBy: user?.fullName ?? prev.workflow.reviewedBy },
                  }
                : prev,
            )
          }
        />
      )}

      {/* Comments + report history */}
      <section className="detail-grid comments-history-grid">
        <div className="card">
          <div className="grouped-header">
            <h3>Comments</h3>
            <p className="muted-text">
              {viewerComments.length} comment{viewerComments.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Comment input — everyone can add */}
          <form className="comment-form no-print" onSubmit={handleCommentSubmit}>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => { setCommentText(e.target.value); setCommentError(null); setCommentSuccess(false); }}
              placeholder="Add a comment to this incident…"
              disabled={commentSubmitting}
            />
            <div className="comment-form-actions">
              <button className="solid-button" type="submit" disabled={commentSubmitting || !commentText.trim()}>
                {commentSubmitting ? 'Posting…' : 'Post comment'}
              </button>
              {commentError && <span className="comment-feedback error">{commentError}</span>}
              {commentSuccess && <span className="comment-feedback success">Comment added!</span>}
            </div>
          </form>

          <div className="comment-list">
            {viewerComments.length > 0 ? (
              viewerComments.map((c, i) => {
                const initials = c.userName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || '?';
                return (
                  <article className="comment-item" key={i}>
                    <div className="comment-meta">
                      <span className="comment-avatar" aria-hidden="true">{initials}</span>
                      <strong className="comment-author">{c.userName}</strong>
                      <span className="comment-role-badge">{c.userRole === 'viewer' ? 'Viewer' : c.userRole}</span>
                      <span className="comment-date">{c.date}</span>
                    </div>
                    <p className="comment-text">{c.comment}</p>
                  </article>
                );
              })
            ) : (
              <p className="muted-text">No comments yet.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="grouped-header">
            <h3>Report history</h3>
            {!editsLoading && !editsError && (
              <p className="muted-text">
                {changeSets.length} change{changeSets.length === 1 ? '' : 's'} recorded
              </p>
            )}
          </div>

          {editsLoading ? (
            <div className="report-history-status">
              <div className="loading-spinner" />
              <p className="muted-text">Loading report history…</p>
            </div>
          ) : editsError ? (
            <p className="muted-text">Report history is unavailable right now.</p>
          ) : changeSets.length === 0 ? (
            <p className="muted-text">No changes recorded yet.</p>
          ) : (
            <ol className="report-history-timeline">
              {changeSets.map((changeSet) => {
                const isOpen = expandedSets.has(changeSet.changeSetId);
                const isApproval = isApprovalChangeSet(changeSet);
                const badge = changeSetBadge(changeSet);
                const { attachmentChanges, fieldChanges } = splitChanges(changeSet);
                const attachmentEntries = collectAttachmentEntries(attachmentChanges);
                return (
                  <li className={isOpen ? 'report-history-entry open' : 'report-history-entry'} key={changeSet.changeSetId}>
                    <div className={isApproval ? 'report-history-marker approval' : 'report-history-marker'} aria-hidden="true" />
                    <div className="report-history-body">
                      <button
                        type="button"
                        className="report-history-head"
                        onClick={() => toggleSet(changeSet.changeSetId)}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown size={15} className="report-history-chevron" />
                        <span className={`report-history-type-badge ${badge.className}`}>
                          {badge.className === 'attachment' && <Paperclip size={11} />} {badge.label}
                        </span>
                        <span className="report-history-editor">{changeSet.editedByName}</span>
                        <span className="report-history-time">{formatHistoryTimestamp(changeSet.editedAt)}</span>
                        <span className="report-history-count">{changeSetCountLabel(changeSet)}</span>
                      </button>
                      {isOpen && (
                        <>
                          {attachmentEntries.length > 0 && (
                            <div className="report-history-attachments">
                              <AttachmentChangeList entries={attachmentEntries} />
                            </div>
                          )}
                          {fieldChanges.length > 0 && (
                            <ul className="report-history-fields">
                              {fieldChanges.map((change) => {
                                const stacked = isLongChange(change);
                                return (
                                  <li className="report-history-field-row" key={change.id}>
                                    <span className="report-history-field">{humanizeFieldName(change.fieldChanged)}:</span>
                                    <span className={stacked ? 'report-history-change-inline stacked' : 'report-history-change-inline'}>
                                      <span className="report-history-old">{formatHistoryValue(change.oldValue)}</span>
                                      <span className="report-history-arrow" aria-hidden="true">{stacked ? '↓' : '→'}</span>
                                      <span className="report-history-new">{formatHistoryValue(change.newValue)}</span>
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { approvalStatusClass, approvalStatusLabel } from '../utils/helpers';
import { INCIDENT_DETAILS_API_URL } from '../lib/apiBase';
import { useAuth } from '../contexts/AuthContext';
import { ApprovalDialog } from '../components/ApprovalDialog';

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

export function IncidentViewPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<IncidentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(DETAILS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<IncidentDetails>;
      })
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

  const { header, incidentDetail, actionsTaken, rootCauseAnalysis, workflow, viewerComments } = data;

  return (
    <div className="page-stack pbi-dashboard incident-print-shell">
      {/* Header */}
      <section className="card detail-header-card print-report-header">
        <div>
          <p className="eyebrow">{header.incidentId}</p>
          <h2>{header.title}</h2>
          <p className="muted-text">
            {header.site}{header.specificLocation ? ` • ${header.specificLocation}` : ''}
          </p>
        </div>
        <div className="detail-header-actions no-print">
          <span className={`badge badge-${header.severity.toLowerCase()}`}>{header.severity}</span>
          <span className={`status-pill status-${header.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{header.actionStatus}</span>
          <span className={`approval-pill detail-approval-pill ${approvalStatusClass(header.approvalStatus)}`}>{approvalStatusLabel(header.approvalStatus)}</span>
          {user?.role === 'approver' && header.approvalStatus === 'Pending' && (
            <button className="solid-button" type="button" onClick={() => setIsApprovalDialogOpen(true)}>Review</button>
          )}
          <button className="outline-button" type="button" onClick={() => window.print()}>
            <Printer size={16} /> Print PDF
          </button>
        </div>
      </section>

      <section className="card no-print">
        <button className="outline-button" type="button" onClick={() => navigate('/incidents')}>
          <ArrowLeft size={16} /> Back to workspace
        </button>
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
            <Field label="Jira ticket reference" value={incidentDetail.jiraTicketReference} />
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
        {user?.role === 'approver' && header.approvalStatus === 'Pending' && (
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

      {/* Viewer comments */}
      <section className="card">
        <h3>Comments</h3>
        <div className="comment-list">
          {viewerComments.length > 0 ? (
            viewerComments.map((c, i) => (
              <article className="comment-item" key={i}>
                <div className="comment-meta">
                  <strong>{c.userName}</strong>
                  <span>{c.userRole === 'viewer' ? 'Viewer' : 'Admin'}</span>
                  <span>{c.date}</span>
                </div>
                <p>{c.comment}</p>
              </article>
            ))
          ) : (
            <p className="muted-text">No comments yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}


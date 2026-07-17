import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addComment, getIncidentById, listComments, updateIncidentReview, updateIncidentStatus } from '../services/incidentService';
import { actionStatuses, approvalStatuses } from '../utils/constants';
import { approvalStatusClass, approvalStatusLabel, formatDateTime } from '../utils/helpers';
import type { ActionStatus, ApprovalStatus } from '../types';

export function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ActionStatus>('Open');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalStatus>('Pending');
  const [reviewComments, setReviewComments] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const incident = useMemo(() => (id ? getIncidentById(id) : undefined), [id, refreshKey]);
  const comments = useMemo(() => (incident ? listComments(incident.id) : []), [incident, refreshKey]);

  useEffect(() => {
    if (incident) {
      setSelectedStatus(incident.actionStatus);
      setSelectedApproval(incident.approvalStatus);
      setReviewComments(incident.reviewComments);
    }
  }, [incident]);

  if (!incident || !user) {
    return <div className="card">Incident not found.</div>;
  }

  const currentIncident = incident;
  const currentUser = user;

  function handleCommentSubmit() {
    if (!commentText.trim() || currentUser.role !== 'viewer') return;

    addComment({
      incidentId: currentIncident.id,
      commentText: commentText.trim(),
      userName: currentUser.fullName,
      userEmail: currentUser.email,
      userRole: currentUser.role,
    });

    setCommentText('');
    setMessage('Comment added successfully.');
    setRefreshKey((previous) => previous + 1);
  }

  function handleStatusSave() {
    updateIncidentStatus(currentIncident.id, selectedStatus);
    setMessage('Action status updated successfully.');
    setRefreshKey((previous) => previous + 1);
  }

  function handleReviewSave() {
    if (currentUser.role !== 'viewer') return;
    updateIncidentReview(currentIncident.id, {
      approvalStatus: selectedApproval,
      reviewComments,
      reviewerName: currentUser.fullName,
      approverName: selectedApproval === 'Approved' ? currentUser.fullName : currentIncident.approvedBy,
    });
    setMessage('Review comment saved successfully.');
    setRefreshKey((previous) => previous + 1);
  }

  return (
    <div className="page-stack pbi-dashboard incident-print-shell">
      <section className="card detail-header-card print-report-header">
        <div>
          <p className="eyebrow">{incident.incidentId}</p>
          <h2>{incident.title}</h2>
          <p className="muted-text">{incident.site} • {incident.specificLocation}</p>
        </div>
        <div className="detail-header-actions no-print">
          <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
          <span className={`status-pill status-${incident.actionStatus.toLowerCase().replace(/\s+/g, '-')}`}>{incident.actionStatus}</span>
          <span className={`approval-pill detail-approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span>
          {user.role === 'admin' && incident.actionStatus !== 'Closed' && <Link className="solid-button" to={`/incidents/${incident.id}/edit`}>Edit report</Link>}
          {incident.actionStatus === 'Closed' && (
            <button className="outline-button" type="button" onClick={() => window.print()}>
              <Printer size={16} /> Print PDF
            </button>
          )}
        </div>
      </section>

      {user.role === 'admin' && (
        <section className="card quick-status-card no-print">
          <div>
            <h3>Admin action status</h3>
            <p className="muted-text">Approval stays on the viewer side. Admins only update action status here.</p>
          </div>
          <div className="quick-status-controls">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as ActionStatus)}>
              {actionStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <button className="solid-button" type="button" onClick={handleStatusSave}>
              Save status
            </button>
          </div>
        </section>
      )}

      {user.role === 'viewer' && (
        <section className="card quick-status-card no-print">
          <div>
            <h3>Viewer review and approval</h3>
            <p className="muted-text">Comments, review, and approval are captured on the viewer side using the logged-in user details.</p>
          </div>
          <div className="viewer-review-grid">
            <label>
              <span>Approval status</span>
              <select value={selectedApproval} onChange={(e) => setSelectedApproval(e.target.value as ApprovalStatus)}>
                {approvalStatuses.map((status) => (
                  <option key={status} value={status}>{approvalStatusLabel(status)}</option>
                ))}
              </select>
            </label>
            <label className="full-span">
              <span>Review comments</span>
              <textarea rows={3} value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} />
            </label>
            <div className="form-actions inline-actions">
              <button className="solid-button" type="button" onClick={handleReviewSave}>
                Save review
              </button>
            </div>
          </div>
        </section>
      )}

      {message && <section className="card success-banner no-print"><p className="success-text">{message}</p></section>}

      <section className="detail-grid">
        <div className="card">
          <h3>Incident detail</h3>
          <dl className="detail-list">
            <div><dt>Category</dt><dd>{incident.incidentCategory}</dd></div>
            <div><dt>Type</dt><dd>{incident.incidentType === 'Other' && incident.otherIncidentType ? incident.otherIncidentType : incident.incidentType}</dd></div>
            <div><dt>Severity</dt><dd>{incident.severity}</dd></div>
            <div><dt>Impact on operations</dt><dd>{incident.impactOnOperations}</dd></div>
            <div><dt>Critical load affected</dt><dd>{incident.criticalLoadAffected ? 'Yes' : 'No'}</dd></div>
            <div><dt>System restored</dt><dd>{incident.systemRestored ? 'Yes' : 'No'}</dd></div>
            <div><dt>Jira ticket reference</dt><dd>{incident.jiraTicketReference || 'Not captured yet.'}</dd></div>
            <div><dt>Impacted system</dt><dd>{incident.impactedAreaSystem}</dd></div>
            <div><dt>Date / time</dt><dd>{incident.incidentDate} {incident.incidentTime}</dd></div>
            <div><dt>Submitted by</dt><dd>{incident.submittedBy}</dd></div>
          </dl>
          <h4>Description</h4>
          <p>{incident.description}</p>
          <div className="summary-pair">
            <div>
              <h4>Incident summary</h4>
              <p>{incident.incidentSummary || 'Not captured yet.'}</p>
            </div>
            <div>
              <h4>Root cause category</h4>
              <p>{incident.rootCauseCategory || 'Not captured yet.'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Actions taken</h3>
          <h4>Action by facilities</h4>
          <p>{incident.facilitiesAction || 'Not captured yet.'}</p>
          <h4>Action by vendor</h4>
          <p>{incident.vendorAction || 'Not captured yet.'}</p>
          <h4>Mitigation applied</h4>
          <p>{incident.mitigationApplied || 'Not captured yet.'}</p>
        </div>
      </section>

      <section className="card">
        <h3>Root cause analysis (5 Whys)</h3>
        <div className="detail-list">
          <div><dt>Why 1</dt><dd>{incident.why1 || 'Not captured yet.'}</dd></div>
          <div><dt>Why 2</dt><dd>{incident.why2 || 'Not captured yet.'}</dd></div>
          <div><dt>Why 3</dt><dd>{incident.why3 || 'Not captured yet.'}</dd></div>
          <div><dt>Why 4</dt><dd>{incident.why4 || 'Not captured yet.'}</dd></div>
          <div><dt>Why 5</dt><dd>{incident.why5 || 'Not captured yet.'}</dd></div>
        </div>
      </section>

      <section className="detail-grid">
        <div className="card">
          <h3>Lessons learned</h3>
          <p>{incident.lessonsLearned || 'Not captured yet.'}</p>
        </div>
        <div className="card">
          <h3>Recommendations</h3>
          <p>{incident.recommendations || 'Not captured yet.'}</p>
          <h4>Follow-up owner</h4>
          <p>{incident.responsiblePerson || 'Not assigned yet.'}</p>
          {incident.targetCompletionDate && (
            <>
              <h4>Target completion date</h4>
              <p>{incident.targetCompletionDate}</p>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h3>Review and closure</h3>
        <div className="detail-list">
          <div><dt>Action status</dt><dd>{incident.actionStatus}</dd></div>
          <div><dt>Approval status</dt><dd><span className={`approval-pill detail-approval-pill ${approvalStatusClass(incident.approvalStatus)}`}>{approvalStatusLabel(incident.approvalStatus)}</span></dd></div>
          <div><dt>Reviewed by</dt><dd>{incident.reviewedBy || 'Not reviewed yet.'}</dd></div>
          <div><dt>Approved by</dt><dd>{incident.approvedBy || 'Not approved yet.'}</dd></div>
          <div className="full-span-item"><dt>Review comments</dt><dd>{incident.reviewComments || 'No review comments yet.'}</dd></div>
        </div>
      </section>

      <section className="card">
        <h3>Viewer comments</h3>
        {user.role === 'viewer' ? (
          <div className="comment-form no-print">
            <textarea rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment to the report history" />
            <button className="solid-button" type="button" onClick={handleCommentSubmit}>
              Add comment
            </button>
          </div>
        ) : (
          <p className="muted-text">Admins can view comments here, but only viewer accounts can add review comments.</p>
        )}

        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-meta">
                <strong>{comment.userName}</strong>
                <span>{comment.userRole === 'viewer' ? 'Viewer' : 'Admin'}</span>
                <span>{formatDateTime(comment.createdAt)}</span>
              </div>
              <p>{comment.commentText}</p>
            </article>
          ))}
          {!comments.length && <p className="muted-text">No comments yet.</p>}
        </div>
      </section>
    </div>
  );
}

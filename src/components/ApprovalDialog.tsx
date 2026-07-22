import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { approveIncident } from '../services/approvalService';

interface ApprovalDialogProps {
  incidentId: string;
  onClose: () => void;
  onSubmitted?: (status: 'Approved' | 'Rejected') => void;
}

export function ApprovalDialog({ incidentId, onClose, onSubmitted }: ApprovalDialogProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(approvalStatus: 'Approved' | 'Rejected') {
    if (!user) return;
    setIsSubmitting(true);
    setError('');
    try {
      await approveIncident({
        incidentId,
        approvalStatus,
        reviewComments: comments,
        reviewerName: user.fullName,
      });
      onSubmitted?.(approvalStatus);
      onClose();
    } catch {
      setError('Could not submit the review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay no-print" role="dialog" aria-modal="true">
      <div className="card modal-card">
        <h3>Approve / Reject incident</h3>
        <p className="muted-text">Add optional review comments before submitting your decision.</p>
        <textarea
          rows={4}
          placeholder="Add your review comments..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        {error && <p className="muted-text" style={{ color: 'var(--color-danger, #d71920)' }}>{error}</p>}
        <div className="form-actions inline-actions">
          <button className="outline-button" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="outline-button" type="button" onClick={() => handleSubmit('Rejected')} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Reject'}
          </button>
          <button className="solid-button" type="button" onClick={() => handleSubmit('Approved')} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}


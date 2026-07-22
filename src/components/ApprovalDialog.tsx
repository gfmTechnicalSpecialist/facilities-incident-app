import { useEffect, useRef, useState } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the comment field and lock background scroll while the dialog is open.
    textareaRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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
    <div
      className="modal-overlay no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-dialog-title"
      onClick={onClose}
    >
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="approval-dialog-title">Review incident</h3>
          <p className="muted-text">Add optional review comments before submitting your decision.</p>
        </div>
        <label className="modal-field">
          <span>Review comments</span>
          <textarea
            ref={textareaRef}
            rows={4}
            placeholder="Add your review comments..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="outline-button" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="reject-button" type="button" onClick={() => handleSubmit('Rejected')} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Reject'}
          </button>
          <button className="approve-button" type="button" onClick={() => handleSubmit('Approved')} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}


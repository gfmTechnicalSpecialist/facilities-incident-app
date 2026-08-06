import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { ADD_INCIDENT_API_URL, getUploadAttachmentsUrl } from '../lib/apiBase';
import { stringifyJiraTicketReferences } from '../utils/helpers';
import type { IncidentFormValues } from '../types';

const ADD_INCIDENT_URL = ADD_INCIDENT_API_URL;

function buildPayload(values: IncidentFormValues, userEmail: string, approvalStatus: 'Draft' | 'Pending') {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));

  return {
    id: crypto.randomUUID(),
    incidentId: `INC-${year}-${randomSuffix}`,
    reporterName: values.reporterName,
    designation: values.designation,
    department: values.department,
    contact: values.contact,
    email: values.email,
    title: values.title,
    incidentDate: values.incidentDate || null,
    incidentTime: values.incidentTime || null,
    site: values.site,
    specificLocation: values.specificLocation || null,
    impactedAreaSystem: values.impactedAreaSystem,
    incidentCategory: values.incidentCategory,
    incidentType: values.incidentType,
    otherIncidentType: values.otherIncidentType || null,
    severity: values.severity,
    description: values.description,
    facilitiesAction: values.facilitiesAction || null,
    vendorAction: values.vendorAction || null,
    criticalLoadAffected: values.criticalLoadAffected,
    mitigationApplied: values.mitigationApplied || null,
    impactOnOperations: values.impactOnOperations,
    jiraTicketReference: stringifyJiraTicketReferences(values.jiraTicketReference),
    systemRestored: values.systemRestored,
    restoredAt: values.restoredAt || null,
    incidentSummary: values.incidentSummary || null,
    why1: values.why1 || null,
    why2: values.why2 || null,
    why3: values.why3 || null,
    why4: values.why4 || null,
    why5: values.why5 || null,
    rootCauseCategory: values.rootCauseCategory || null,
    recommendations: values.recommendations || null,
    lessonsLearned: values.lessonsLearned || null,
    followUpRequired: values.followUpRequired,
    responsiblePerson: values.responsiblePerson || null,
    targetCompletionDate: values.targetCompletionDate ? `${values.targetCompletionDate}T00:00:00Z` : null,
    actionStatus: values.actionStatus,
    approvalStatus,
    reviewedBy: null,
    approvedBy: null,
    reviewComments: null,
    submittedBy: userEmail,
    createdAt: now,
    updatedAt: now,
  };
}

export function NewIncidentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submittingAction, setSubmittingAction] = useState<'submit' | 'draft' | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null);

  if (!user) return null;

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPendingFiles((previous) => [...previous, ...files]);
    e.target.value = '';
  }

  function removePendingFile(index: number) {
    setPendingFiles((previous) => previous.filter((_, i) => i !== index));
  }

  if (successId) {
    return (
      <div className="page-stack pbi-dashboard">
        <div className="card success-banner">
          <div className="success-banner-icon">✓</div>
          <div>
            <h3>{savedAsDraft ? 'Draft saved' : 'Report submitted successfully'}</h3>
            <p className="muted-text">
              {savedAsDraft ? (
                <>Incident <strong>{successId}</strong> has been saved as a draft. Continue editing it from My Reports whenever you're ready to submit.</>
              ) : (
                <>Incident <strong>{successId}</strong> has been logged and is now pending review.</>
              )}
            </p>
            {attachmentWarning && <p className="form-error">{attachmentWarning}</p>}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button className="solid-button" onClick={() => navigate('/incidents')}>Go to incident workspace</button>
              <button className="outline-button" onClick={() => { setSuccessId(null); setApiError(null); setPendingFiles([]); setAttachmentWarning(null); setSavedAsDraft(false); }}>Log another report</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(values: IncidentFormValues) {
    setSubmittingAction('submit');
    setApiError(null);
    setAttachmentWarning(null);
    try {
      const payload = buildPayload(values, user!.email, 'Pending');
      const res = await fetch(ADD_INCIDENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      if (pendingFiles.length > 0) {
        try {
          const formData = new FormData();
          pendingFiles.forEach((file) => formData.append('files', file));
          formData.append('metadata', JSON.stringify({
            IsEditPhase: false,
            EditedByName: null,
            EditedByUserId: null,
          }));
          const uploadRes = await fetch(getUploadAttachmentsUrl(payload.incidentId), {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) throw new Error(`Server returned ${uploadRes.status}`);
        } catch {
          setAttachmentWarning('Report created, but attachments failed to upload. You can add them from the report page.');
        }
      }

      setSavedAsDraft(false);
      setSuccessId(payload.incidentId);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to submit incident. Please try again.');
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleSaveDraft(values: IncidentFormValues) {
    setSubmittingAction('draft');
    setApiError(null);
    setAttachmentWarning(null);
    try {
      const payload = buildPayload(values, user!.email, 'Draft');
      const res = await fetch(ADD_INCIDENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      if (pendingFiles.length > 0) {
        try {
          const formData = new FormData();
          pendingFiles.forEach((file) => formData.append('files', file));
          formData.append('metadata', JSON.stringify({
            IsEditPhase: false,
            EditedByName: null,
            EditedByUserId: null,
          }));
          const uploadRes = await fetch(getUploadAttachmentsUrl(payload.incidentId), {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) throw new Error(`Server returned ${uploadRes.status}`);
        } catch {
          setAttachmentWarning('Draft saved, but attachments failed to upload. You can add them from the report page.');
        }
      }

      setSavedAsDraft(true);
      setSuccessId(payload.incidentId);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <div className="page-stack pbi-dashboard">
      <div className="card">
        <h3>Log a new report</h3>
        <p className="muted-text">Only admin users can create or edit incident reports.</p>
      </div>
      {apiError && (
        <div className="card">
          <p className="form-error">{apiError}</p>
        </div>
      )}
      <div className="card">
        <h3>Attachments</h3>
        <p className="muted-text">Optional. Selected files are uploaded once the report is created.</p>
        <div className="attachment-upload">
          <label className="outline-button attachment-file-picker">
            <Upload size={16} /> Choose files
            <input type="file" multiple onChange={handleFileSelect} hidden />
          </label>
          {pendingFiles.length > 0 && (
            <ul className="attachment-pending-list">
              {pendingFiles.map((file, i) => (
                <li key={`${file.name}-${i}`}>
                  <span>{file.name}</span>
                  <button type="button" className="ghost-button attachment-remove-btn" onClick={() => removePendingFile(i)} aria-label={`Remove ${file.name}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <IncidentForm
        currentUser={user}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        submitLabel={submittingAction === 'submit' ? 'Submitting…' : 'Create report'}
        draftLabel={submittingAction === 'draft' ? 'Saving…' : 'Save as draft'}
        submitDisabled={submittingAction !== null}
        draftDisabled={submittingAction !== null}
      />
    </div>
  );
}

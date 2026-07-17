import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { ADD_INCIDENT_API_URL } from '../lib/apiBase';
import type { IncidentFormValues } from '../types';

const ADD_INCIDENT_URL = ADD_INCIDENT_API_URL;

function buildPayload(values: IncidentFormValues, userEmail: string) {
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
    incidentDate: values.incidentDate ? `${values.incidentDate}T00:00:00Z` : null,
    incidentTime: values.incidentTime,
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
    jiraTicketReference: values.jiraTicketReference || null,
    systemRestored: values.systemRestored,
    restoredAt: values.restoredAt ? new Date(values.restoredAt).toISOString() : null,
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
    approvalStatus: 'Pending',
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
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  if (!user) return null;

  if (successId) {
    return (
      <div className="page-stack">
        <div className="card success-banner">
          <div className="success-banner-icon">✓</div>
          <div>
            <h3>Report submitted successfully</h3>
            <p className="muted-text">Incident <strong>{successId}</strong> has been logged and is now pending review.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button className="solid-button" onClick={() => navigate('/incidents')}>Go to incident workspace</button>
              <button className="outline-button" onClick={() => { setSuccessId(null); setApiError(null); }}>Log another report</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(values: IncidentFormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      const payload = buildPayload(values, user!.email);
      const res = await fetch(ADD_INCIDENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setSuccessId(payload.incidentId);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to submit incident. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="card">
        <h3>Log a new report</h3>
        <p className="muted-text">Only admin users can create or edit incident reports.</p>
      </div>
      {apiError && (
        <div className="card">
          <p className="form-error">{apiError}</p>
        </div>
      )}
      <IncidentForm
        currentUser={user}
        onSubmit={handleSubmit}
        submitLabel={submitting ? 'Submitting…' : 'Create report'}
        submitDisabled={submitting}
      />
    </div>
  );
}

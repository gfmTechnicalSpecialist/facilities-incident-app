import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../lib/apiBase';
import type { IncidentCategory, IncidentFormValues, IncidentType, ActionStatus, Impact, Severity } from '../types';

const DETAILS_API_URL = `${API_BASE}/api/GetIncidentDetails?code=GbtQx8CyGWG21uVQZJjDJjMqarS-syWVkawI47Qm23tOAzFuvxz2zQ==`;

// TODO: Replace with the real UpdateIncident endpoint when available.
// const UPDATE_API_URL = `${API_BASE}/api/UpdateIncident?code=<your-function-code>`;

interface ApiDetails {
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
}

function parseDateTime(raw: string | null): { incidentDate: string; incidentTime: string } {
  if (!raw) return { incidentDate: '', incidentTime: '' };
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return { incidentDate: '', incidentTime: '' };
  return {
    incidentDate: dt.toISOString().slice(0, 10),
    incidentTime: dt.toTimeString().slice(0, 5),
  };
}

function mapToFormValues(data: ApiDetails): IncidentFormValues {
  const { incidentDate, incidentTime } = parseDateTime(data.incidentDetail.dateTime);
  return {
    title: data.header.title,
    reporterName: data.incidentDetail.submittedBy ?? '',
    designation: '',
    department: '',
    contact: '',
    email: '',
    incidentDate,
    incidentTime,
    site: data.header.site,
    specificLocation: data.header.specificLocation ?? '',
    impactedAreaSystem: data.incidentDetail.impactedSystem ?? '',
    incidentCategory: (data.incidentDetail.category as IncidentCategory) ?? 'Equipment & Systems',
    incidentType: (data.incidentDetail.type as IncidentType) ?? 'Electrical Issue',
    otherIncidentType: '',
    severity: (data.header.severity as Severity) ?? 'Moderate',
    description: data.incidentDetail.description ?? '',
    facilitiesAction: data.actionsTaken.actionByFacilities ?? '',
    vendorAction: data.actionsTaken.actionByVendor ?? '',
    criticalLoadAffected: data.incidentDetail.criticalLoadAffected?.toLowerCase() === 'yes',
    mitigationApplied: data.actionsTaken.mitigationApplied ?? '',
    impactOnOperations: (data.incidentDetail.impactOnOperations as Impact) ?? 'Minor',
    jiraTicketReference: data.incidentDetail.jiraTicketReference ?? '',
    systemRestored: data.incidentDetail.systemRestored?.toLowerCase() === 'yes',
    restoredAt: '',
    incidentSummary: data.incidentDetail.incidentSummary ?? '',
    why1: data.rootCauseAnalysis.why1 ?? '',
    why2: data.rootCauseAnalysis.why2 ?? '',
    why3: data.rootCauseAnalysis.why3 ?? '',
    why4: data.rootCauseAnalysis.why4 ?? '',
    why5: data.rootCauseAnalysis.why5 ?? '',
    rootCauseCategory: data.incidentDetail.rootCauseCategory ?? '',
    recommendations: data.workflow.recommendations ?? '',
    lessonsLearned: data.workflow.lessonsLearned ?? '',
    followUpRequired: !!(data.workflow.followUpOwner || data.workflow.targetCompletionDate),
    responsiblePerson: data.workflow.followUpOwner ?? '',
    targetCompletionDate: data.workflow.targetCompletionDate ?? '',
    actionStatus: (data.header.actionStatus as ActionStatus) ?? 'Open',
    submittedBy: data.incidentDetail.submittedBy ?? '',
  };
}

export function EditReportPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialValues, setInitialValues] = useState<IncidentFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetch(DETAILS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<ApiDetails>;
      })
      .then((data) => {
        if (!cancelled) setInitialValues(mapToFormValues(data));
      })
      .catch((err: unknown) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'Failed to load incident');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [incidentId]);

  function handleSubmit(values: IncidentFormValues) {
    // TODO: Wire to UpdateIncident API when available:
    // fetch(UPDATE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ incidentId, ...values }) })
    console.log('[EditReportPage] save payload:', { incidentId, ...values });
    setSavedBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="page-stack">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incident…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !initialValues) {
    return (
      <div className="page-stack">
        <section className="card">
          <p style={{ color: 'var(--color-danger, #d71920)' }}>{fetchError ?? 'Incident not found.'}</p>
          <button className="outline-button" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go back
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="outline-button" type="button" onClick={() => navigate(`/incidents/view/${incidentId}`)}>
            <ArrowLeft size={16} /> Back to report
          </button>
        </div>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Edit report — {incidentId}</h3>
        <p className="muted-text">Update the incident record below. Fields marked with a red asterisk are required.</p>
      </header>

      {savedBanner && (
        <div
          className="card"
          style={{
            borderLeft: '5px solid #ffb000',
            background: '#fffbf0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 600, color: '#b07800' }}>Placeholder save</span>
          <span className="muted-text">
            The form values have been logged to the console. Connect an{' '}
            <code>UpdateIncident</code> API endpoint to persist changes.
          </span>
          <button
            className="ghost-button"
            type="button"
            style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
            onClick={() => setSavedBanner(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      <IncidentForm
        currentUser={user}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}

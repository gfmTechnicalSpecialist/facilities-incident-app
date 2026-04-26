import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../lib/apiBase';
import type { IncidentCategory, IncidentFormValues, IncidentType, ActionStatus, Impact, Severity } from '../types';

const DETAILS_API_URL = `${API_BASE}/api/GetIncidentDetails?code=GbtQx8CyGWG21uVQZJjDJjMqarS-syWVkawI47Qm23tOAzFuvxz2zQ==`;
const UPDATE_API_URL = `${API_BASE}/api/UpdateIncident?code=qGmWbQ3Jl5r0XfMtapKC13yTcty9KU-7JI0mG0z2DeRLAzFu0TzZaw==`;

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
  const [rawData, setRawData] = useState<ApiDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
        if (!cancelled) {
          setRawData(data);
          setInitialValues(mapToFormValues(data));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'Failed to load incident');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [incidentId]);

  async function handleSubmit(values: IncidentFormValues) {
    setSaving(true);
    setSaveError(null);
    setSavedBanner(false);
    try {
      const res = await fetch(UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IncidentId: incidentId,
          ReporterName: values.reporterName,
          Designation: values.designation,
          Department: values.department,
          Contact: values.contact,
          Email: values.email,
          Title: values.title,
          IncidentDate: values.incidentDate ? `${values.incidentDate}T00:00:00` : null,
          IncidentTime: values.incidentTime ? `${values.incidentTime}:00` : null,
          Site: values.site,
          SpecificLocation: values.specificLocation || null,
          ImpactedAreaSystem: values.impactedAreaSystem || null,
          IncidentCategory: values.incidentCategory,
          IncidentType: values.incidentType,
          OtherIncidentType: values.otherIncidentType || null,
          Severity: values.severity,
          Description: values.description,
          FacilitiesAction: values.facilitiesAction,
          VendorAction: values.vendorAction,
          CriticalLoadAffected: values.criticalLoadAffected,
          MitigationApplied: values.mitigationApplied || null,
          ImpactOnOperations: values.impactOnOperations || null,
          JiraTicketReference: values.jiraTicketReference || null,
          SystemRestored: values.systemRestored,
          RestoredAt: values.restoredAt || null,
          IncidentSummary: values.incidentSummary || null,
          Why1: values.why1 || null,
          Why2: values.why2 || null,
          Why3: values.why3 || null,
          Why4: values.why4 || null,
          Why5: values.why5 || null,
          RootCauseCategory: values.rootCauseCategory || null,
          Recommendations: values.recommendations || null,
          LessonsLearned: values.lessonsLearned || null,
          FollowUpRequired: values.followUpRequired,
          ResponsiblePerson: values.responsiblePerson || null,
          TargetCompletionDate: values.targetCompletionDate ? `${values.targetCompletionDate}T00:00:00` : null,
          ActionStatus: values.actionStatus,
          ApprovalStatus: rawData?.header.approvalStatus ?? null,
          ReviewedBy: rawData?.workflow.reviewedBy ?? null,
          ApprovedBy: rawData?.workflow.approvedBy ?? null,
          ReviewComments: rawData?.workflow.reviewComments ?? null,
          SubmittedBy: values.submittedBy,
        }),
      });
      const text = await res.text();
      let message: string | undefined;
      try {
        const json = JSON.parse(text) as { message?: string };
        message = json.message;
      } catch {
        message = text || undefined;
      }
      if (!res.ok) {
        setSaveError(message ?? `Save failed (${res.status})`);
      } else {
        setSavedBanner(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
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
            borderLeft: '5px solid #43a047',
            background: '#f6fff6',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 600, color: '#2e7031' }}>Changes saved</span>
          <span className="muted-text">The incident record has been updated successfully.</span>
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

      {saveError && (
        <div
          className="card"
          style={{
            borderLeft: '5px solid #d71920',
            background: '#fff5f5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 600, color: '#d71920' }}>Save failed</span>
          <span className="muted-text">{saveError}</span>
          <button
            className="ghost-button"
            type="button"
            style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
            onClick={() => setSaveError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <IncidentForm
        currentUser={user}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={saving ? 'Saving…' : 'Save changes'}
        submitDisabled={saving}
      />
    </div>
  );
}

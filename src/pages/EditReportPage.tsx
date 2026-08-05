import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IncidentForm } from '../components/IncidentForm';
import { AttachmentsPanel } from '../components/AttachmentsPanel';
import { useAuth } from '../contexts/AuthContext';
import { getUploadAttachmentsUrl, INCIDENT_DETAILS_API_URL, UPDATE_INCIDENT_API_URL } from '../lib/apiBase';
import { parseJiraTicketReferences, stringifyJiraTicketReferences } from '../utils/helpers';
import type { IncidentAttachmentFile, IncidentCategory, IncidentFormValues, IncidentType, ActionStatus, Impact, Severity } from '../types';

const DETAILS_API_URL = INCIDENT_DETAILS_API_URL;
const UPDATE_API_URL = UPDATE_INCIDENT_API_URL;

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
  hasAttachments: boolean;
  attachments: IncidentAttachmentFile[];
}

function parseDateTime(raw: string | null): { incidentDate: string; incidentTime: string } {
  if (!raw) return { incidentDate: '', incidentTime: '' };
  // Try ISO format: 2026-08-04T14:30...
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (isoMatch) return { incidentDate: isoMatch[1], incidentTime: isoMatch[2] };
  // Fallback: extract date/time parts in local time
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return { incidentDate: '', incidentTime: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    incidentDate: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    incidentTime: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  };
}

/** Convert any date string to YYYY-MM-DD for <input type="date">, preserving local date. */
function parseToDateInput(raw: string | null): string {
  if (!raw) return '';
  // Try ISO format first
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Fallback: extract date in local time
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** Handle 'yes'/'no', 'true'/'false', or actual booleans from the API */
function parseBooleanish(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = val.toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
}

function mapToFormValues(data: ApiDetails): IncidentFormValues {
  const { incidentDate, incidentTime } = parseDateTime(data.incidentDetail.dateTime);
  return {
    title: data.header.title,
    reporterName: '',
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
    criticalLoadAffected: parseBooleanish(data.incidentDetail.criticalLoadAffected),
    mitigationApplied: data.actionsTaken.mitigationApplied ?? '',
    impactOnOperations: (data.incidentDetail.impactOnOperations as Impact) ?? 'Minor',
    jiraTicketReference: parseJiraTicketReferences(data.incidentDetail.jiraTicketReference).join('\n'),
    systemRestored: parseBooleanish(data.incidentDetail.systemRestored),
    restoredAt: data.incidentDetail.restoredAt ?? '',
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
    targetCompletionDate: parseToDateInput(data.workflow.targetCompletionDate),
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  function fetchDetails(): Promise<ApiDetails> {
    return fetch(DETAILS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    }).then((res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      return res.json() as Promise<ApiDetails>;
    });
  }

  function refetchDetails() {
    fetchDetails()
      .then((data) => setRawData(data))
      .catch(() => { /* keep existing data on refresh failure */ });
  }

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetchDetails()
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
          editedByName: user?.fullName,
          editedByUserId: user?.id,
          incident: {
            incidentId,
            title: values.title,
            incidentDate: values.incidentDate || undefined,
            incidentTime: values.incidentTime ? `${values.incidentTime}:00` : undefined,
            site: values.site,
            specificLocation: values.specificLocation || undefined,
            impactedAreaSystem: values.impactedAreaSystem || undefined,
            incidentCategory: values.incidentCategory,
            incidentType: values.incidentType,
            otherIncidentType: values.otherIncidentType || null,
            severity: values.severity,
            description: values.description,
            facilitiesAction: values.facilitiesAction,
            vendorAction: values.vendorAction,
            criticalLoadAffected: values.criticalLoadAffected,
            mitigationApplied: values.mitigationApplied || undefined,
            impactOnOperations: values.impactOnOperations || undefined,
            jiraTicketReference: stringifyJiraTicketReferences(values.jiraTicketReference) ?? null,
            systemRestored: values.systemRestored,
            restoredAt: values.restoredAt || undefined,
            incidentSummary: values.incidentSummary || undefined,
            why1: values.why1 || undefined,
            why2: values.why2 || undefined,
            why3: values.why3 || undefined,
            why4: values.why4 || undefined,
            why5: values.why5 || undefined,
            rootCauseCategory: values.rootCauseCategory || undefined,
            recommendations: values.recommendations || undefined,
            lessonsLearned: values.lessonsLearned || undefined,
            followUpRequired: values.followUpRequired,
            responsiblePerson: values.responsiblePerson || undefined,
            targetCompletionDate: values.targetCompletionDate || undefined,
            actionStatus: values.actionStatus,
            approvalStatus: rawData?.header.approvalStatus ?? undefined,
            reviewedBy: rawData?.workflow.reviewedBy ?? null,
            approvedBy: rawData?.workflow.approvedBy ?? null,
            reviewComments: rawData?.workflow.reviewComments ?? null,
            submittedBy: rawData?.incidentDetail.submittedBy ?? undefined,
          },
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
        // Upload any staged attachments
        if (pendingFiles.length > 0 && incidentId) {
          try {
            const formData = new FormData();
            pendingFiles.forEach((file) => formData.append('files', file));
            const uploadRes = await fetch(getUploadAttachmentsUrl(incidentId), {
              method: 'POST',
              body: formData,
            });
            if (uploadRes.ok) {
              setPendingFiles([]);
              refetchDetails();
            }
          } catch {
            // non-fatal: report saved, attachments can be added later
          }
        }
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
      <div className="page-stack pbi-dashboard">
        <div className="loading-center">
          <div className="loading-spinner" />
          <p className="muted-text">Loading incident…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !initialValues || !rawData) {
    return (
      <div className="page-stack pbi-dashboard">
        <section className="card">
          <p style={{ color: 'var(--color-danger, #d71920)' }}>{fetchError ?? 'Incident not found.'}</p>
          <button className="outline-button" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go back
          </button>
        </section>
      </div>
    );
  }

  if (rawData.header.approvalStatus === 'Approved' || (initialValues.actionStatus === 'Closed' && rawData.header.approvalStatus !== 'Rejected')) {
    return (
      <div className="page-stack pbi-dashboard">
        <div className="card">
          <h3>Report locked</h3>
          <p className="muted-text">Approved or closed reports can no longer be edited. Reopen the report through the action status flow first if changes are needed.</p>
          <button className="outline-button" type="button" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack pbi-dashboard">
      <header className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="outline-button" type="button" onClick={() => navigate(`/incidents/view/${incidentId}`)}>
            <ArrowLeft size={16} /> Back to report
          </button>
        </div>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Edit report — {incidentId}</h3>
        <p className="muted-text">Update the incident record below. Fields marked with a red asterisk are required.</p>
      </header>

      {/* Locked reporter info */}
      <section className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Reporter details</h3>
        <p className="muted-text" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          Reporter information is locked and cannot be changed here.
        </p>
        <dl className="detail-list">
          <div><dt>Submitted by</dt><dd>{rawData?.incidentDetail.submittedBy ?? '—'}</dd></div>
        </dl>
      </section>

      {incidentId && (
        <AttachmentsPanel
          incidentId={incidentId}
          attachments={rawData.attachments ?? []}
          mode="staged"
          stagedFiles={pendingFiles}
          onFilesChange={setPendingFiles}
        />
      )}

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
        hideReporterSection
      />
    </div>
  );
}

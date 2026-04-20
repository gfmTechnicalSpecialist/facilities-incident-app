import { useNavigate, useParams } from 'react-router-dom';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { getIncidentById, updateIncident } from '../services/incidentService';
import type { IncidentFormValues } from '../types';

export function EditIncidentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const incident = id ? getIncidentById(id) : undefined;

  if (!user || !incident) {
    return <div className="card">Incident not found.</div>;
  }

  if (incident.actionStatus === 'Closed') {
    return (
      <div className="page-stack">
        <div className="card">
          <h3>Report locked</h3>
          <p className="muted-text">Closed reports can no longer be edited. Reopen the report through the action status flow first if changes are needed.</p>
        </div>
      </div>
    );
  }

  const initialValues: IncidentFormValues = {
    title: incident.title,
    reporterName: incident.reporterName,
    designation: incident.designation,
    department: incident.department,
    contact: incident.contact,
    email: incident.email,
    incidentDate: incident.incidentDate,
    incidentTime: incident.incidentTime,
    site: incident.site,
    specificLocation: incident.specificLocation,
    impactedAreaSystem: incident.impactedAreaSystem,
    incidentCategory: incident.incidentCategory,
    incidentType: incident.incidentType,
    otherIncidentType: incident.otherIncidentType,
    severity: incident.severity,
    description: incident.description,
    facilitiesAction: incident.facilitiesAction,
    vendorAction: incident.vendorAction,
    criticalLoadAffected: incident.criticalLoadAffected,
    mitigationApplied: incident.mitigationApplied,
    impactOnOperations: incident.impactOnOperations,
    jiraTicketReference: incident.jiraTicketReference,
    systemRestored: incident.systemRestored,
    restoredAt: incident.restoredAt,
    incidentSummary: incident.incidentSummary,
    why1: incident.why1,
    why2: incident.why2,
    why3: incident.why3,
    why4: incident.why4,
    why5: incident.why5,
    rootCauseCategory: incident.rootCauseCategory,
    recommendations: incident.recommendations,
    lessonsLearned: incident.lessonsLearned,
    followUpRequired: incident.followUpRequired,
    responsiblePerson: incident.responsiblePerson,
    targetCompletionDate: incident.targetCompletionDate,
    actionStatus: incident.actionStatus,
    submittedBy: incident.submittedBy,
  };

  function handleSubmit(values: IncidentFormValues) {
    const updated = updateIncident(incident.id, values);
    navigate(`/incidents/${updated.id}`);
  }

  return (
    <div className="page-stack">
      <div className="card">
        <h3>Edit report</h3>
        <p className="muted-text">Admin users can update the incident record and the action status.</p>
      </div>
      <IncidentForm currentUser={user} initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}

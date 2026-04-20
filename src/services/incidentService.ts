import type { ApprovalStatus, Incident, IncidentComment, IncidentFormValues, ActionStatus } from '../types';
import { getStoredComments, getStoredIncidents, saveStoredComments, saveStoredIncidents } from '../lib/storage';
import { generateId, generateIncidentId } from '../utils/helpers';

export function listIncidents(): Incident[] {
  return getStoredIncidents().sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
}

export function getIncidentById(id: string): Incident | undefined {
  return getStoredIncidents().find((incident) => incident.id === id);
}

export function createIncident(values: IncidentFormValues): Incident {
  const incidents = getStoredIncidents();
  const now = new Date().toISOString();
  const incident: Incident = {
    id: generateId('incident'),
    incidentId: generateIncidentId(incidents.length),
    ...values,
    approvalStatus: 'Pending',
    reviewedBy: '',
    approvedBy: '',
    reviewComments: '',
    createdAt: now,
    updatedAt: now,
  };

  const next = [incident, ...incidents];
  saveStoredIncidents(next);
  return incident;
}

export function updateIncident(id: string, values: IncidentFormValues): Incident {
  const incidents = getStoredIncidents();
  const existing = incidents.find((incident) => incident.id === id);

  if (!existing) {
    throw new Error('Incident not found');
  }

  if (existing.actionStatus === 'Closed') {
    throw new Error('Closed reports cannot be edited');
  }

  const updated: Incident = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };

  const next = incidents.map((incident) => (incident.id === id ? updated : incident));
  saveStoredIncidents(next);
  return updated;
}

export function updateIncidentStatus(id: string, actionStatus: ActionStatus): Incident {
  const incident = getIncidentById(id);
  if (!incident) {
    throw new Error('Incident not found');
  }
  return updateIncident(id, {
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
    actionStatus,
    submittedBy: incident.submittedBy,
  });
}

export function updateIncidentReview(
  id: string,
  input: {
    approvalStatus: ApprovalStatus;
    reviewComments: string;
    reviewerName: string;
    approverName: string;
  },
): Incident {
  const incidents = getStoredIncidents();
  const existing = incidents.find((incident) => incident.id === id);

  if (!existing) {
    throw new Error('Incident not found');
  }

  const updated: Incident = {
    ...existing,
    approvalStatus: input.approvalStatus,
    reviewedBy: input.reviewerName,
    approvedBy: input.approvalStatus === 'Approved' ? input.approverName : existing.approvedBy,
    reviewComments: input.reviewComments,
    updatedAt: new Date().toISOString(),
  };

  const next = incidents.map((incident) => (incident.id === id ? updated : incident));
  saveStoredIncidents(next);
  return updated;
}

export function listComments(incidentId: string): IncidentComment[] {
  return getStoredComments()
    .filter((comment) => comment.incidentId === incidentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addComment(input: Omit<IncidentComment, 'id' | 'createdAt'>): IncidentComment {
  const comments = getStoredComments();
  const comment: IncidentComment = {
    id: generateId('comment'),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const next = [...comments, comment];
  saveStoredComments(next);
  return comment;
}

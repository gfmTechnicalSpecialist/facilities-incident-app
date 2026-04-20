import type { Incident, IncidentComment } from '../types';
import { demoComments, demoIncidents } from '../data/demoData';

const INCIDENTS_KEY = 'momentum_incidents';
const COMMENTS_KEY = 'momentum_incident_comments';

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeIncident(incident: Partial<Incident>, index: number): Incident {
  const base = demoIncidents[index % demoIncidents.length];
  return {
    ...base,
    ...incident,
    incidentSummary: incident.incidentSummary ?? (incident as Partial<Incident> & { rootCause?: string }).rootCause ?? base.incidentSummary,
    why1: incident.why1 ?? base.why1,
    why2: incident.why2 ?? base.why2,
    why3: incident.why3 ?? base.why3,
    why4: incident.why4 ?? base.why4,
    why5: incident.why5 ?? base.why5,
    lessonsLearned: incident.lessonsLearned ?? base.lessonsLearned,
    recommendations: incident.recommendations ?? base.recommendations,
    jiraTicketReference: incident.jiraTicketReference ?? '',
    criticalLoadAffected: Boolean(incident.criticalLoadAffected),
    systemRestored: Boolean(incident.systemRestored),
    approvalStatus: incident.approvalStatus ?? 'Pending',
    reviewedBy: incident.reviewedBy ?? '',
    approvedBy: incident.approvedBy ?? '',
    reviewComments: incident.reviewComments ?? '',
  };
}

export function getStoredIncidents(): Incident[] {
  const incidents = readJson<Partial<Incident>[]>(INCIDENTS_KEY, []);
  if (incidents.length === 0) {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(demoIncidents));
    return demoIncidents;
  }
  const normalized = incidents.map(normalizeIncident);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveStoredIncidents(incidents: Incident[]): void {
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
}

export function getStoredComments(): IncidentComment[] {
  const comments = readJson<IncidentComment[]>(COMMENTS_KEY, []);
  if (comments.length === 0) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(demoComments));
    return demoComments;
  }
  return comments.map((comment) => ({ ...comment, userRole: comment.userRole ?? 'viewer' }));
}

export function saveStoredComments(comments: IncidentComment[]): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

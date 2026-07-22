import type { IncidentCategory, IncidentType, Impact, Severity, ActionStatus, ApprovalStatus, AppUser } from '../types';

export const sites = ['Centurion', 'PDC', 'Durban', 'Cape Town', 'Sandton', 'Other'];

// Users allowed to approve/reject incident reports, regardless of their base role.
export const APPROVER_USER_IDS = ['admin_jacob_lesale', 'approver_noba_d', 'approver_jason_m'];

export function isApprover(user: AppUser | null | undefined): boolean {
  return !!user && APPROVER_USER_IDS.includes(user.id);
}

export const incidentCategoryMap: Record<IncidentCategory, IncidentType[]> = {
  'Safety & Health': ['Personal Injury', 'Near Miss', 'Occupational Illness'],
  'Equipment & Systems': ['HVAC Failure', 'Electrical Issue', 'Plumbing Problem'],
  Environmental: ['Spill/Release', 'Waste Management', 'Air Quality'],
  Security: ['Unauthorized Access', 'Theft/Vandalism', 'System Breach'],
  'Fire & Life Safety': ['Fire/Smoke', 'Alarm Malfunction', 'Evacuation Issue'],
  'Property Damage': ['Structural Damage', 'Vehicle Damage', 'Equipment Damage'],
  Other: ['Other'],
};

export const incidentCategories = Object.keys(incidentCategoryMap) as IncidentCategory[];
export const severities: Severity[] = ['Low', 'Moderate', 'High', 'Critical'];
export const impacts: Impact[] = ['No Impact', 'Minor', 'Moderate', 'Major'];
export const actionStatuses: ActionStatus[] = ['Open', 'In Progress', 'Pending Review', 'Closed'];
export const approvalStatuses: ApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];

export const rootCauseCategories = [
  'Human Error',
  'Equipment Failure',
  'Communication/System Failure',
  'Vendor Issue',
  'External Factor',
  'Theft/Sabotage',
  'Process Gap',
];

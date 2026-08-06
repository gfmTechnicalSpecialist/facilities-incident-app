import type { IncidentCategory, IncidentType, Impact, Severity, ActionStatus, ApprovalStatus, AppUser } from '../types';

export const sites = ['Centurion', 'PDC', 'Durban', 'Cape Town', 'Sandton', 'Other'];

// Additional users allowed to approve/reject incident reports. Matched by full
// name (case-insensitive).
export const APPROVER_FULL_NAMES: string[] = [
  'Jacob Lesale',
  'Nobathembu Yekiso',
];

export function isApprover(user: AppUser | null | undefined): boolean {
  if (!user) return false;
  const name = user.fullName.trim().toLowerCase();
  return APPROVER_FULL_NAMES.some((approverName) => name === approverName.toLowerCase() || name.includes(approverName.toLowerCase()));
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
export const approvalStatuses: ApprovalStatus[] = ['Draft', 'Pending', 'Approved', 'Rejected'];

export const rootCauseCategories = [
  'Human Error',
  'Equipment Failure',
  'Communication/System Failure',
  'Vendor Issue',
  'External Factor',
  'Theft/Sabotage',
  'Process Gap',
];

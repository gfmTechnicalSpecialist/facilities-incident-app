export type UserRole = 'admin' | 'viewer';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface UserRecord extends AppUser {
  initialPassword: string;
}

export type IncidentCategory =
  | 'Safety & Health'
  | 'Equipment & Systems'
  | 'Environmental'
  | 'Security'
  | 'Fire & Life Safety'
  | 'Property Damage'
  | 'Other';

export type IncidentType =
  | 'Personal Injury'
  | 'Near Miss'
  | 'Occupational Illness'
  | 'HVAC Failure'
  | 'Electrical Issue'
  | 'Plumbing Problem'
  | 'Spill/Release'
  | 'Waste Management'
  | 'Air Quality'
  | 'Unauthorized Access'
  | 'Theft/Vandalism'
  | 'System Breach'
  | 'Fire/Smoke'
  | 'Alarm Malfunction'
  | 'Evacuation Issue'
  | 'Structural Damage'
  | 'Vehicle Damage'
  | 'Equipment Damage'
  | 'Other';

export type Severity = 'Low' | 'Moderate' | 'High' | 'Critical';
export type Impact = 'No Impact' | 'Minor' | 'Moderate' | 'Major';
export type ActionStatus = 'Open' | 'In Progress' | 'Pending Review' | 'Closed';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Incident {
  id: string;
  incidentId: string;
  title: string;
  reporterName: string;
  designation: string;
  department: string;
  contact: string;
  email: string;
  incidentDate: string;
  incidentTime: string;
  site: string;
  specificLocation: string;
  impactedAreaSystem: string;
  incidentCategory: IncidentCategory;
  incidentType: IncidentType;
  otherIncidentType?: string;
  severity: Severity;
  description: string;
  facilitiesAction: string;
  vendorAction: string;
  criticalLoadAffected: boolean;
  mitigationApplied: string;
  impactOnOperations: Impact;
  jiraTicketReference: string;
  systemRestored: boolean;
  restoredAt?: string;
  incidentSummary: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCauseCategory: string;
  recommendations: string;
  lessonsLearned: string;
  followUpRequired: boolean;
  responsiblePerson: string;
  targetCompletionDate?: string;
  actionStatus: ActionStatus;
  approvalStatus: ApprovalStatus;
  reviewedBy: string;
  approvedBy: string;
  reviewComments: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  commentText: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  createdAt: string;
}

export interface IncidentFormValues
  extends Omit<Incident, 'id' | 'incidentId' | 'createdAt' | 'updatedAt' | 'approvalStatus' | 'reviewedBy' | 'approvedBy' | 'reviewComments'> {}

import { APPROVE_INCIDENT_API_URL } from '../lib/apiBase';

export interface ApprovalData {
  incidentId: string;
  approvalStatus: 'Approved' | 'Rejected';
  reviewComments: string;
  reviewerName: string;
}

export async function approveIncident(approvalData: ApprovalData) {
  const response = await fetch(APPROVE_INCIDENT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inidentId: approvalData.incidentId,
      approvalStatus: approvalData.approvalStatus,
      reviewComments: approvalData.reviewComments,
      reviewerName: approvalData.reviewerName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Approval request failed with status ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

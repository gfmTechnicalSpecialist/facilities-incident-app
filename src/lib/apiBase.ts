/**
 * In development the Vite proxy rewrites /gfmapi/* to the Azure Functions host,
 * bypassing CORS restrictions. In production the absolute URL is used directly
 * (the Azure Function should have CORS configured for the deployed origin).
 */
export const API_BASE = import.meta.env.DEV
  ? '/gfmapi'
  : 'https://gfmincidentreportingapi-grgeh5edbvffagfs.northeurope-01.azurewebsites.net';

const signInFunctionCode = import.meta.env.VITE_SIGN_IN_FUNCTION_CODE;
const dashboardDataFunctionCode = import.meta.env.VITE_DASHBOARD_DATA_FUNCTION_CODE;
const incidentDetailsFunctionCode = import.meta.env.VITE_INCIDENT_DETAILS_FUNCTION_CODE;
const updateIncidentFunctionCode = import.meta.env.VITE_UPDATE_INCIDENT_FUNCTION_CODE;
const reportsDataFunctionCode = import.meta.env.VITE_REPORTS_DATA_FUNCTION_CODE;
const userReportsFunctionCode = import.meta.env.VITE_USER_REPORTS_FUNCTION_CODE;
const addIncidentFunctionCode = import.meta.env.VITE_ADD_INCIDENT_FUNCTION_CODE;
const approveIncidentFunctionCode = import.meta.env.VITE_APPROVE_INCIDENT_FUNCTION_CODE;
const editHistoryFunctionCode = import.meta.env.VITE_EDIT_HISTORY_FUNCTION_CODE;
const addIncidentCommentFunctionCode = import.meta.env.VITE_ADD_INCIDENT_COMMENT_FUNCTION_CODE;
const uploadAttachmentsFunctionCode = import.meta.env.VITE_UPLOAD_ATTACHMENTS_FUNCTION_CODE;

function getFunctionUrl(path: string, code?: string) {
  const url = `${API_BASE}${path}`;
  return code ? `${url}?code=${encodeURIComponent(code)}` : url;
}

export const HEALTH_CHECK_URL = `${API_BASE}/api/health`;
export const SIGN_IN_URL = getFunctionUrl('/api/SignIn', signInFunctionCode);
export const DASHBOARD_API_URL = getFunctionUrl('/api/GetDashboardData', dashboardDataFunctionCode);
export const INCIDENT_DETAILS_API_URL = getFunctionUrl('/api/GetIncidentDetails', incidentDetailsFunctionCode);
export const UPDATE_INCIDENT_API_URL = getFunctionUrl('/api/UpdateIncident', updateIncidentFunctionCode);
export const REPORTS_DATA_API_URL = getFunctionUrl('/api/GetReportsData', reportsDataFunctionCode);
export const USER_REPORTS_API_URL = getFunctionUrl('/api/GetUserReports', userReportsFunctionCode);
export const ADD_INCIDENT_API_URL = getFunctionUrl('/api/AddIncident', addIncidentFunctionCode);
export const APPROVE_INCIDENT_API_URL = getFunctionUrl('/api/ApproveIncident', approveIncidentFunctionCode);
export const EDIT_HISTORY_API_URL = getFunctionUrl('/api/GetIncidentEdits', editHistoryFunctionCode);
export const ADD_INCIDENT_COMMENT_API_URL = getFunctionUrl('/api/AddIncidentComment', addIncidentCommentFunctionCode);

/** Builds the multipart upload URL for a given incident's attachments (route includes incidentId as a path segment). */
export function getUploadAttachmentsUrl(incidentId: string): string {
  return getFunctionUrl(`/api/incidents/${encodeURIComponent(incidentId)}/attachments`, uploadAttachmentsFunctionCode);
}

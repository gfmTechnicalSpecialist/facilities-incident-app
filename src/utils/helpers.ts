import type { Incident } from '../types';

const incidentTypeColorMap: Record<string, string> = {
  'Personal Injury': '#d71920',
  'Near Miss': '#0057b8',
  'Occupational Illness': '#ff7a00',
  'HVAC Failure': '#7b61ff',
  'Electrical Issue': '#00a6a6',
  'Plumbing Problem': '#26a69a',
  'Spill/Release': '#5c6bc0',
  'Waste Management': '#43a047',
  'Air Quality': '#9c27b0',
  'Unauthorized Access': '#6f42c1',
  'Theft/Vandalism': '#8d1b3d',
  'System Breach': '#00a1ff',
  'Fire/Smoke': '#ff4d4f',
  'Alarm Malfunction': '#ffb000',
  'Evacuation Issue': '#795548',
  'Structural Damage': '#607d8b',
  'Vehicle Damage': '#e91e63',
  'Equipment Damage': '#3f51b5',
  Other: '#6c757d',
};

const siteColorMap: Record<string, string> = {
  Centurion: '#d71920',
  PDC: '#0057b8',
  Durban: '#ffb000',
  'Cape Town': '#00a6a6',
  Sandton: '#7b61ff',
  Other: '#43a047',
};

const monthPalette = ['#d71920', '#0057b8', '#ffb000', '#00a6a6', '#7b61ff', '#43a047', '#8d1b3d', '#6c757d', '#ff7a00', '#5c6bc0', '#26a69a', '#9c27b0'];

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateIncidentId(count: number): string {
  const year = new Date().getFullYear();
  return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export function formatListDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function monthYearLabel(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}


export function approvalStatusLabel(status: string): string {
  return status === 'Pending' ? 'Pending Approval' : status;
}

export function approvalStatusClass(status: string): string {
  return `approval-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function withMappedColors(items: { name: string; value: number }[], colorMap: Record<string, string>, fallbackPalette: string[]) {
  return items.map((item, index) => ({
    ...item,
    color: colorMap[item.name] ?? fallbackPalette[index % fallbackPalette.length],
  }));
}

export function countByType(incidents: Incident[]) {
  const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const label = incident.incidentType === 'Other' && incident.otherIncidentType ? incident.otherIncidentType : incident.incidentType;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return withMappedColors(
    Object.entries(counts).map(([name, value]) => ({ name, value })),
    incidentTypeColorMap,
    monthPalette,
  );
}

export function countBySite(incidents: Incident[]) {
  const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
    acc[incident.site] = (acc[incident.site] || 0) + 1;
    return acc;
  }, {});

  return withMappedColors(
    Object.entries(counts).map(([name, value]) => ({ name, value })),
    siteColorMap,
    monthPalette,
  );
}

export function countByMonth(incidents: Incident[]) {
  const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const month = new Date(incident.incidentDate).toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value], index) => ({
    name,
    value,
    color: monthPalette[index % monthPalette.length],
  }));
}

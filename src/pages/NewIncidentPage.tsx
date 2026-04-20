import { useNavigate } from 'react-router-dom';
import { IncidentForm } from '../components/IncidentForm';
import { useAuth } from '../contexts/AuthContext';
import { createIncident } from '../services/incidentService';
import type { IncidentFormValues } from '../types';

export function NewIncidentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  function handleSubmit(values: IncidentFormValues) {
    const incident = createIncident(values);
    navigate(`/incidents/${incident.id}`);
  }

  return (
    <div className="page-stack">
      <div className="card">
        <h3>Log a new report</h3>
        <p className="muted-text">Only admin users can create or edit incident reports.</p>
      </div>
      <IncidentForm currentUser={user} onSubmit={handleSubmit} submitLabel="Create report" />
    </div>
  );
}

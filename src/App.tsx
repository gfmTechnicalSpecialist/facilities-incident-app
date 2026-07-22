import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { HEALTH_CHECK_URL } from './lib/apiBase';
import { DashboardPage } from './pages/DashboardPage';
import { EditIncidentPage } from './pages/EditIncidentPage';
import { EditReportPage } from './pages/EditReportPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { IncidentViewPage } from './pages/IncidentViewPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { LoginPage } from './pages/LoginPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { ApprovalsPage } from './pages/ApprovalsPage';

function App() {
  useEffect(() => {
    fetch(HEALTH_CHECK_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Health check returned ${res.status}`);
        return res.text();
      })
      .then((body) => console.info('API health check OK', body))
      .catch((err: unknown) =>
        console.warn('API health check failed', err instanceof Error ? err.message : err),
      );
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/sign-in" replace />} />
          <Route path="/sign-in" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
              <Route path="/incidents/view/:incidentId" element={<IncidentViewPage />} />
              <Route path="/incidents/:id" element={<IncidentDetailPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/incidents/new" element={<NewIncidentPage />} />
                <Route path="/incidents/:id/edit" element={<EditIncidentPage />} />
                <Route path="/incidents/view/:incidentId/edit" element={<EditReportPage />} />
              </Route>
              <Route path="/approvals" element={<ApprovalsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

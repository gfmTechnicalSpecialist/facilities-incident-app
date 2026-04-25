import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/incidents" replace />;
  }

  return <Outlet />;
}

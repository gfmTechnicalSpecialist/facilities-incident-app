import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isApprover } from '../utils/constants';

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

export function ApproverRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isApprover(user)) {
    return <Navigate to="/incidents" replace />;
  }

  return <Outlet />;
}

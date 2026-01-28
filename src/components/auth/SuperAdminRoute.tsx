import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isSuperAdmin } from '../../api/admin';
import { Loader2 } from 'lucide-react';

interface SuperAdminRouteProps {
  children: ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin(user?.email)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

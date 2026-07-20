import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

interface UserProfile {
  id: string;
  email: string;
  rol: string;
}

export function ProtectedRoute() {
  const location = useLocation();
  const { data: user, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['auth-user'],
    queryFn: () => apiClient.get<UserProfile>('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

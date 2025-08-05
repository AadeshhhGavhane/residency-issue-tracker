import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@/store';
import { checkAuth } from '@/store/slices/authSlice';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, roles }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, user, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (!isInitialized) {
      console.log('AuthGuard: Checking authentication...');
      dispatch(checkAuth());
    }
  }, [dispatch, isInitialized]);

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    console.log('AuthGuard: Loading state - isInitialized:', isInitialized, 'isLoading:', isLoading);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-96" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('AuthGuard: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    console.log('AuthGuard: Role mismatch, user role:', user.role, 'required roles:', roles);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AuthGuard: Authentication successful, user:', user?.name, 'role:', user?.role);
  return <>{children}</>;
};

export default AuthGuard;
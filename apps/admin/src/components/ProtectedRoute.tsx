import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '@vitamin/types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== Role.ADMIN) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-500">
          Your account <span className="font-medium text-gray-700">({user.email})</span> does
          not have admin privileges.
        </p>
        <Navigate to="/login" replace />
      </main>
    );
  }

  return <>{children}</>;
}
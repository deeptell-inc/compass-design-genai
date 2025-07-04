import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminGuard = ({ children, fallback }: AdminGuardProps) => {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          ログインが必要です。
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <Alert className="border-red-200 bg-red-50">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          この機能は管理者のみ利用できます。
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}; 
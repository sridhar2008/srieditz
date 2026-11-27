import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAdmin, isAuthReady, emailVerified, resendVerification, refreshUserSession, logout } = useAuth();
  const location = useLocation();
  const [resent, setResent] = React.useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        <p className="text-sm">Verifying studio session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!emailVerified) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl bg-[#101014] border border-zinc-800 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto">
            <MailCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-white">Verify Your Email</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            To protect your private project files and account, please click the verification link sent to{' '}
            <span className="text-zinc-200 font-medium">{user.email}</span>.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => void refreshUserSession()}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors cursor-pointer"
            >
              I Have Verified My Email
            </button>
            <button
              type="button"
              onClick={async () => {
                await resendVerification();
                setResent(true);
              }}
              className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-200 text-sm font-medium hover:border-zinc-500 transition-colors cursor-pointer"
            >
              {resent ? 'Verification Email Sent' : 'Resend Verification Email'}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs text-zinc-500 hover:text-zinc-300 pt-1 cursor-pointer"
            >
              Sign out and use another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

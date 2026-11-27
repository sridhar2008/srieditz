import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { StudioLogo } from '../../components/common/StudioLogo';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, isAdmin, isAuthReady, loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (user && isAuthReady) {
      if (from) navigate(from, { replace: true });
      else navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, isAuthReady, from, navigate]);

  const mapAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled in the Firebase Console yet. Please use Continue with Google or enable Email/Password under Firebase Console → Authentication → Sign-in method.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before completion.';
    }
    return msg;
  };

  const handleGoogle = async () => {
    setError('');
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await loginWithEmail(email, password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#101014] border border-zinc-800 p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-3">
          <StudioLogo size="lg" showWordmark={false} />
          <div>
            <h1 className="text-3xl font-display font-semibold text-white">Welcome Back</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Sign in to SRI EDITING STUDIO to manage your editing projects
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogle()}
          className="w-full py-2.5 px-4 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-zinc-800" />
          <span className="shrink mx-3 text-xs text-zinc-500">or sign in with email</span>
          <div className="flex-grow border-t border-zinc-800" />
        </div>

        <form onSubmit={(e) => void handleEmail(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#D4AF37] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                aria-label={showPass ? 'Hide password' : 'Show password'}
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          New to Sri Editing Studio?{' '}
          <Link to="/signup" className="text-[#D4AF37] font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

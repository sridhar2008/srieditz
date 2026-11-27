import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StudioLogo } from '../../components/common/StudioLogo';
import { useAuth } from '../../context/AuthContext';

export const SignupPage: React.FC = () => {
  const { user, isAdmin, isAuthReady, loginWithGoogle, registerWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.emailVerified && isAuthReady) {
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, isAuthReady, navigate]);

  const handleGoogle = async () => {
    setError('');
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await registerWithEmail(name, email, password);
      setCreated(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/operation-not-allowed')) {
        setError(
          'Email/Password registration is not enabled in the Firebase Console yet. Please use Continue with Google or enable Email/Password under Firebase Console → Authentication → Sign-in method.'
        );
      } else {
        setError(msg);
      }
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
            <h1 className="text-3xl font-display font-semibold text-white">Create Account</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Join SRI EDITING STUDIO to submit projects and track edits
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogle()}
          className="w-full py-2.5 px-4 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-zinc-800" />
          <span className="shrink mx-3 text-xs text-zinc-500">or register with email</span>
          <div className="flex-grow border-t border-zinc-800" />
        </div>

        {created ? (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-5 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-base font-semibold text-white">Verification Email Sent</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              We sent a verification link to <span className="font-medium text-white">{email}</span>. Verify your inbox, then visit your dashboard.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold"
            >
              Continue to Dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
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
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#D4AF37] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

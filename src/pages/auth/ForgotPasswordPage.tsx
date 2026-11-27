import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { StudioLogo } from '../../components/common/StudioLogo';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#101014] border border-zinc-800 p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <StudioLogo size="md" showWordmark={false} />
          <h1 className="text-3xl font-display font-semibold text-white">Reset Password</h1>
          <p className="text-xs text-zinc-400">
            Enter your email address and we will send a Firebase password reset link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-5 text-center space-y-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <p className="text-xs text-zinc-200">
              Password reset email sent to <span className="font-semibold">{email}</span>.
            </p>
            <Link to="/login" className="inline-block text-xs text-[#D4AF37] hover:underline">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#D4AF37] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

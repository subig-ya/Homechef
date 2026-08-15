import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, MailCheck } from 'lucide-react';
import API from '../api/axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#F0DDE2] bg-white p-8 shadow-[0_25px_70px_rgba(104,63,76,0.10)] space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE4EC] text-[#C45B7C]">
          {sent ? <MailCheck size={20} /> : <Lock size={20} />}
        </div>

        {sent ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-[#3A233C]">Check your email</h1>
            <p className="text-sm text-slate-500">
              If an account exists for <span className="font-semibold text-[#3A233C]">{email}</span>, a
              password reset link and code have been sent. Follow the link in the email to choose a new password.
            </p>
            <p className="text-xs text-slate-400">The code expires in 1 hour.</p>
            <div className="rounded-xl border border-[#F0DDE2] bg-[#FFF9FB] p-4 text-xs text-slate-600">
              Didn't get it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => { setSent(false); setError(''); }}
                className="font-bold text-[#C45B7C] hover:underline"
              >
                try again
              </button>
              .
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-[#3A233C]">Forgot your password?</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter the email you registered with and we'll send you a password reset code.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#563A35]">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-13 w-full rounded-2xl border border-[#EBD8DE] bg-[#FFFAFC] px-4 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:border-[#D96F91] focus:bg-white focus:ring-4 focus:ring-[#D96F91]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D96F91] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(217,111,145,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset email'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          </>
        )}

        <p className="pt-2 text-xs text-slate-500 border-t border-[#F0E1E5]">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-[#C45B7C] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

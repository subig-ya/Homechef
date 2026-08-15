import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import API from '../api/axios';

const ResetPasswordPage = () => {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      await API.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#F0DDE2] bg-white p-8 shadow-[0_25px_70px_rgba(104,63,76,0.10)] space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE4EC] text-[#C45B7C]">
          <KeyRound size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#3A233C]">Set a new password</h1>
          <p className="mt-1.5 text-sm text-slate-500">Choose a strong password for your account.</p>
        </div>

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Password updated successfully!
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#4B254B] hover:underline"
            >
              Go to login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#563A35]">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="h-13 w-full rounded-2xl border border-[#EBD8DE] bg-[#FFFAFC] px-4 pr-12 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:border-[#D96F91] focus:bg-white focus:ring-4 focus:ring-[#D96F91]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A98B87] transition hover:text-[#D96F91]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#563A35]">Confirm new password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="h-13 w-full rounded-2xl border border-[#EBD8DE] bg-[#FFFAFC] px-4 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:border-[#D96F91] focus:bg-white focus:ring-4 focus:ring-[#D96F91]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D96F91] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(217,111,145,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset password'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

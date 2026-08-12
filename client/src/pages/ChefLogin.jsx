import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ChefLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const successMessage = location.state?.message || '';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', formData);
      const { token, user } = response.data.data;

      localStorage.setItem('homechef_token', token);
      localStorage.setItem('homechef_user', JSON.stringify(user));

      if (user.role === 'HOMECHEF') {
        navigate('/dashboard');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Chef login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs grid md:grid-cols-[7fr_5fr]">
        <div className="p-8 md:p-10 space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#3A233C]">Chef Login</h2>
            <p className="mt-1 text-xs text-slate-500">Sign in to manage your profile and orders.</p>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="chef@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Want to join?{' '}
            <Link to="/chef/register" className="font-bold text-[#4B254B] hover:underline">
              Create a chef account
            </Link>
          </p>
        </div>

        <div className="relative block overflow-hidden bg-[#FDE7EF] md:order-last">
          <img
            src="https://i.pinimg.com/736x/0e/fb/88/0efb886aa26b5bf1641fcfb736a14079.jpg"
            alt="HomeChef chef"
            className="h-56 w-full object-cover md:h-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#381E39]/60 to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">HomeChef Chef Portal</p>
            <p className="mt-1 text-lg font-extrabold text-white">Welcome back, chef.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefLogin;

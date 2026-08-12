import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Login = () => {
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs grid md:grid-cols-2">
        <div className="relative hidden md:block bg-[#FAF4F7]">
          <img
            src="https://i.pinimg.com/736x/c9/34/e4/c934e46b425b3d04ea75225684752b33.jpg"
            alt="HomeChef chef"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#381E39]/70 to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">HomeChef</p>
            <p className="mt-1 text-lg font-extrabold text-white">Book a chef who cooks in your home</p>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3A233C]">Log in to HomeChef</h2>
          <p className="mt-1 text-xs text-slate-500">Welcome back! Please enter your details.</p>
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
              placeholder="you@example.com"
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
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          New here?{' '}
          <Link to="/register" className="font-bold text-[#4B254B] hover:underline">
            Create an account
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

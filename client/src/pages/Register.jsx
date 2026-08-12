import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/auth/register', formData);
      navigate('/login', { state: { message: 'Account created successfully. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3A233C]">Create your account</h2>
          <p className="mt-1 text-xs text-slate-500">Join HomeChef and start exploring local artisanal food.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Your full name"
              required
            />
          </div>

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
              placeholder="Choose a password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="555-0199"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Downtown"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#4B254B] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

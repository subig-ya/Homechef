import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ChefRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialties: '',
    yearsOfExperience: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await API.post('/auth/register', {
        ...formData,
        role: 'HOMECHEF',
        specialties: formData.specialties
          .split(',')
          .map((specialty) => specialty.trim())
          .filter(Boolean),
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        location: ''
      });

      navigate('/chef/login', {
        state: { message: 'Chef account created successfully. Please log in.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Chef registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs space-y-4">
        <div className="text-center">
          <img
            src="https://i.pinimg.com/736x/69/40/2d/69402d4df6428b531c987e74df835a27.jpg"
            alt="HomeChef logo"
            className="mx-auto h-24 w-24 rounded-full border-[6px] border-[#FDE7EF] object-cover shadow-sm"
          />
          <h2 className="mt-3 text-2xl font-extrabold text-[#3A233C]">Register as a Chef</h2>
          <p className="mt-1 text-xs text-slate-500">Create your special chef account and start sharing your cuisine.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
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
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="+977 98XXXXXXXX"
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
              placeholder="Choose a password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Re-enter password"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Specialities</label>
            <input
              type="text"
              name="specialties"
              value={formData.specialties}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Italian, Desserts, Family meals"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Years of Experience</label>
            <input
              type="number"
              min="0"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="5"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
          >
            {loading ? 'Creating chef account...' : 'Create chef account'}
          </button>
        </form>

        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have a chef account?{' '}
          <Link to="/chef/login" className="font-bold text-[#4B254B] hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ChefRegister;

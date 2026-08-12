import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const AvailabilityPage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchSlots = async () => {
      try {
        const response = await API.get('/slots/chef', { headers: { Authorization: `Bearer ${token}` } });
        setSlots(response.data.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load slots');
      }
    };

    fetchSlots();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('homechef_token');
      const response = await API.post('/slots', { ...form, maxBookings: Number(form.maxBookings) }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message || 'Slot created');
      setForm({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
      const updated = await API.get('/slots/chef', { headers: { Authorization: `Bearer ${token}` } });
      setSlots(updated.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Manage availability</h2>
        <p className="mt-2 text-sm text-slate-600">Create simple time slots for your bookings.</p>

        {message && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Date</label>
            <input type="date" name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Slot</label>
            <select name="slotType" value={form.slotType} onChange={(e) => setForm({ ...form, slotType: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
              <option value="MORNING">MORNING</option>
              <option value="AFTERNOON">AFTERNOON</option>
              <option value="EVENING">EVENING</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Start time</label>
            <input type="text" name="startTime" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="9:00 AM" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">End time</label>
            <input type="text" name="endTime" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="12:00 PM" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Max bookings</label>
            <input type="number" name="maxBookings" value={form.maxBookings} onChange={(e) => setForm({ ...form, maxBookings: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" min="1" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60">{loading ? 'Saving...' : 'Create slot'}</button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">Your slots</h3>
          <div className="mt-4 space-y-3">
            {slots.length === 0 ? <p className="text-slate-600">No slots yet.</p> : slots.map((slot) => (
              <div key={slot._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{slot.date} • {slot.slotType}</p>
                <p className="text-sm text-slate-600">{slot.startTime} - {slot.endTime} • Status: {slot.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;

import React, { useState } from 'react';
import API from '../../../api/axios';
import StatusBadge from '../../../components/chef/StatusBadge';
import { EmptyState } from '../../../components/chef/FeedbackStates';
import { CalendarDays, Loader2, Info } from 'lucide-react';
import { SLOT_TYPE_LABEL } from '../utils';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const SLOT_ORDER = ['MORNING', 'AFTERNOON', 'EVENING'];

const AvailabilitySection = ({ slots, refresh }) => {
  const [form, setForm] = useState({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date) || SLOT_ORDER.indexOf(a.slotType) - SLOT_ORDER.indexOf(b.slotType));

  const upcoming = sorted.filter((s) => s.date >= new Date().toISOString().slice(0, 10));
  const past = sorted.filter((s) => s.date < new Date().toISOString().slice(0, 10));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await API.post('/slots', { ...form, maxBookings: Number(form.maxBookings) || 1 }, { headers: getToken() });
      setMessage({ type: 'success', text: response.data.message || 'Slot created.' });
      setForm({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to create the slot.' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#EAD3DC] bg-[#FFF9F5] px-4 py-3.5 text-xs text-[#76534A]">
        <Info size={15} className="mt-0.5 shrink-0 text-[#C45B7C]" />
        <p>
          Slots are how customers request to book you. Each date + slot type is unique — you cannot create a slot that
          overlaps an existing one, which prevents double-booked time. As bookings are accepted the slot fills up.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-[#381E39]">Add availability</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Date</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Slot</label>
            <select className={inputCls} value={form.slotType} onChange={(e) => setForm({ ...form, slotType: e.target.value })}>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Start time</label>
            <input className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="9:00 AM" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">End time</label>
            <input className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="12:00 PM" />
          </div>
          <div className="flex flex-col justify-end">
            <button type="submit" disabled={saving} className="flex items-center justify-center gap-1.5 rounded-full bg-[#4B254B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60">
              {saving && <Loader2 size={12} className="animate-spin" />}
              Create slot
            </button>
          </div>
        </div>
        {message.text && (
          <div className={`mt-3 rounded-xl border px-4 py-2.5 text-xs font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}
      </form>

      <div className="space-y-5">
        <div>
          <h3 className="mb-3 font-display text-base font-semibold text-[#381E39]">Upcoming availability</h3>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming slots" hint="Create a slot above so customers can book your cooking." icon={CalendarDays} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
              <ul className="divide-y divide-[#F6E9EE]">
                {upcoming.map((slot) => (
                  <li key={slot._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-[#381E39]">
                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {SLOT_TYPE_LABEL[slot.slotType]}
                      </p>
                      <p className="text-xs text-[#76534A]">
                        {slot.startTime || 'Flexible'} – {slot.endTime || 'flexible'} • {slot.currentBookings}/{slot.maxBookings} booked
                      </p>
                    </div>
                    <StatusBadge status={slot.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-[#76534A]">Past</h3>
            <div className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
              <ul className="divide-y divide-[#F6E9EE]">
                {past.map((slot) => (
                  <li key={slot._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 opacity-70">
                    <p className="text-sm font-semibold text-[#381E39]">
                      {slot.date} • {SLOT_TYPE_LABEL[slot.slotType]}
                    </p>
                    <StatusBadge status={slot.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySection;

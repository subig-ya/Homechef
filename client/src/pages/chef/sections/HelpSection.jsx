import React, { useEffect, useState } from 'react';
import API from '../../../api/axios';
import {
  LifeBuoy,
  ShoppingBag,
  CalendarDays,
  Star,
  Settings2,
  BookOpen,
  KeyRound,
  MapPin,
  Camera,
  ExternalLink,
  MessageCircle,
  Send,
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const HOW_TOS = [
  {
    icon: KeyRound,
    title: 'How to change your password',
    steps: [
      'Open Profile Settings from the sidebar.',
      'Scroll to the "Change password" card at the bottom.',
      'Enter your current password, then your new one (8+ characters, different from the current one), and confirm it.',
      'Click "Update password". You will be logged in with the new password next time.'
    ]
  },
  {
    icon: MapPin,
    title: 'How to change your location',
    steps: [
      'Open Profile Settings from the sidebar.',
      'In the "About you" card, find "Location / area".',
      'Either type your kitchen address, or click "My location" to capture your device\u2019s GPS position.',
      'Click "Save changes" at the bottom. Your new location instantly updates your public profile and search radius.'
    ]
  },
  {
    icon: Camera,
    title: 'How to change your photos',
    steps: [
      'Open Profile Settings from the sidebar.',
      'Click "Upload photo" on the cover banner to change your cover photo.',
      'Click "Upload photo" on the avatar to change your profile photo.',
      'Both update as soon as you pick a file; click "Save changes" when you are done.'
    ]
  },
  {
    icon: ExternalLink,
    title: 'How to view your public profile',
    steps: [
      'Open Profile Settings from the sidebar.',
      'Click "View my public profile" (top right) — or in the sidebar, click "View public profile" under your mini card.',
      'You open the exact page customers see, with your photos, cuisines, specialties, location, bio, menu and reviews.'
    ]
  },
  {
    icon: ShoppingBag,
    title: 'Handling meal orders',
    steps: [
      'Open Orders from the sidebar.',
      'Accept new requests before the response window closes.',
      'Move each order through preparing → ready → completed. Customers are notified at every step.'
    ]
  },
  {
    icon: CalendarDays,
    title: 'Getting bookings',
    steps: [
      'Open Availability from the sidebar and create slots.',
      'Customers book your open slots from your public profile.',
      'Accept or decline requests in Bookings, then mark accepted bookings completed after the event.'
    ]
  },
  {
    icon: BookOpen,
    title: 'Menu & portfolio',
    steps: [
      'Add, edit and price your orderable meals under "My Meals".',
      'Keep stock levels realistic and mark items SOLD OUT when you run low.',
      'Add work samples under "My Portfolio" — customers see these on your public profile.'
    ]
  },
  {
    icon: Star,
    title: 'Improving your rating',
    steps: [
      'Your rating is a Bayesian average — a few 5-star reviews will not inflate it.',
      'Accept requests promptly and keep your response rate high.',
      'Deliver great meals on time; consistent quality is what moves your rating up.'
    ]
  }
];

const CATEGORY_LABELS = {
  ACCOUNT: 'Account & login',
  PAYMENTS: 'Payments',
  ORDERS: 'Orders',
  BOOKINGS: 'Bookings',
  TECHNICAL: 'Technical problem',
  OTHER: 'Other'
};

const TICKET_STATUS_STYLES = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-50 text-slate-500 border-slate-200'
};

const inputCls =
  'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';

const HelpSection = () => {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: 'OTHER', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTickets = async () => {
    try {
      const res = await API.get('/support/me', { headers: getToken() });
      setTickets(res.data.data || []);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await API.post('/support', form, { headers: getToken() });
      setSuccess('Your issue has been submitted. The HomeChef team will review it and update you here.');
      setForm({ category: 'OTHER', subject: '', message: '' });
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit your issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-[#EAD3DC] bg-[#FFF9F5] px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <LifeBuoy size={18} />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">Chef help centre</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">
            Step-by-step guides for the things you will need most. Have an issue? Report it below and it goes straight
            to the HomeChef admin team.
          </p>
        </div>
      </div>

      {/* How-to guides */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {HOW_TOS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDE7EF] text-[#C45B7C]">
                  <Icon size={18} />
                </span>
                <h4 className="font-display text-sm font-semibold text-[#381E39]">{item.title}</h4>
              </div>
              <ol className="mt-3 space-y-2">
                {item.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#76534A]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FCECEF] text-[10px] font-bold text-[#C45B7C]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      {/* Report an issue */}
      <div className="rounded-2xl border border-[#E25C80]/30 bg-gradient-to-br from-[#FDE7EF] to-[#FFFDFC] p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C45B7C]">
            <MessageCircle size={18} />
          </span>
          <div>
            <h4 className="font-display text-sm font-semibold text-[#381E39]">Report an issue or complain</h4>
            <p className="text-xs text-[#76534A]">
              Something broken? A payment not showing? A policy you disagree with? Tell the admin team — every report
              lands in the admin support queue.
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#76534A]">Category</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#76534A]">Subject</label>
              <input
                className={inputCls}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Short summary of the problem"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#76534A]">Describe the issue</label>
            <textarea
              className={inputCls}
              rows="3"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What happened? When? Include order or booking IDs if relevant so we can investigate faster."
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#4B254B] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {submitting ? 'Submitting…' : 'Submit to admin'}
            </button>
          </div>
        </form>
      </div>

      {/* My submitted issues */}
      <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
        <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-[#381E39]">
          <Clock size={15} className="text-[#C45B7C]" /> My submitted issues ({tickets.length})
        </h4>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-[#76534A]">You have not submitted any issues yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="rounded-xl border border-[#F3E3E8] bg-[#FFF9F5] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#76534A]">
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${TICKET_STATUS_STYLES[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-[#A98990]">
                    {new Date(ticket.createdAt).toLocaleDateString()} · {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#381E39]">{ticket.subject}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#76534A]">{ticket.message}</p>
                {ticket.adminNote && (
                  <div className="mt-2 rounded-lg border border-[#EAD3DC] bg-white px-3 py-2 text-xs text-[#76534A]">
                    <span className="font-bold text-[#C45B7C]">Admin response: </span>
                    {ticket.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSection;

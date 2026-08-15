import React, { useEffect, useState } from 'react';
import API from '../../../api/axios';
import {
  LifeBuoy,
  Search,
  CalendarDays,
  ShoppingBag,
  Heart,
  KeyRound,
  MapPin,
  Star,
  MessageCircle,
  Send,
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const HOW_TOS = [
  {
    icon: Search,
    title: 'How to find a chef',
    steps: [
      'Open the Find Chefs tab or use the search bar in the top bar.',
      'Search by chef name, cuisine, specialty, or area.',
      'Open a chef\u2019s profile to see their menu, work samples, and reviews, then tap Book.'
    ]
  },
  {
    icon: CalendarDays,
    title: 'How to book a chef',
    steps: [
      'Tap "Book" on any chef card (or from their profile).',
      'Pick an available date and time slot the chef has opened.',
      'Set your event details, booking location, and price, then send the request.',
      'The chef accepts, declines, or lets the request expire — track it all under My Bookings.'
    ]
  },
  {
    icon: ShoppingBag,
    title: 'How to order a meal',
    steps: [
      'Open Take a Bite on the dashboard, the marketplace, or your saved favorites.',
      'Tap Order on a meal, choose quantity, pickup/delivery, and an optional time.',
      'The chef responds within the response window. Track progress under My Orders.'
    ]
  },
  {
    icon: Heart,
    title: 'How to save favorites',
    steps: [
      'Tap the heart icon on any chef or meal card.',
      'Saved items appear instantly in the Favorites tab.',
      'Tap the heart again (or the trash button in Favorites) to remove them.'
    ]
  },
  {
    icon: MapPin,
    title: 'How to set your location',
    steps: [
      'Open Profile from the sidebar.',
      'Enter your city or address, or tap "My location" to capture your device\u2019s GPS.',
      'Save changes — "Chefs near you" then ranks by real distance from you.'
    ]
  },
  {
    icon: KeyRound,
    title: 'How to change your password',
    steps: [
      'Open Profile from the sidebar.',
      'Scroll to "Change password" and enter your current and new passwords.',
      'The new password applies from your next login.'
    ]
  },
  {
    icon: Star,
    title: 'How chef ratings work',
    steps: [
      'Ratings come only from real reviews left by customers.',
      'The platform uses a Bayesian average, so a couple of 5-star reviews cannot inflate a chef\u2019s ranking.',
      'Reviews appear on each chef\u2019s public profile.'
    ]
  },
  {
    icon: CalendarDays,
    title: 'Cancelling bookings & orders',
    steps: [
      'Open My Bookings or My Orders in the sidebar.',
      'Tap Cancel on any pending or accepted request.',
      'The slot or order is released, refunds follow the platform rules, and both sides are notified.'
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
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <LifeBuoy className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">Help & settings</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">
            Step-by-step guides for the things you will use most. Have an issue? Report it below and it goes straight to
            the HomeChef admin team.
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
      <div className="rounded-2xl border border-[#E25C80]/30 bg-[#FFF9F5] p-5 shadow-sm">
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
                    {new Date(ticket.createdAt).toLocaleDateString()} ·{' '}
                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

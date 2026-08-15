import React, { useState } from 'react';
import API from '../../../api/axios';
import { CalendarDays, ChefHat, Users, Wallet, XCircle, Loader2, Info } from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  ACCEPTED: 'border-sky-200 bg-sky-50 text-sky-700',
  PAYMENT_PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-500'
};

const SLOT_TYPE_LABELS = { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' };

const BookingsSection = ({ bookings, refresh }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (booking) => {
    if (!window.confirm('Cancel this booking request? The chef will be notified.')) return;
    setMessage('');
    setError('');
    setCancellingId(booking._id);
    const token = localStorage.getItem('homechef_token');
    try {
      const res = await API.put(
        `/bookings/${booking._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || 'Booking cancelled.');
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const cancellable = (status) => ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(status);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <CalendarDays className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">My chef bookings</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">
            Every request you send a chef, and how they responded to it.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
          <CalendarDays className="h-8 w-8 text-[#C45B7C]" />
          <p className="font-display text-base font-semibold text-[#381E39]">No bookings yet</p>
          <p className="max-w-sm text-sm text-[#76534A]">
            Find a chef you love and book them to cook in your kitchen — requests show up here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_STYLES[booking.status] || 'border-slate-200 bg-slate-100 text-slate-600';
            return (
              <div key={booking._id} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-bold text-[#381E39]">
                        {booking.sellerId?.name || 'Chef'}
                      </p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${status}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#76534A]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-[#C45B7C]" />
                        {booking.date} · {SLOT_TYPE_LABELS[booking.slotType] || booking.slotType}
                        {booking.time ? ` · ${booking.time}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#C45B7C]" /> {booking.numberOfGuests} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-[#C45B7C]" /> Rs. {booking.totalAmount}
                      </span>
                      {booking.calculatedDistance ? (
                        <span className="text-[11px] text-[#A98990]">~{booking.calculatedDistance} km away</span>
                      ) : null}
                    </div>
                    {booking.foodService ? (
                      <p className="mt-1.5 text-xs text-[#76534A]">Service: {booking.foodService}</p>
                    ) : null}
                    {booking.status === 'PENDING' && booking.expiresAt ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <Info className="h-3 w-3" /> Chef must respond by{' '}
                        {new Date(booking.expiresAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    ) : null}
                  </div>

                  {cancellable(booking.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking)}
                      disabled={cancellingId === booking._id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      {cancellingId === booking._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>

                {booking.bookingLocation?.address ? (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#F3E3E8] bg-[#FFF9F5] px-3 py-2 text-[11px] text-[#76534A]">
                    <ChefHat className="h-3 w-3 shrink-0 text-[#C45B7C]" />
                    Booking location: {booking.bookingLocation.address}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsSection;

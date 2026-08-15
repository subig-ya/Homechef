import React, { useState } from 'react';
import API from '../../../api/axios';
import StatusBadge from '../../../components/chef/StatusBadge';
import Modal from '../../../components/chef/Modal';
import { EmptyState, ErrorState } from '../../../components/chef/FeedbackStates';
import { CalendarDays, MapPin, Users, Utensils, MessageSquareText, Loader2, IndianRupee } from 'lucide-react';
import { formatRs, formatDistance, BOOKING_FLOW, ACTIVE_BOOKING_STATUSES, SLOT_TYPE_LABEL } from '../utils';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const BookingsSection = ({ bookings, refresh }) => {
  const [tab, setTab] = useState('active');
  const [detailId, setDetailId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const filtered = bookings.filter((b) => {
    if (tab === 'active') return ACTIVE_BOOKING_STATUSES.includes(b.status);
    if (tab === 'past') return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(b.status);
    return true;
  });

  const detail = bookings.find((b) => b._id === detailId) || null;

  const act = async (booking, action) => {
    setBusyId(`${booking._id}:${action}`);
    setError('');
    try {
      const map = {
        ACCEPTED: 'accept',
        REJECTED: 'reject',
        COMPLETED: 'complete'
      };
      await API.put(`/bookings/${booking._id}/${map[action]}`, {}, { headers: getToken() });
      setDetailId(null);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update booking.');
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: 'active', label: 'Requests & Active' },
    { id: 'past', label: 'Completed / Cancelled' },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-[#4B254B] text-white' : 'bg-white text-[#76534A] border border-[#F0DCE4] hover:bg-[#FCECEF]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#A98990]">{filtered.length} booking{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState title="No bookings here" hint="Customers book you for home cooking through your availability slots." icon={CalendarDays} />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const flow = BOOKING_FLOW[booking.status] || [];
            return (
              <div key={booking._id} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {booking.customerId?.profileImage ? (
                        <img
                          src={booking.customerId.profileImage}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE7EF] text-xs font-bold text-[#C45B7C]">
                          {booking.customerId?.name?.charAt(0) || 'C'}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#381E39]">{booking.customerId?.name || 'Customer'}</p>
                        <p className="text-xs text-[#76534A]">
                          {booking.date} • {SLOT_TYPE_LABEL[booking.slotType]} ({booking.time || 'flex'})
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#76534A]">
                      <span className="flex items-center gap-1.5"><Users size={13} className="text-[#C45B7C]" /> {booking.numberOfGuests} guests</span>
                      <span className="flex items-center gap-1.5"><Utensils size={13} className="text-[#C45B7C]" /> {booking.foodService || booking.cuisinePreference || 'Chef service'}</span>
                      {booking.distanceKm != null && (
                        <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#C45B7C]" /> {formatDistance(booking.distanceKm)} away</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
                    <span className="text-sm font-bold text-[#563124]">{formatRs(booking.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F3E3E8] pt-3">
                  <button
                    onClick={() => setDetailId(booking._id)}
                    className="text-xs font-semibold text-[#C45B7C] hover:underline"
                  >
                    View details
                  </button>
                  {flow.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {flow.map((action) => (
                        <button
                          key={action.to}
                          disabled={busyId === `${booking._id}:${action.to}`}
                          onClick={() => act(booking, action.to)}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                            action.secondary
                              ? 'border border-[#E5D1D6] bg-white text-[#76534A] hover:bg-red-50 hover:text-red-600'
                              : 'bg-[#4B254B] text-white hover:bg-[#391B39]'
                          }`}
                        >
                          {busyId === `${booking._id}:${action.to}` && <Loader2 size={12} className="animate-spin" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Booking details">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
                <CalendarDays size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-[#381E39]">{detail.customerId?.name}</p>
                <p className="text-xs text-[#76534A]">{detail.date} • {SLOT_TYPE_LABEL[detail.slotType]} • {detail.time || 'flexible'}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={detail.status} paymentStatus={detail.paymentStatus} /></div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#FFF7F9] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A98990]"><Users size={12} /> Guests</p>
                <p className="mt-1 text-sm font-semibold text-[#381E39]">{detail.numberOfGuests}</p>
              </div>
              <div className="rounded-xl bg-[#FFF7F9] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A98990]"><Utensils size={12} /> Service</p>
                <p className="mt-1 text-sm font-semibold text-[#381E39]">{detail.foodService || detail.cuisinePreference || 'Chef service'}</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFF7F9] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A98990]"><MapPin size={12} /> Location</p>
              <p className="mt-1 text-sm font-semibold text-[#381E39]">
                {detail.bookingLocation?.address || detail.customerId?.location?.address || 'Address not shared'}
              </p>
              {detail.distanceKm != null && (
                <p className="mt-0.5 text-xs text-[#76534A]">{formatDistance(detail.distanceKm)} from your location</p>
              )}
            </div>

            {detail.specialRequirements && (
              <div className="rounded-xl bg-[#FFF7F9] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A98990]"><MessageSquareText size={12} /> Special requirements</p>
                <p className="mt-1 text-sm text-[#381E39]">{detail.specialRequirements}</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-[#FDE7EF] p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#381E39]"><IndianRupee size={15} /> Total</p>
              <p className="font-display text-lg font-bold text-[#381E39]">{formatRs(detail.totalAmount)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsSection;

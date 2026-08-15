import React from 'react';
import {
  IndianRupee,
  ShoppingBag,
  CalendarDays,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../../../components/chef/StatusBadge';
import { formatRs, formatDateTime, formatDistance, SLOT_TYPE_LABEL } from '../utils';

const StatCard = ({ icon: Icon, label, value, sub, tone = 'text-[#C54567] bg-[#FDE7EF]' }) => (
  <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-4 shadow-sm">
    <div className="flex items-center gap-2">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </span>
      <p className="text-xs font-semibold text-[#76534A]">{label}</p>
    </div>
    <p className="mt-3 font-display text-2xl font-bold text-[#381E39]">{value}</p>
    {sub && <p className="mt-0.5 text-[11px] text-[#A98990]">{sub}</p>}
  </div>
);

const OverviewSection = ({ user, orders, bookings, dishes, slots, reviews, onNavigate }) => {
  const earnedOrders = orders
    .filter((o) => o.paymentStatus === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const earnedBookings = bookings
    .filter((b) => b.paymentStatus === 'PAID' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const pendingOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING', 'PAYMENT_PENDING'].includes(o.status)).length;
  const activeBookings = bookings.filter((b) => ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(b.status)).length;

  const today = new Date().toISOString().slice(0, 10);
  const todaysSlots = slots.filter((s) => s.date === today);
  const rating = reviews?.averageRating || 0;
  const breakdown = reviews?.ratingBreakdown || {};

  const recentOrders = orders.slice(0, 4);
  const recentBookings = bookings.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F0DCE4] bg-gradient-to-r from-[#FFF7F9] via-[#FFFDFC] to-[#FDE7EF] px-5 py-5 shadow-sm">
        <div>
          <h2 className="font-display text-xl font-bold text-[#381E39]">
            {user?.name?.split(' ')[0]}, welcome to your kitchen
          </h2>
          <p className="mt-1 text-sm text-[#76534A]">
            {user?.tagline || 'A quiet overview of your orders, bookings, and ratings.'}
          </p>
        </div>
        {user?.location?.address && (
          <span className="flex items-center gap-1.5 rounded-full border border-[#F0DCE4] bg-white px-3 py-1.5 text-xs font-medium text-[#76534A]">
            <MapPin size={13} className="text-[#C45B7C]" />
            {user.location.address}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Earned"
          value={formatRs(earnedOrders + earnedBookings)}
          sub={`${dishes.length} meals on your menu`}
          tone="text-emerald-700 bg-emerald-50"
        />
        <StatCard
          icon={ShoppingBag}
          label="Pending orders"
          value={pendingOrders}
          sub={`${orders.length} total orders`}
          tone="text-amber-700 bg-amber-50"
        />
        <StatCard
          icon={CalendarDays}
          label="Active bookings"
          value={activeBookings}
          sub={`${bookings.length} total bookings`}
          tone="text-violet-700 bg-violet-50"
        />
        <StatCard
          icon={Star}
          label="Average rating"
          value={rating ? rating.toFixed(1) : '—'}
          sub={`${reviews?.reviewCount || 0} review${reviews?.reviewCount === 1 ? '' : 's'}`}
          tone="text-[#C54567] bg-[#FDE7EF]"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#F3E3E8] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#381E39]">Recent orders</h3>
            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center gap-1 text-xs font-semibold text-[#C45B7C] hover:underline"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#76534A]">No orders yet — they will appear here.</p>
          ) : (
            <ul className="divide-y divide-[#F6E9EE]">
              {recentOrders.map((order) => (
                <li key={order._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#381E39]">
                      {order.items?.[0]?.name}
                      {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
                    </p>
                    <p className="text-xs text-[#76534A]">
                      {order.customerId?.name} • {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-[#563124]">{formatRs(order.totalAmount)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column: today's schedule + rating */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F3E3E8] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-[#381E39]">Today's availability</h3>
              <button
                onClick={() => onNavigate('availability')}
                className="text-xs font-semibold text-[#C45B7C] hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="p-4">
              {todaysSlots.length === 0 ? (
                <p className="flex items-center gap-2 px-1 py-4 text-sm text-[#76534A]">
                  <Clock size={15} className="text-[#C45B7C]" /> No slots set for today.
                </p>
              ) : (
                <ul className="space-y-2">
                  {todaysSlots.map((slot) => (
                    <li key={slot._id} className="flex items-center justify-between rounded-xl bg-[#FFF7F9] px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#381E39]">{SLOT_TYPE_LABEL[slot.slotType]}</p>
                        <p className="text-[11px] text-[#76534A]">
                          {slot.startTime}–{slot.endTime || 'flex'} • {slot.currentBookings}/{slot.maxBookings} booked
                        </p>
                      </div>
                      <StatusBadge status={slot.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F3E3E8] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-[#381E39]">Customer love</h3>
              <button
                onClick={() => onNavigate('reviews')}
                className="flex items-center gap-1 text-xs font-semibold text-[#C45B7C] hover:underline"
              >
                Reviews <ChevronRight size={13} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-[#381E39]">
                  {rating ? rating.toFixed(1) : '—'}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[#EAD3DC]'}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] || 0;
                  const pct = reviews?.reviewCount ? Math.round((count / reviews.reviewCount) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-[11px] text-[#76534A]">
                      <span className="w-6 font-semibold">{star}★</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F6E9EE]">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings strip */}
      {recentBookings.length > 0 && (
        <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F3E3E8] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-[#381E39]">Latest bookings</h3>
            <button
              onClick={() => onNavigate('bookings')}
              className="flex items-center gap-1 text-xs font-semibold text-[#C45B7C] hover:underline"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="rounded-xl border border-[#F3E3E8] bg-[#FFF7F9] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#381E39]">{booking.customerId?.name}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-1 text-xs text-[#76534A]">
                  {booking.foodService || booking.cuisinePreference || 'Chef service'}
                </p>
                <p className="mt-2 text-[11px] font-medium text-[#A98990]">
                  {booking.date} • {SLOT_TYPE_LABEL[booking.slotType]} • {booking.numberOfGuests} guests
                  {booking.distanceKm != null ? ` • ${formatDistance(booking.distanceKm)} away` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;

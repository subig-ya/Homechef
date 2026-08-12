import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { CalendarDays, ChefHat, Clock, CreditCard, Users, UtensilsCrossed, Wallet } from 'lucide-react';

const BookingsPage = () => {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [form, setForm] = useState({
    chefId: searchParams.get('chef') || '',
    slotId: searchParams.get('slot') || '',
    date: '',
    slotType: 'MORNING',
    numberOfGuests: '2',
    cuisinePreference: '',
    specialRequirements: '',
    basePrice: '1500',
    additionalCharges: '0'
  });

  const fetchBookings = async () => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const bookingsResponse = await API.get('/bookings/my', { headers: { Authorization: `Bearer ${token}` } });
      setBookings(bookingsResponse.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load bookings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [chefsRes, slotsRes] = await Promise.all([
          API.get('/chefs'),
          API.get('/slots')
        ]);
        const chefList = chefsRes.data.data || [];
        setChefs(chefList);
        const allSlots = slotsRes.data.data || [];
        setSlots(allSlots);
        setForm((prev) => {
          const chefId = prev.chefId || searchParams.get('chef') || (chefList.length > 0 ? chefList[0]._id : '');
          const chefSlots = allSlots.filter((slot) => slot.sellerId?._id === chefId);
          let next = { ...prev, chefId };
          if (chefSlots.length > 0) {
            const slotId = prev.slotId || searchParams.get('slot') || chefSlots[0]._id;
            const selected = chefSlots.find((s) => s._id === slotId) || chefSlots[0];
            next = { ...next, slotId: selected._id, date: selected.date, slotType: selected.slotType };
          } else {
            next = { ...next, slotId: '', date: '', slotType: 'MORNING' };
          }
          return next;
        });
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load chef availability');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchBookings();
  }, []);

  const handleChefChange = (chefId) => {
    const chefSlots = slots.filter((slot) => slot.sellerId?._id === chefId);
    let next = { ...form, chefId, slotId: '', date: '', slotType: 'MORNING' };
    if (chefSlots.length > 0) {
      next = { ...next, slotId: chefSlots[0]._id, date: chefSlots[0].date, slotType: chefSlots[0].slotType };
    }
    setForm(next);
  };

  const handleSlotChange = (slotId) => {
    const slot = slots.find((s) => s._id === slotId);
    if (!slot) {
      setForm({ ...form, slotId: '', date: '', slotType: 'MORNING' });
      return;
    }
    setForm({ ...form, slotId, date: slot.date, slotType: slot.slotType });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const token = localStorage.getItem('homechef_token');
    try {
      const response = await API.post('/bookings', {
        sellerId: form.chefId,
        slotId: form.slotId,
        date: form.date,
        slotType: form.slotType,
        numberOfGuests: Number(form.numberOfGuests),
        cuisinePreference: form.cuisinePreference,
        specialRequirements: form.specialRequirements,
        basePrice: Number(form.basePrice),
        additionalCharges: Number(form.additionalCharges)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message || 'Booking created successfully');
      setMessageType('success');
      setForm({ chefId: form.chefId, slotId: '', date: '', slotType: 'MORNING', numberOfGuests: '2', cuisinePreference: '', specialRequirements: '', basePrice: '1500', additionalCharges: '0' });
      await fetchBookings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create booking');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (bookingId, amount) => {
    const token = localStorage.getItem('homechef_token');
    setPayingId(bookingId);
    setMessage('');

    try {
      const initiated = await API.post('/payments/khalti/initiate', { bookingId, amount }, { headers: { Authorization: `Bearer ${token}` } });
      const verified = await API.post('/payments/khalti/verify', { paymentId: initiated.data.data._id }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(verified.data.message || 'Payment confirmed');
      setMessageType('success');
      await fetchBookings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to process payment');
      setMessageType('error');
    } finally {
      setPayingId(null);
    }
  };

  const selectedChef = chefs.find((chef) => chef._id === form.chefId);
  const chefSlots = slots.filter((slot) => slot.sellerId?._id === form.chefId);

  const statusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACCEPTED': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'CONFIRMED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const messageStyles =
    messageType === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : messageType === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#FAF4F7] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-[#381E39]">Bookings</h2>
        <p className="mt-1 text-sm text-[#6E5A6E]">Choose a chef, pick an available slot, and request your private dinner.</p>

        {message && <div className={`mt-4 rounded-xl border p-3 text-sm ${messageStyles}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#4B254B]" />
              <h3 className="text-sm font-bold text-[#381E39]">1. Choose your chef</h3>
            </div>
            <select
              value={form.chefId}
              onChange={(e) => handleChefChange(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:ring-2 focus:ring-[#4B254B]"
              required
            >
              {chefs.map((chef) => (
                <option key={chef._id} value={chef._id}>
                  {chef.name}
                  {chef.tagline ? ` — ${chef.tagline}` : ''}
                </option>
              ))}
            </select>

            {selectedChef && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FAF4F7] p-4">
                <img
                  src={selectedChef.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100'}
                  alt={selectedChef.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-[#381E39]">
                    {selectedChef.name}
                    {selectedChef.averageRating ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#4B254B] border border-slate-200">
                        ★ {Number(selectedChef.averageRating).toFixed(1)}
                      </span>
                    ) : null}
                  </p>
                  {Array.isArray(selectedChef.specialties) && selectedChef.specialties.length > 0 && (
                    <p className="mt-1 text-xs text-[#6E5A6E]">{selectedChef.specialties.join(' · ')}</p>
                  )}
                  {selectedChef.yearsOfExperience ? (
                    <p className="mt-0.5 text-xs text-[#6E5A6E]">{selectedChef.yearsOfExperience} years of experience</p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#4B254B]" />
              <h3 className="text-sm font-bold text-[#381E39]">2. Pick an available slot</h3>
            </div>
            <select
              value={form.slotId}
              onChange={(e) => handleSlotChange(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:ring-2 focus:ring-[#4B254B]"
              required
              disabled={chefSlots.length === 0}
            >
              {chefSlots.length === 0 ? (
                <option value="">No available slots for this chef</option>
              ) : (
                chefSlots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.date} · {slot.slotType.toLowerCase()}
                    {slot.startTime ? ` · ${slot.startTime}` : ''}
                  </option>
                ))
              )}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Slot type</label>
                <select value={form.slotType} onChange={(e) => setForm({ ...form, slotType: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]">
                  <option value="MORNING">MORNING</option>
                  <option value="AFTERNOON">AFTERNOON</option>
                  <option value="EVENING">EVENING</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#4B254B]" />
              <h3 className="text-sm font-bold text-[#381E39]">3. Your event details</h3>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Users className="inline w-3.5 h-3.5 mr-1 text-[#4B254B]" /> Guests
              </label>
              <input type="number" min="1" value={form.numberOfGuests} onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" required />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Cuisine preference</label>
              <input type="text" value={form.cuisinePreference} onChange={(e) => setForm({ ...form, cuisinePreference: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" placeholder="e.g. Italian, Nepali, fusion" />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Special requirements</label>
              <textarea rows="2" value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" placeholder="Allergies, dietary needs, occasion..." />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Wallet className="inline w-3.5 h-3.5 mr-1 text-[#4B254B]" /> Base price (Rs.)
                </label>
                <input type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Additional (Rs.)</label>
                <input type="number" min="0" value={form.additionalCharges} onChange={(e) => setForm({ ...form, additionalCharges: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="mt-5 w-full rounded-xl bg-[#4B254B] px-4 py-3 text-sm font-bold text-white hover:bg-[#391B39] transition-colors disabled:opacity-60">
              {submitting ? 'Creating...' : 'Request booking'}
            </button>
            <p className="mt-2 text-center text-xs text-[#6E5A6E]">The chef reviews your request before it is confirmed.</p>
          </div>
        </form>

        <div className="mt-10">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#381E39]">
            <CalendarDays className="w-5 h-5 text-[#4B254B]" /> My bookings
          </h3>

          {loading ? (
            <p className="mt-4 text-sm text-[#6E5A6E]">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="mt-4 text-sm text-[#6E5A6E]">No bookings yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {bookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF4F7]">
                        <ChefHat className="w-5 h-5 text-[#4B254B]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#381E39]">
                          {booking.sellerId?.name || 'Chef'}
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#6E5A6E]">
                            <Clock className="w-3 h-3" /> {booking.date} · {booking.slotType.toLowerCase()}
                          </span>
                        </p>
                        <p className="text-sm text-[#6E5A6E]">
                          Guests: {booking.numberOfGuests} · Total: Rs. {booking.totalAmount} · Payment: {booking.paymentStatus.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(booking.status)}`}>
                        {booking.status.toLowerCase()}
                      </span>
                      {booking.paymentStatus !== 'PAID' && (
                        <button onClick={() => handlePay(booking._id, booking.totalAmount)} disabled={payingId === booking._id} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60">
                          <CreditCard className="w-3.5 h-3.5" />
                          {payingId === booking._id ? 'Processing...' : 'Pay now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;

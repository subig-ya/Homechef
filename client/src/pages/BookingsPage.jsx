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
    time: '',
    slotType: 'MORNING',
    numberOfGuests: '2',
    cuisinePreference: '',
    specialRequirements: '',
    basePrice: '1500',
    additionalCharges: '0',
    bookingLocationAddress: '',
    bookingLocationLatitude: '',
    bookingLocationLongitude: '',
    bookingLocationMode: 'manual'
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

  const reverseGeocodeLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      return data?.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } catch (error) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported in this browser. Please enter your booking location manually.');
      setMessageType('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const placeName = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
        setForm((prev) => ({
          ...prev,
          bookingLocationMode: 'current',
          bookingLocationLatitude: position.coords.latitude,
          bookingLocationLongitude: position.coords.longitude,
          bookingLocationAddress: placeName
        }));
        setMessage('Your current location has been captured for this booking.');
        setMessageType('success');
      },
      () => {
        setMessage('Location permission was denied. You can still enter the booking location manually.');
        setMessageType('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (!form.bookingLocationAddress && (!form.bookingLocationLatitude || !form.bookingLocationLongitude)) {
      setMessage('Please provide a booking location before confirming.');
      setMessageType('error');
      setSubmitting(false);
      return;
    }

    const token = localStorage.getItem('homechef_token');
    try {
      const response = await API.post('/bookings', {
        sellerId: form.chefId,
        slotId: form.slotId,
        foodService: form.cuisinePreference || 'Chef service',
        date: form.date,
        time: form.time,
        slotType: form.slotType,
        numberOfGuests: Number(form.numberOfGuests),
        cuisinePreference: form.cuisinePreference,
        specialRequirements: form.specialRequirements,
        bookingLocation: {
          address: form.bookingLocationAddress || 'Current location',
          latitude: Number(form.bookingLocationLatitude || 0),
          longitude: Number(form.bookingLocationLongitude || 0)
        },
        basePrice: Number(form.basePrice),
        additionalCharges: Number(form.additionalCharges)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message || 'Booking created successfully');
      setMessageType('success');
      setForm({ chefId: form.chefId, slotId: '', date: '', time: '', slotType: 'MORNING', numberOfGuests: '2', cuisinePreference: '', specialRequirements: '', basePrice: '1500', additionalCharges: '0', bookingLocationAddress: '', bookingLocationLatitude: '', bookingLocationLongitude: '', bookingLocationMode: 'manual' });
      await fetchBookings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create booking');
      setMessageType('error');
    } finally {
      setSubmitting(false);
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

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#381E39]">3. Booking location</h3>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="rounded-xl border border-[#4B254B] bg-white px-3 py-1.5 text-[11px] font-bold text-[#4B254B] hover:bg-[#F6EEF4]"
                >
                  Use My Current Location
                </button>
              </div>

              <input
                type="text"
                value={form.bookingLocationAddress}
                onChange={(e) => setForm({ ...form, bookingLocationAddress: e.target.value, bookingLocationMode: 'manual' })}
                placeholder="Enter or search booking address"
                className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  value={form.bookingLocationLatitude}
                  onChange={(e) => setForm({ ...form, bookingLocationLatitude: e.target.value, bookingLocationMode: 'manual' })}
                  placeholder="Latitude"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                />
                <input
                  type="number"
                  step="any"
                  value={form.bookingLocationLongitude}
                  onChange={(e) => setForm({ ...form, bookingLocationLongitude: e.target.value, bookingLocationMode: 'manual' })}
                  placeholder="Longitude"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                />
              </div>

              {form.bookingLocationLatitude && form.bookingLocationLongitude && selectedChef && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  Approx. distance: {(() => {
                    const chefLat = Number(selectedChef.location?.latitude ?? selectedChef.latitude ?? 0);
                    const chefLon = Number(selectedChef.location?.longitude ?? selectedChef.longitude ?? 0);
                    const lat1 = Number(form.bookingLocationLatitude);
                    const lon1 = Number(form.bookingLocationLongitude);
                    const dLat = (lat1 - chefLat) * (Math.PI / 180);
                    const dLon = (lon1 - chefLon) * (Math.PI / 180);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(chefLat * (Math.PI / 180)) * Math.cos(lat1 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const distance = 2 * 6371 * Math.asin(Math.sqrt(a));
                    return `${Number(distance).toFixed(1)} km away`;
                  })()}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]" required />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Slot type</label>
              <select value={form.slotType} onChange={(e) => setForm({ ...form, slotType: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]">
                <option value="MORNING">MORNING</option>
                <option value="AFTERNOON">AFTERNOON</option>
                <option value="EVENING">EVENING</option>
              </select>
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
                          Guests: {booking.numberOfGuests} · Total: Rs. {booking.totalAmount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(booking.status)}`}>
                        {booking.status.toLowerCase()}
                      </span>
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

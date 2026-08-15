import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  X,
  ChefHat,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';

const SLOT_TYPE_LABELS = { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' };

const inputCls =
  'w-full rounded-xl border border-[#EAD3DC] bg-white px-3 py-2 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';
const labelCls = 'mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#76534A]';

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    return data?.display_name || `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
  } catch {
    return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
  }
};

const BookingModal = ({ chef, onClose, onBooked }) => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState('');

  const [slotId, setSlotId] = useState('');
  const [date, setDate] = useState('');
  const [slotType, setSlotType] = useState('MORNING');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [cuisinePreference, setCuisinePreference] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [basePrice, setBasePrice] = useState('1500');
  const [additionalCharges, setAdditionalCharges] = useState('0');

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdDistance, setCreatedDistance] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingSlots(true);
      setSlotError('');
      try {
        const res = await API.get(`/slots?sellerId=${chef._id}`);
        const list = res.data.data || [];
        setSlots(list);
        if (list.length > 0) {
          setSlotId(list[0]._id);
          setDate(list[0].date);
          setSlotType(list[0].slotType);
        }
      } catch (err) {
        setSlotError(err.response?.data?.message || 'Unable to load this chef\'s availability.');
      } finally {
        setLoadingSlots(false);
      }
    };
    load();
  }, [chef._id]);

  const handleSlotChange = (id) => {
    const slot = slots.find((s) => s._id === id);
    setSlotId(id);
    if (slot) {
      setDate(slot.date);
      setSlotType(slot.slotType);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser. Enter your booking location manually.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const placeName = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setAddress(placeName);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Location permission was denied. You can still enter the booking location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!slotId) {
      setError('This chef has no available slots right now. Try another date later.');
      return;
    }
    if (!address && (!latitude || !longitude)) {
      setError('Please provide a booking location before confirming.');
      return;
    }

    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.post(
        '/bookings',
        {
          sellerId: chef._id,
          slotId,
          foodService: cuisinePreference || 'Chef service',
          date,
          time,
          slotType,
          numberOfGuests: Math.max(1, Number(guests) || 1),
          cuisinePreference,
          specialRequirements,
          bookingLocation: {
            address: address || 'Current location',
            latitude: Number(latitude || 0),
            longitude: Number(longitude || 0)
          },
          basePrice: Number(basePrice) || 0,
          additionalCharges: Number(additionalCharges) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = response.data.data;
      setCreatedDistance(created?.calculatedDistance ?? null);
      setSuccess('Booking request sent! The chef will review it before confirming.');
      if (onBooked) onBooked('Booking request sent to the chef!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create the booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#381E39]/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#FFFDFC] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F0DCE4] bg-[#FFF9F5] px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src={chef.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100'}
              alt={chef.name}
              className="h-12 w-12 rounded-2xl border border-[#F0DCE4] object-cover"
            />
            <div>
              <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-[#381E39]">
                <ChefHat className="h-4 w-4 text-[#C45B7C]" /> Book {chef.name}
              </h3>
              <p className="text-xs text-[#76534A]">
                {chef.location || 'Home kitchen'}
                {chef.distance !== null && chef.distance !== undefined
                  ? ` · ${Number(chef.distance).toFixed(1)} km away`
                  : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#76534A] shadow-sm transition-colors hover:text-[#C45B7C]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="space-y-3 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="text-sm font-bold text-emerald-700">{success}</p>
            {createdDistance !== null && (
              <p className="text-xs text-[#76534A]">Approx. chef travel distance: {createdDistance} km</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-[#4B254B] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#391B39]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Slot picker */}
            <div>
              <label className={labelCls}>1 · Pick an available slot</label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-xs text-[#76534A]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E25C80]" /> Loading availability…
                </div>
              ) : slotError ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {slotError}
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-3 py-2 text-xs text-[#76534A]">
                  No available slots for this chef right now. Check back later.
                </p>
              ) : (
                <>
                  <select
                    value={slotId}
                    onChange={(e) => handleSlotChange(e.target.value)}
                    className={inputCls}
                    required
                  >
                    {slots.map((slot) => (
                      <option key={slot._id} value={slot._id}>
                        {slot.date} · {SLOT_TYPE_LABELS[slot.slotType] || slot.slotType}
                        {slot.startTime ? ` · ${slot.startTime}${slot.endTime ? `–${slot.endTime}` : ''}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[#76534A]">
                    <CalendarDays className="h-3 w-3 text-[#C45B7C]" /> {date} ·{' '}
                    {SLOT_TYPE_LABELS[slotType] || slotType}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>
                  <Clock className="mr-1 inline h-3 w-3 text-[#C45B7C]" /> Time
                </label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  <Users className="mr-1 inline h-3 w-3 text-[#C45B7C]" /> Guests
                </label>
                <input
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Cuisine preference</label>
                <input
                  type="text"
                  value={cuisinePreference}
                  onChange={(e) => setCuisinePreference(e.target.value)}
                  placeholder="e.g. Italian, Nepali, fusion"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Special requirements</label>
              <textarea
                rows="2"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Allergies, dietary needs, occasion…"
                className={inputCls}
              />
            </div>

            {/* Booking location */}
            <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFF9F5] p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76534A]">
                  <MapPin className="mr-1 inline h-3 w-3 text-[#C45B7C]" /> Booking location
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1 rounded-full border border-[#4B254B] bg-white px-3 py-1.5 text-[10px] font-bold text-[#4B254B] transition-colors hover:bg-[#FCECEF] disabled:opacity-60"
                >
                  {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                  {locating ? 'Locating…' : 'Use my location'}
                </button>
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter or search booking address"
                className={`${inputCls} mt-2`}
              />
              <div className="mt-2 grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  className={inputCls}
                />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Base price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Additional charges (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition-colors hover:bg-[#391B39] disabled:opacity-60"
            >
              {submitting ? 'Requesting…' : `Request booking · Rs. ${(Number(basePrice) + Number(additionalCharges) || 0).toLocaleString()}`}
            </button>
            <p className="text-center text-[10px] text-[#A98990]">
              The chef reviews your request before it is confirmed. You can cancel anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;

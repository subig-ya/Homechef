import React, { useEffect, useState } from 'react';
import API from '../../../api/axios';
import useImageUpload from '../useImageUpload';
import { Loader2, UploadCloud, CheckCircle2, Star, MapPin, Clock, LocateFixed } from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200';

const SettingsSection = ({ user, refresh }) => {
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    bio: '',
    specialties: '',
    yearsOfExperience: '',
    location: '',
    profileImage: '',
    coverImage: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState({ latitude: null, longitude: null });
  const [locationMsg, setLocationMsg] = useState('');
  const { upload, uploading } = useImageUpload();

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      tagline: user.tagline || '',
      bio: user.bio || '',
      specialties: Array.isArray(user.specialties) ? user.specialties.join(', ') : '',
      yearsOfExperience: user.yearsOfExperience ?? '',
      location: user.location?.address || user.location || '',
      profileImage: user.profileImage || '',
      coverImage: user.coverImage || ''
    });
    setLocationCoords({
      latitude: user.location?.latitude ?? user.latitude ?? null,
      longitude: user.location?.longitude ?? user.longitude ?? null
    });
  }, [user]);

  const reverseGeocodeLocation = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMsg('Geolocation is not supported in this browser. Please enter your location manually.');
      return;
    }
    setLocating(true);
    setLocationMsg('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const placeName = await reverseGeocodeLocation(latitude, longitude);
        setForm((prev) => ({ ...prev, location: placeName }));
        setLocationCoords({ latitude, longitude });
        setLocationMsg(`Location captured from your device (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) — save to apply.`);
        setLocating(false);
      },
      () => {
        setLocationMsg('Location permission was denied. You can still enter your location manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleImageFile = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setForm((prev) => ({ ...prev, [field]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    const payload = {
      name: form.name,
      tagline: form.tagline,
      bio: form.bio,
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      location:
        locationCoords.latitude != null && locationCoords.longitude != null
          ? {
              address: form.location,
              latitude: Number(locationCoords.latitude),
              longitude: Number(locationCoords.longitude)
            }
          : form.location,
      profileImage: form.profileImage,
      coverImage: form.coverImage
    };
    try {
      await API.put('/chefs/me/profile', payload, { headers: getToken() });
      setSaved(true);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';

  const uploadLabel = (field, busy) => (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#F0DCE4] bg-white px-4 py-2 text-xs font-semibold text-[#76534A] shadow-sm transition-colors hover:border-[#D8B5C0] hover:text-[#C45B7C]">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
      {busy ? 'Uploading…' : 'Upload photo'}
      <input type="file" accept="image/*" className="hidden" onChange={handleImageFile(field)} disabled={busy} />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-xs text-[#76534A]">
        Everything you fill in here shows up on your public profile — the page customers see in the chef directory. Nothing is fake or pre-filled: this is your real profile.
      </p>

      {/* Cover photo */}
      <div className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
        <div className="relative h-40 sm:h-52">
          <img
            src={form.coverImage || FALLBACK_COVER}
            alt="Cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            {uploadLabel('coverImage', uploading)}
          </div>
          <div className="absolute right-4 top-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/90">Cover photo</label>
          </div>
        </div>
        <div className="border-t border-[#F3E3E8] px-5 py-3">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#A98990]">Or paste a cover image URL</label>
          <input className={inputCls} value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Identity card */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
            <h3 className="font-display text-base font-semibold text-[#381E39]">Identity</h3>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={form.profileImage || FALLBACK_AVATAR}
                  alt="Profile"
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                />
                <div className="absolute -bottom-2 -right-2">{uploadLabel('profileImage', uploading)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Full name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Maria Rossi" required />
                <label className="mb-1 mt-3 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Tagline</label>
                <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Five-star Italian cooking for your table" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#A98990]">Or paste a profile photo URL</label>
              <input className={inputCls} value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })} placeholder="https://…" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
            <h3 className="font-display text-base font-semibold text-[#381E39]">About you</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Location / area</label>
                <div className="flex gap-2">
                  <input className={inputCls} value={form.location} onChange={(e) => { setForm({ ...form, location: e.target.value }); setLocationCoords({ latitude: null, longitude: null }); }} placeholder="Kathmandu, Nepal" />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E25C80]/40 bg-[#FFF0F5] px-3 py-2.5 text-xs font-semibold text-[#C45B7C] transition hover:bg-[#FCE3EC] disabled:opacity-60"
                    title="Use your device's current location"
                  >
                    {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                    {locating ? 'Locating…' : 'My location'}
                  </button>
                </div>
                {locationMsg && <p className="mt-1.5 text-[11px] text-[#A75D7A]">{locationMsg}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Years of experience</label>
                <input type="number" min="0" className={inputCls} value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} placeholder="8" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Specialties (comma separated)</label>
              <input className={inputCls} value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Biryani, Desserts, Vegan" />
              {form.specialties.split(',').map((s) => s.trim()).filter(Boolean).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.specialties.split(',').map((s) => s.trim()).filter(Boolean).map((spec) => (
                    <span key={spec} className="rounded-lg border border-pink-100 bg-white px-3 py-1 text-xs font-semibold text-[#4B254B]">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Bio</label>
              <textarea className={inputCls} rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell customers who you are, what you cook, and what they can expect…" />
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> Profile saved — your public profile now shows the latest info.
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving || uploading} className="flex items-center gap-1.5 rounded-full bg-[#4B254B] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60">
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </div>

        {/* Live preview — mirrors the customer-facing profile */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A98990]">Customer preview</p>
            <div className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
              <div className="relative h-24 overflow-hidden">
                <img src={form.coverImage || FALLBACK_COVER} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/80 via-[#381E39]/20 to-transparent" />
              </div>
              <div className="relative px-4 pb-4">
                <div className="-mt-9 flex items-end gap-3">
                  <img src={form.profileImage || FALLBACK_AVATAR} alt="" className="h-16 w-16 rounded-xl border-2 border-white object-cover shadow-md" />
                  <div className="min-w-0 pb-0.5">
                    <p className="truncate font-display text-sm font-bold text-[#381E39]">{form.name || 'Chef name'}</p>
                    <p className="truncate text-[11px] text-[#76534A]">{form.tagline || 'Your tagline will appear here'}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] text-[#76534A]">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#C45B7C]" /> {form.location || 'Your location'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#C45B7C]" /> {Number(form.yearsOfExperience) > 0 ? `${form.yearsOfExperience} yr${Number(form.yearsOfExperience) !== 1 ? 's' : ''} experience` : 'Your experience'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> Rating from real customer reviews
                  </p>
                </div>
                {form.bio && <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-[#76534A]">{form.bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SettingsSection;

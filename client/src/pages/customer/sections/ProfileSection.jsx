import React, { useState } from 'react';
import API from '../../../api/axios';
import { User, MapPin, Navigation, KeyRound, Loader2, CheckCircle, Camera, Smartphone } from 'lucide-react';

const inputCls =
  'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';
const labelCls = 'mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#76534A]';

const ProfileSection = ({ user, onUserUpdated }) => {
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || '',
    location: user?.location?.address || '',
    latitude: String(user?.location?.latitude ?? user?.latitude ?? ''),
    longitude: String(user?.location?.longitude ?? user?.longitude ?? '')
  }));

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password card state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser. Enter your location manually.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.display_name) address = data.display_name;
        } catch {
          // fall back to coordinates
        }
        setForm((prev) => ({ ...prev, latitude: String(latitude), longitude: String(longitude), location: address }));
        setMessage('Location captured from your device. Press Save changes to confirm.');
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Location permission was denied. You can still enter your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    try {
      await API.put(
        '/auth/profile',
        {
          name: form.name,
          phone: form.phone,
          profileImage: form.profileImage,
          location: {
            address: form.location || '',
            latitude: Number(form.latitude) || 0,
            longitude: Number(form.longitude) || 0
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Profile updated successfully.');
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    setPwMessage('');
    setPwError('');
    const token = localStorage.getItem('homechef_token');
    try {
      await API.put(
        '/auth/password',
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwMessage('Password updated. It will take effect from your next login.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Unable to change the password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <User className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">My profile</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">
            Your details and home location — used to find the chefs nearest to you.
          </p>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle className="h-4 w-4" /> {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
        <h4 className="font-display text-sm font-bold text-[#381E39]">About you</h4>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>
              <Camera className="mr-1 inline h-3 w-3 text-[#C45B7C]" /> Profile photo URL
            </label>
            <input
              className={inputCls}
              value={form.profileImage}
              onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
              placeholder="https://… (optional)"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#F3E3E8] bg-[#FFF9F5] p-4">
          <div className="flex items-center justify-between gap-3">
            <label className={labelCls}>
              <MapPin className="mr-1 inline h-3 w-3 text-[#C45B7C]" /> Location / area
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-1 rounded-full border border-[#4B254B] bg-white px-3 py-1.5 text-[10px] font-bold text-[#4B254B] transition-colors hover:bg-[#FCECEF] disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              {locating ? 'Locating…' : 'My location'}
            </button>
          </div>
          <input
            className={`${inputCls} mt-2`}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="City or address you want chefs to search around"
          />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Latitude</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[#A98990]">
            Save a location and "Chefs near you" on the dashboard will rank by real distance.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#4B254B] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#391B39] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
        <h4 className="flex items-center gap-2 font-display text-sm font-bold text-[#381E39]">
          <KeyRound className="h-4 w-4 text-[#C45B7C]" /> Change password
        </h4>
        {pwMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle className="h-4 w-4" /> {pwMessage}
          </div>
        )}
        {pwError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {pwError}
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Current password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="8+ characters"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={pwSaving}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#4B254B] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#391B39] disabled:opacity-60"
          >
            {pwSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            Update password
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-[#A98990]">
          <Smartphone className="h-3 w-3" /> You stay logged in; the new password applies from your next login.
        </p>
      </form>
    </div>
  );
};

export default ProfileSection;

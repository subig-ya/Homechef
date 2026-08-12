import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ChefHat, Plus, Trash2, CalendarDays, Pencil, Upload, Camera, ExternalLink, ImagePlus } from 'lucide-react';

const HomeChefDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [myDishes, setMyDishes] = useState([]);
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    cuisine: '',
    price: '',
    description: '',
    availableQuantity: '10'
  });
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [profileForm, setProfileForm] = useState({
    tagline: '',
    bio: '',
    specialties: '',
    yearsOfExperience: '',
    coverImage: '',
    profileImage: '',
    locationAddress: '',
    locationLatitude: '',
    locationLongitude: '',
    locationMode: 'manual'
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState('');
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', caption: '', image: '' });
  const [addingPortfolio, setAddingPortfolio] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const meRes = await API.get('/auth/me', { headers });
        const currentUser = meRes.data.data;
        localStorage.setItem('homechef_user', JSON.stringify(currentUser));
        setUser(currentUser);
        const savedLocation = currentUser.location && typeof currentUser.location === 'object'
          ? currentUser.location
          : { address: currentUser.location || '', latitude: currentUser.latitude || 0, longitude: currentUser.longitude || 0 };

        setProfileForm({
          tagline: currentUser.tagline || '',
          bio: currentUser.bio || '',
          specialties: Array.isArray(currentUser.specialties) ? currentUser.specialties.join(', ') : '',
          yearsOfExperience: currentUser.yearsOfExperience || '',
          coverImage: currentUser.coverImage || '',
          profileImage: currentUser.profileImage || '',
          locationAddress: savedLocation.address || '',
          locationLatitude: savedLocation.latitude || '',
          locationLongitude: savedLocation.longitude || '',
          locationMode: savedLocation.address ? 'manual' : 'manual'
        });
        setPortfolioItems(currentUser.portfolio || []);

        if (currentUser.role !== 'HOMECHEF' && currentUser.role !== 'ADMIN') {
          navigate('/become-chef');
          return;
        }

        const [catRes, dishRes] = await Promise.all([
          API.get('/categories'),
          API.get('/dishes/my', { headers })
        ]);
        setCategories(catRes.data.data || []);
        setMyDishes(dishRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('homechef_token');
      const response = await API.post(
        '/dishes',
        { ...form, price: Number(form.price), availableQuantity: Number(form.availableQuantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'Listing created successfully');
      setForm({ categoryId: '', name: '', cuisine: '', price: '', description: '', availableQuantity: '10' });
      const dishRes = await API.get('/dishes/my', { headers: { Authorization: `Bearer ${token}` } });
      setMyDishes(dishRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dish) => {
    setEditingId(dish._id);
    setEditForm({
      name: dish.name,
      price: dish.price,
      availableQuantity: dish.availableQuantity,
      availabilityStatus: dish.availabilityStatus,
      description: dish.description
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    setSavingEdit(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('homechef_token');
      await API.put(
        `/dishes/${id}`,
        {
          ...editForm,
          price: Number(editForm.price),
          availableQuantity: Number(editForm.availableQuantity)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Listing updated successfully');
      cancelEdit();
      const dishRes = await API.get('/dishes/my', { headers: { Authorization: `Bearer ${token}` } });
      setMyDishes(dishRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update listing');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteDish = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('homechef_token');
      await API.delete(`/dishes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Listing deleted successfully');
      const dishRes = await API.get('/dishes/my', { headers: { Authorization: `Bearer ${token}` } });
      setMyDishes(dishRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete listing');
    }
  };

  const uploadImage = async (file) => {
    const token = localStorage.getItem('homechef_token');
    const formData = new FormData();
    formData.append('image', file);
    const response = await API.post('/upload', formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data.url;
  };

  const handleProfileUpload = async (which, file) => {
    if (!file) return;
    setUploading(which);
    setError('');
    try {
      const url = await uploadImage(file);
      if (which === 'cover') setProfileForm((f) => ({ ...f, coverImage: url }));
      if (which === 'avatar') setProfileForm((f) => ({ ...f, profileImage: url }));
      setMessage('Photo uploaded. Remember to save your profile.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload the photo');
    } finally {
      setUploading('');
    }
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
      setError('Geolocation is not supported in this browser. Please set your location manually.');
      return;
    }

    setMessage('Requesting your current location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const placeName = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
        setProfileForm((prev) => ({
          ...prev,
          locationMode: 'current',
          locationLatitude: position.coords.latitude,
          locationLongitude: position.coords.longitude,
          locationAddress: placeName
        }));
        setMessage('Current location captured successfully.');
      },
      () => {
        setError('Location access was denied. You can still set your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('homechef_token');
      const payload = {
        tagline: profileForm.tagline,
        bio: profileForm.bio,
        specialties: profileForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: Number(profileForm.yearsOfExperience) || 0,
        coverImage: profileForm.coverImage,
        profileImage: profileForm.profileImage,
        location: {
          address: profileForm.locationAddress || '',
          latitude: Number(profileForm.locationLatitude || 0),
          longitude: Number(profileForm.locationLongitude || 0)
        }
      };

      await API.put('/chefs/me/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      const meRes = await API.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const updated = meRes.data.data;
      localStorage.setItem('homechef_user', JSON.stringify(updated));
      setUser(updated);
      setMessage('Profile updated. Customers will see this on your public profile.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!portfolioForm.image) {
      setError('Please upload a photo of your work.');
      return;
    }
    setAddingPortfolio(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('homechef_token');
      const response = await API.post(
        '/chefs/me/portfolio',
        { image: portfolioForm.image, title: portfolioForm.title, caption: portfolioForm.caption },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPortfolioItems(response.data.data || []);
      setPortfolioForm({ title: '', caption: '', image: '' });
      setMessage('Work sample added to your portfolio.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add work sample');
    } finally {
      setAddingPortfolio(false);
    }
  };

  const handlePortfolioUpload = async (file) => {
    if (!file) return;
    setUploading('portfolio');
    setError('');
    try {
      const url = await uploadImage(file);
      setPortfolioForm((f) => ({ ...f, image: url }));
      setMessage('Photo uploaded. Add a title and save.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload the photo');
    } finally {
      setUploading('');
    }
  };

  const deletePortfolio = async (itemId) => {
    if (!window.confirm('Remove this work sample from your portfolio?')) return;
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('homechef_token');
      const response = await API.delete(`/chefs/me/portfolio/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioItems(response.data.data || []);
      setMessage('Work sample removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove work sample');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-[#FAF6F8] flex items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-500">Loading your HomeChef dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#FAF6F8] px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-[#4B254B] text-white">
                <ChefHat className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-2xl font-extrabold text-[#3A233C]">HomeChef Dashboard</h2>
                <p className="text-xs text-slate-500 mt-0.5">Welcome back, {user?.name}!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                Application Status: Approved
              </span>
              <Link
                to="/chef/availability"
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <CalendarDays className="w-4 h-4" /> Manage availability
              </Link>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Public profile */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#4B254B]" />
              <h3 className="font-bold text-slate-900 text-base">Public profile</h3>
            </div>
            <Link
              to={`/chefs/${user.id}`}
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#4B254B] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View live profile
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            This is what customers see on the chef directory and your profile page.
          </p>

          <form onSubmit={saveProfile} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Cover photo</label>
              <div className="flex items-center gap-3">
                {profileForm.coverImage ? (
                  <img src={profileForm.coverImage} alt="Cover" className="h-24 w-40 rounded-xl border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-24 w-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                  {uploading === 'cover' ? 'Uploading...' : 'Upload cover photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading === 'cover'}
                    onChange={(e) => { handleProfileUpload('cover', e.target.files[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Profile photo</label>
              <div className="flex items-center gap-3">
                <img
                  src={profileForm.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100'}
                  alt="Profile"
                  className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                />
                <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                  {uploading === 'avatar' ? 'Uploading...' : 'Upload profile photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading === 'avatar'}
                    onChange={(e) => { handleProfileUpload('avatar', e.target.files[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Years of experience</label>
              <input
                type="number"
                min="0"
                value={profileForm.yearsOfExperience}
                onChange={(e) => setProfileForm({ ...profileForm, yearsOfExperience: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="e.g. 8"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Tagline</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="e.g. Five-star Italian cooking for your table"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">About / Bio</label>
              <textarea
                rows="3"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Tell customers about your cooking style and background"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Specialties (comma separated)</label>
              <input
                type="text"
                value={profileForm.specialties}
                onChange={(e) => setProfileForm({ ...profileForm, specialties: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Italian, Fresh pasta, Dinner parties"
              />
            </div>

            <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="rounded-xl border border-[#4B254B] bg-white px-3 py-1.5 text-[11px] font-bold text-[#4B254B] hover:bg-[#F6EEF4]"
                  >
                    Use My Current Location
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={profileForm.locationAddress}
                onChange={(e) => setProfileForm({ ...profileForm, locationAddress: e.target.value, locationMode: 'manual' })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Search or enter your kitchen address"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="number"
                  step="any"
                  value={profileForm.locationLatitude}
                  onChange={(e) => setProfileForm({ ...profileForm, locationLatitude: e.target.value, locationMode: 'manual' })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={profileForm.locationLongitude}
                  onChange={(e) => setProfileForm({ ...profileForm, locationLongitude: e.target.value, locationMode: 'manual' })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-[#4B254B] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#391B39] transition-colors disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Portfolio */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#4B254B]" />
            <h3 className="font-bold text-slate-900 text-base">Your work (portfolio)</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Photos of dishes and events you cook for — customers see these on your public profile.
          </p>

          <form onSubmit={handleAddPortfolio} className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Title, e.g. Private pasta night"
            />
            <input
              type="text"
              value={portfolioForm.caption}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, caption: e.target.value })}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              placeholder="Caption (optional)"
            />
            <div className="flex items-center gap-3 md:col-span-2">
              {portfolioForm.image ? (
                <img src={portfolioForm.image} alt="Work sample preview" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                {uploading === 'portfolio' ? 'Uploading...' : 'Upload work photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading === 'portfolio'}
                  onChange={(e) => { handlePortfolioUpload(e.target.files[0]); e.target.value = ''; }}
                />
              </label>
              <button
                type="submit"
                disabled={addingPortfolio}
                className="rounded-xl bg-[#4B254B] px-4 py-2 text-xs font-bold text-white hover:bg-[#391B39] transition-colors disabled:opacity-60"
              >
                {addingPortfolio ? 'Adding...' : 'Add to portfolio'}
              </button>
            </div>
          </form>

          {portfolioItems.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">No work samples yet. Add photos to build your portfolio.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item) => (
                <div key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={item.image} alt={item.title || 'Work sample'} className="h-32 w-full object-cover" />
                  <div className="p-3">
                    {item.title && <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>}
                    {item.caption && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.caption}</p>}
                    <button
                      onClick={() => deletePortfolio(item._id)}
                      className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create listing */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-[#4B254B]" />
            <h3 className="font-bold text-slate-900 text-base">Create a food listing</h3>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Dish name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Handmade Linguine Vongole"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B] bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Cuisine</label>
              <input
                type="text"
                name="cuisine"
                value={form.cuisine}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Italian"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Price (Rs.)</label>
              <input
                type="number"
                name="price"
                min="0"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Available quantity</label>
              <input
                type="number"
                name="availableQuantity"
                min="0"
                value={form.availableQuantity}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                placeholder="Describe your dish"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
              >
                {submitting ? 'Creating listing...' : 'Create listing'}
              </button>
            </div>
          </form>
        </div>

        {/* My listings */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-5">My listings ({myDishes.length})</h3>

          {myDishes.length === 0 ? (
            <p className="text-sm text-slate-500">You have not created any food listings yet.</p>
          ) : (
            <div className="space-y-3">
              {myDishes.map((dish) => (
                <div key={dish._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {editingId === dish._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          type="number"
                          name="price"
                          value={editForm.price}
                          onChange={handleEditChange}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          name="availableQuantity"
                          value={editForm.availableQuantity}
                          onChange={handleEditChange}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <select
                          name="availabilityStatus"
                          value={editForm.availabilityStatus}
                          onChange={handleEditChange}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="LIMITED">LIMITED</option>
                          <option value="SOLD_OUT">SOLD_OUT</option>
                          <option value="UNAVAILABLE">UNAVAILABLE</option>
                        </select>
                      </div>
                      <textarea
                        name="description"
                        rows="2"
                        value={editForm.description}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(dish._id)}
                          disabled={savingEdit}
                          className="rounded-xl bg-[#4B254B] px-4 py-2 text-xs font-bold text-white hover:bg-[#391B39] disabled:opacity-60"
                        >
                          {savingEdit ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {dish.name}{' '}
                          <span className="ml-1 font-bold text-[#4B254B]">Rs. {dish.price}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {dish.categoryId?.name || 'Uncategorized'} · Qty {dish.availableQuantity} · Status: {dish.availabilityStatus}
                        </p>
                        {dish.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{dish.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(dish)}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#4B254B]"
                          aria-label="Edit listing"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDish(dish._id)}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-red-600"
                          aria-label="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeChefDashboard;

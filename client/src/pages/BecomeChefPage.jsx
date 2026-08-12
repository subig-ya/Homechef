import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  ChefHat,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Upload,
  UtensilsCrossed
} from 'lucide-react';

const STATUS_STYLES = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 border-red-200 text-red-700', icon: XCircle }
};

const KITCHEN_TYPES = [
  { value: 'HOME_KITCHEN', label: 'Home kitchen' },
  { value: 'RENTED_KITCHEN', label: 'Rented/communal kitchen' },
  { value: 'COMMUNITY_KITCHEN', label: 'Community kitchen' },
  { value: 'COMMERCIAL_KITCHEN', label: 'Commercial kitchen' },
  { value: 'OTHER', label: 'Other' }
];

const emptyMenuItem = () => ({ name: '', description: '', price: '', cuisine: '', dietary: '', image: '' });

const BecomeChefPage = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    location: '',
    about: '',
    specialties: '',
    yearsOfExperience: '',
    kitchenType: '',
    serviceArea: ''
  });
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Refresh stored user so role/status stay in sync after admin review.
        const meRes = await API.get('/auth/me', { headers });
        const currentUser = meRes.data.data;
        localStorage.setItem('homechef_user', JSON.stringify(currentUser));

        if (currentUser.role === 'HOMECHEF') {
          navigate('/dashboard');
          return;
        }

        const appRes = await API.get('/homechef/me', { headers });
        const existing = appRes.data.data || null;
        setApplication(existing);
        if (existing) {
          setForm({
            fullName: existing.fullName || currentUser.name || '',
            phone: existing.phone || currentUser.phone || '',
            location: existing.location || currentUser.location || '',
            about: existing.about || '',
            specialties: Array.isArray(existing.specialties) ? existing.specialties.join(', ') : '',
            yearsOfExperience: existing.yearsOfExperience || '',
            kitchenType: existing.kitchenType || '',
            serviceArea: existing.serviceArea || ''
          });
          setMenuItems(
            (existing.menuItems || []).map((m) => ({
              name: m.name || '',
              description: m.description || '',
              price: m.price || '',
              cuisine: m.cuisine || '',
              dietary: Array.isArray(m.dietary) ? m.dietary.join(', ') : '',
              image: m.image || ''
            }))
          );
        } else {
          setForm((prev) => ({
            ...prev,
            fullName: currentUser.name || '',
            phone: currentUser.phone || '',
            location: currentUser.location || ''
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your application');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMenuChange = (index, field, value) => {
    setMenuItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addMenuItem = () => setMenuItems((prev) => [...prev, emptyMenuItem()]);

  const removeMenuItem = (index) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImage = async (index, file) => {
    if (!file) return;

    const token = localStorage.getItem('homechef_token');
    setUploadingIndex(index);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await API.post('/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      const url = response.data.data.url;
      setMenuItems((prev) => prev.map((item, i) => (i === index ? { ...item, image: url } : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload the photo');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    const payloadMenu = menuItems
      .filter((m) => m.name.trim() && Number(m.price) > 0)
      .map((m) => ({
        name: m.name.trim(),
        description: m.description.trim(),
        price: Number(m.price),
        cuisine: m.cuisine.trim(),
        image: m.image,
        dietary: m.dietary.split(',').map((s) => s.trim()).filter(Boolean)
      }));

    try {
      const token = localStorage.getItem('homechef_token');
      const response = await API.post(
        '/homechef/apply',
        {
          ...form,
          yearsOfExperience: Number(form.yearsOfExperience) || 0,
          specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
          menuItems: payloadMenu
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplication(response.data.data);
      setMessage(
        response.data.message ||
          `Application submitted with ${payloadMenu.length} menu item${payloadMenu.length !== 1 ? 's' : ''}.`
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-[#FAF6F8] flex items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    );
  }

  const status = application?.status || null;
  const statusInfo = status ? STATUS_STYLES[status] : null;
  const canApply = !status || status === 'REJECTED';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#FAF6F8] px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-[#4B254B] text-white">
              <ChefHat className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-[#3A233C]">Become a HomeChef</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Anyone can join as a HomeChef right away. No admin approval needed.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Your kitchen account is activated as soon as you submit this form.
          </div>
        </div>

        {canApply && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
            {status === 'REJECTED' && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                Your previous application was rejected. You may submit a new application below.
              </p>
            )}

            {message && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <h3 className="font-bold text-slate-900 text-sm mb-4">HomeChef Application</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Full name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone number</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                    placeholder="+977 98XXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Years of cooking experience</label>
                  <input
                    type="number"
                    min="0"
                    name="yearsOfExperience"
                    value={form.yearsOfExperience}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Address / Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Kathmandu"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Kitchen type</label>
                  <select
                    name="kitchenType"
                    value={form.kitchenType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B] bg-white"
                  >
                    <option value="">Select where you cook</option>
                    {KITCHEN_TYPES.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Service area</label>
                  <input
                    type="text"
                    name="serviceArea"
                    value={form.serviceArea}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                    placeholder="e.g. Kathmandu Valley"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">About you</label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Tell us about your cooking background, style, and what makes your food special"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">Food specialties (comma separated)</label>
                <input
                  type="text"
                  name="specialties"
                  value={form.specialties}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  placeholder="Nepali, Momo, Snacks"
                />
              </div>

              {/* Menu items */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#4B254B]" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Your menu</h4>
                      <p className="text-[11px] text-slate-500">
                        Add the dishes you plan to cook so the admin can see your menu.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#4B254B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#391B39] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add item
                  </button>
                </div>

                {menuItems.length === 0 && (
                  <p className="text-xs text-slate-500">No menu items yet. Add a dish to help the admin review your application.</p>
                )}

                <div className="space-y-4">
                  {menuItems.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start gap-4">
                        {/* Photo */}
                        <div className="w-24 shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || 'Menu item'}
                              className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                              <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <label className="mt-2 block cursor-pointer text-center rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                            {uploadingIndex === index ? 'Uploading...' : item.image ? 'Change photo' : 'Upload photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingIndex === index}
                              onChange={(e) => {
                                handleUploadImage(index, e.target.files[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleMenuChange(index, 'name', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                              placeholder="Dish name (required)"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleMenuChange(index, 'price', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                              placeholder="Price in Rs. (required)"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={item.cuisine}
                              onChange={(e) => handleMenuChange(index, 'cuisine', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                              placeholder="Cuisine, e.g. Nepali"
                            />
                            <input
                              type="text"
                              value={item.dietary}
                              onChange={(e) => handleMenuChange(index, 'dietary', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                              placeholder="Dietary tags, e.g. veg, gluten-free"
                            />
                          </div>
                          <textarea
                            rows="2"
                            value={item.description}
                            onChange={(e) => handleMenuChange(index, 'description', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                            placeholder="Short description of the dish"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          aria-label="Remove menu item"
                          className="shrink-0 p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition hover:bg-[#391B39] disabled:opacity-60 shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BecomeChefPage;

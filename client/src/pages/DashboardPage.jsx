import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getUser, setUser as persistUser, clearAuth } from '../auth/storage';
import {
  LogOut,
  ArrowRight,
  Star,
  MapPin,
  ShoppingBag,
  CalendarDays,
  Plus,
  Sparkles,
  Hourglass,
  XCircle,
  CheckCircle2,
  Utensils,
  ReceiptText,
  Clock,
  Menu,
  X,
  CreditCard,
  User,
  Settings,
  Pencil,
  Trash2,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Home as HomeIcon,
  Bell
} from 'lucide-react';

const ORDER_STATUS = {
  PENDING: { label: 'Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED: { label: 'Accepted', cls: 'text-[#E25C80] bg-[#E25C80]/5 border-[#E25C80]/20' },
  PREPARING: { label: 'Preparing', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  PAYMENT_PENDING: { label: 'Payment Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  PAID: { label: 'Paid', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  READY: { label: 'Ready', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  COMPLETED: { label: 'Completed', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED: { label: 'Cancelled', cls: 'text-slate-500 bg-slate-100 border-slate-200' },
  EXPIRED: { label: 'Expired', cls: 'text-slate-500 bg-slate-100 border-slate-200' }
};

const BOOKING_STATUS = {
  PENDING: { label: 'Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED: { label: 'Accepted', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200' },
  EXPIRED: { label: 'Expired', cls: 'text-slate-500 bg-slate-100 border-slate-200' }
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('customer'); // 'customer' or 'chef'
  const [activeTab, setActiveTab] = useState('overview'); // dynamic tab navigation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Common customer data
  const [recommendedDishes, setRecommendedDishes] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Common chef data
  const [myListings, setMyListings] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerBookings, setSellerBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [categories, setCategories] = useState([]);

  // Loading indicator for Chef actions
  const [chefLoading, setChefLoading] = useState(false);

  // Payments processing id tracker
  const [payingId, setPayingId] = useState(null);

  // Form states
  const [dishForm, setDishForm] = useState({ categoryId: '', name: '', cuisine: '', price: '', description: '', availableQuantity: '10', image: '' });
  const [dishSubmitting, setDishSubmitting] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [editDishForm, setEditDishForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [slotForm, setSlotForm] = useState({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: '', email: '', location: '', latitude: '', longitude: '', description: '', profileImage: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Fetch initial profile & customer info
  const loadInitialData = async () => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const meRes = await API.get('/auth/me', { headers });
      const currentUser = meRes.data.data;
      persistUser(currentUser);
      setUser(currentUser);
      
      // Default to chef mode if registered as HOMECHEF
      setMode(currentUser.role === 'HOMECHEF' ? 'chef' : 'customer');

      if (currentUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
        return;
      }

      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        location: currentUser.location || '',
        latitude: currentUser.latitude || '',
        longitude: currentUser.longitude || '',
        description: currentUser.description || '',
        profileImage: currentUser.profileImage || ''
      });

      const [dishRes, sellerRes, orderRes, bookingRes] = await Promise.allSettled([
        API.get('/dishes?sort=recommended'),
        API.get('/sellers'),
        API.get('/orders/my', { headers }),
        API.get('/bookings/my', { headers })
      ]);

      if (dishRes.status === 'fulfilled') setRecommendedDishes(dishRes.value.data.data?.slice(0, 4) || []);
      if (sellerRes.status === 'fulfilled') setChefs(sellerRes.value.data.data || []);
      if (orderRes.status === 'fulfilled') setMyOrders(orderRes.value.data.data || []);
      if (bookingRes.status === 'fulfilled') setMyBookings(bookingRes.value.data.data || []);

      const notificationsRes = await API.get('/notifications', { headers });
      setNotifications(notificationsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [navigate]);

  const isChef = user?.role === 'HOMECHEF';

  // Load chef-specific lists
  const loadChefData = async () => {
    if (!user || !isChef || mode !== 'chef') return;
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };
    setChefLoading(true);

    try {
      const [d, o, b, s, c] = await Promise.allSettled([
        API.get('/dishes/my', { headers }),
        API.get('/orders/seller', { headers }),
        API.get('/bookings/seller', { headers }),
        API.get('/slots/chef', { headers }),
        API.get('/categories')
      ]);

      if (d.status === 'fulfilled') setMyListings(d.value.data.data || []);
      if (o.status === 'fulfilled') setSellerOrders(o.value.data.data || []);
      if (b.status === 'fulfilled') setSellerBookings(b.value.data.data || []);
      if (s.status === 'fulfilled') setSlots(s.value.data.data || []);
      if (c.status === 'fulfilled') setCategories(c.value.data.data || []);
    } catch (err) {
      setError('Unable to load kitchen lists');
    } finally {
      setChefLoading(false);
    }
  };

  useEffect(() => {
    loadChefData();
  }, [mode, user, isChef]);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const handleMarkNotificationRead = async (notificationId) => {
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.put(`/notifications/${notificationId}/read`, {}, { headers });
      setNotifications((prev) => prev.map((notification) =>
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update notification');
    }
  };

  // Chef order status actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };
    setMessage('');
    setError('');

    try {
      const response = await API.put(`/orders/${orderId}/status`, { status: newStatus }, { headers });
      setMessage(response.data.message || `Order status updated to ${newStatus}`);
      const updated = await API.get('/orders/seller', { headers });
      setSellerOrders(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  // Chef booking accept/reject actions
  const handleUpdateBookingStatus = async (bookingId, action) => {
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };
    setMessage('');
    setError('');

    try {
      const response = await API.put(`/bookings/${bookingId}/${action}`, {}, { headers });
      setMessage(response.data.message || `Booking request ${action}ed`);
      const updated = await API.get('/bookings/seller', { headers });
      setSellerBookings(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} booking`);
    }
  };

  // Customer cancels their own order (refund rules handled by the backend).
  const handleCancelOrder = async (orderId, orderStatus) => {
    const refundHint =
      orderStatus === 'PENDING'
        ? 'You will receive a full refund.'
        : orderStatus === 'ACCEPTED' || orderStatus === 'PREPARING'
          ? 'A partial refund applies.'
          : 'Contact the chef about this cancellation.';
    if (!window.confirm(`Cancel this order? ${refundHint}`)) return;
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const response = await API.post(`/orders/${orderId}/cancel`, { reason: 'Cancelled by customer' }, { headers });
      setMessage(response.data.message || 'Order cancelled');
      const updated = await API.get('/orders/my', { headers });
      setMyOrders(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Chef add dish
  const handleAddDishSubmit = async (e) => {
    e.preventDefault();
    setDishSubmitting(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.post(
        '/dishes',
        {
          ...dishForm,
          price: Number(dishForm.price),
          availableQuantity: Number(dishForm.availableQuantity)
        },
        { headers }
      );
      setMessage('New listing created successfully!');
      setDishForm({ categoryId: '', name: '', cuisine: '', price: '', description: '', availableQuantity: '10', image: '' });
      const updated = await API.get('/dishes/my', { headers });
      setMyListings(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setDishSubmitting(false);
    }
  };

  // Chef edit dish inline
  const startEditDish = (dish) => {
    setEditingDishId(dish._id);
    setEditDishForm({
      name: dish.name,
      price: dish.price,
      availableQuantity: dish.availableQuantity,
      availabilityStatus: dish.availabilityStatus,
      description: dish.description,
      image: dish.image || ''
    });
  };

  const saveDishEdit = async (id) => {
    setSavingEdit(true);
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.put(
        `/dishes/${id}`,
        {
          ...editDishForm,
          price: Number(editDishForm.price),
          availableQuantity: Number(editDishForm.availableQuantity)
        },
        { headers }
      );
      setMessage('Listing updated successfully');
      setEditingDishId(null);
      const updated = await API.get('/dishes/my', { headers });
      setMyListings(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing changes');
    } finally {
      setSavingEdit(false);
    }
  };

  // Chef delete dish
  const handleDeleteDish = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.delete(`/dishes/${id}`, { headers });
      setMessage('Listing deleted successfully');
      const updated = await API.get('/dishes/my', { headers });
      setMyListings(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  // Chef add slot
  const handleAddSlotSubmit = async (e) => {
    e.preventDefault();
    setSlotSubmitting(true);
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.post(
        '/slots',
        {
          ...slotForm,
          maxBookings: Number(slotForm.maxBookings)
        },
        { headers }
      );
      setMessage('Availability slot created successfully');
      setSlotForm({ date: '', slotType: 'MORNING', startTime: '', endTime: '', maxBookings: '1' });
      const updated = await API.get('/slots/chef', { headers });
      setSlots(updated.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create availability slot');
    } finally {
      setSlotSubmitting(false);
    }
  };

  // Profile update (customer & chef). Location can be a typed address or a
  // lat/lng pair captured from the device's GPS.
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await API.put('/auth/profile', {
        name: profileForm.name,
        profileImage: profileForm.profileImage,
        location: {
          address: profileForm.location || '',
          latitude: Number(profileForm.latitude) || 0,
          longitude: Number(profileForm.longitude) || 0
        }
      }, { headers });
      setMessage('Profile updated successfully');
      const meRes = await API.get('/auth/me', { headers });
      setUser(meRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile details');
    } finally {
      setProfileSaving(false);
    }
  };

  // Capture the customer's location straight from the device GPS.
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setProfileForm((prev) => ({
          ...prev,
          latitude,
          longitude,
          location: prev.location || `${latitude}, ${longitude}`
        }));
        setLocating(false);
        setMessage('Location captured from your device. Press Save to confirm.');
      },
      (err) => {
        setLocating(false);
        setError(`Unable to get your location: ${err.message}. Allow location access and try again.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Spent calculation
  const totalSpent = myOrders
    .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-3">
          <Clock className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-chocolate/80">Loading your HomeChef dashboard...</p>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items definition
  const customerMenu = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore Meals', icon: Utensils },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'bookings', label: 'Table Bookings', icon: CalendarDays },
    { id: 'profile', label: 'My Profile', icon: Settings }
  ];

  const chefMenu = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings', label: 'My Dishes', icon: Utensils },
    { id: 'orders', label: 'Customer Orders', icon: ReceiptText },
    { id: 'bookings', label: 'Table Bookings', icon: CalendarDays },
    { id: 'availability', label: 'Manage Slots', icon: Clock },
    { id: 'profile', label: 'Kitchen Settings', icon: Settings }
  ];

  const menuItems = mode === 'chef' ? chefMenu : customerMenu;

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-chocolate font-sans">
      
      {/* Mobile Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-chocolate/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between w-64 border-r border-pink-100 bg-[#381E39] text-pink-50 p-6 transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Close button on Mobile */}
          <div className="flex items-center justify-between">
            <Link to="/" className="font-cursive text-3xl text-white">
              HomeChef
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-full text-pink-100 hover:bg-white/10 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile summary */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
            <img
              src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-pink-200/20"
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-white leading-snug">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 mt-1 bg-primary text-white text-[9px] font-bold rounded-md uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Menu list */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                    setMessage('');
                    setError('');
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-pink-100/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-6 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-pink-100/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <HomeIcon className="w-4 h-4" />
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN RIGHT CONTAINER CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-cream">
        
        {/* TOP CONTENT HEADER BAR */}
        <header className="h-16 border-b border-pink-100 bg-white flex items-center justify-between px-6 shrink-0 relative z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-full text-chocolate hover:bg-pink-50 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-display font-extrabold text-lg text-chocolate capitalize">
              {mode === 'chef' ? 'Kitchen Center' : 'Customer Space'} &gt;{' '}
              {menuItems.find((item) => item.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-chocolate/80">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative p-2 rounded-full border border-pink-100 bg-pink-50 text-chocolate hover:bg-pink-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-pink-100 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-chocolate/70">Notifications</h4>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[10px] font-bold text-chocolate/50 hover:text-chocolate"
                    >
                      Close
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-chocolate/50 py-3">No notifications yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => {
                            handleMarkNotificationRead(notification._id);
                            setNotificationsOpen(false);
                          }}
                          className={`w-full rounded-xl border p-3 text-left transition-colors ${
                            notification.isRead
                              ? 'border-pink-100 bg-pink-50/40 text-chocolate/70'
                              : 'border-primary/20 bg-primary/5 text-chocolate'
                          }`}
                        >
                          <p className="text-[11px] font-bold">{notification.title}</p>
                          <p className="mt-1 text-[10px] leading-relaxed opacity-80">{notification.message}</p>
                          {!notification.isRead && (
                            <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">Unread</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === 'chef' ? (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kitchen Active
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                <User className="w-3.5 h-3.5" /> Buyer Account
              </span>
            )}
          </div>
        </header>

        {/* SCROLLABLE PANEL WRAPPER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-20 space-y-6">
          
          {/* Notifications */}
          {message && (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fade-up">
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="p-1 text-emerald-600 hover:text-emerald-950 font-extrabold">✕</button>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-xs font-semibold text-red-800 flex items-center justify-between animate-fade-up">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-1 text-red-600 hover:text-red-950 font-extrabold">✕</button>
            </div>
          )}

          {/* CUSTOMER MODE PANELS */}
          {mode === 'customer' && (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-up">
                  {/* Statistics */}
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-chocolate/50 tracking-wider">My Orders</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">{myOrders.length}</h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><ShoppingBag className="w-6 h-6" /></span>
                    </div>

                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-chocolate/50 tracking-wider">Booked Tables</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">{myBookings.length}</h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><CalendarDays className="w-6 h-6" /></span>
                    </div>

                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-chocolate/50 tracking-wider">Community Spent</p>
                        <h4 className="mt-1 text-2xl font-extrabold text-chocolate">Rs. {totalSpent.toLocaleString('en-IN')}</h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><CreditCard className="w-6 h-6" /></span>
                    </div>
                  </div>

                  {/* Greeting banner */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="font-cursive text-3xl text-chocolate">{greeting()}, {user?.name?.split(' ')[0]}!</h3>
                      <p className="text-xs text-chocolate/60 max-w-md font-semibold leading-relaxed">
                        What are you craving today? Explore home-cooked meals by neighborhood chefs or check current orders status below.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all"
                    >
                      Browse Recommended Food
                    </button>
                  </div>

                  {/* Quick recent orders list */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-display font-extrabold text-base">Recent orders</h3>
                    {myOrders.length === 0 ? (
                      <p className="text-xs text-chocolate/55 py-2">No orders placed yet.</p>
                    ) : (
                      <div className="divide-y divide-pink-50">
                        {myOrders.slice(0, 3).map((order) => {
                          const status = ORDER_STATUS[order.status] || { label: order.status, cls: 'text-slate-600 bg-slate-50 border-slate-200' };
                          return (
                            <div key={order._id} className="py-3 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold">{order.items?.map((i) => i.name).join(', ')}</p>
                                <p className="text-[10px] text-chocolate/50 mt-0.5">
                                  {order.sellerId?.name} · {formatDate(order.createdAt)} · Rs. {order.totalAmount}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.cls}`}>{status.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Explore Meals */}
              {activeTab === 'explore' && (
                <div className="space-y-6 animate-fade-up">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="font-display font-extrabold text-lg">Top Homemade Favorites</h3>
                      <p className="text-xs text-chocolate/60">Crafted with care by registered home chefs near you</p>
                    </div>
                    <Link to="/food" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                      Explore Food Marketplace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {recommendedDishes.length === 0 ? (
                    <p className="text-xs text-chocolate/55">No recommended meals listed currently.</p>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {recommendedDishes.map((dish) => (
                        <div key={dish._id} className="bg-white border border-pink-100 rounded-2xl p-4 flex flex-col justify-between group shadow-xs">
                          <div>
                            <div className="relative aspect-square overflow-hidden bg-pink-50/20 rounded-xl mb-3">
                              <img
                                src={dish.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=600'}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/90 text-chocolate text-[9px] font-bold rounded-md shadow-xs">
                                {dish.cuisine}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-chocolate text-sm leading-snug truncate">{dish.name}</h4>
                            <p className="text-[10px] text-chocolate/60 truncate mt-1">Chef: {dish.sellerId?.name || 'Local Kitchen'}</p>
                          </div>
                          <div className="mt-4 pt-2.5 border-t border-pink-50 flex items-center justify-between">
                            <span className="text-sm font-extrabold text-chocolate">Rs. {dish.price}</span>
                            <Link to="/food" className="w-7 h-7 rounded-full bg-[#FEF08A] hover:bg-amber-300 flex items-center justify-center text-chocolate transition-colors">
                              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chefs lists */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs mt-6 space-y-4">
                    <h3 className="font-display font-extrabold text-base">Chefs directory</h3>
                    {chefs.length === 0 ? (
                      <p className="text-xs text-chocolate/55">No registered chefs found.</p>
                    ) : (
                      <div className="divide-y divide-pink-50">
                        {chefs.slice(0, 3).map((chef) => (
                          <div key={chef._id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={chef.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100'}
                                alt={chef.name}
                                className="w-8 h-8 rounded-full object-cover border border-pink-100"
                              />
                              <div>
                                <p className="text-xs font-bold">{chef.name}</p>
                                <p className="text-[10px] text-chocolate/50 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {chef.location || 'Kathmandu'}
                                </p>
                              </div>
                            </div>
                            <Link to="/chefs" className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full text-[10px] font-bold transition-all">
                              Profile
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: My Orders */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">My order history</h3>
                    <p className="text-xs text-chocolate/60">Monitor your food orders</p>
                  </div>

                  {myOrders.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <ShoppingBag className="w-8 h-8 text-primary/30 mx-auto" />
                      <p className="text-xs font-semibold text-chocolate/50">You have not ordered anything yet.</p>
                      <Link to="/food" className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-full">
                        Browse food
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-pink-100 text-chocolate/50 font-bold uppercase tracking-wider">
                            <th className="pb-3 px-2">Order ID</th>
                            <th className="pb-3 px-2">Dishes</th>
                            <th className="pb-3 px-2">Chef</th>
                            <th className="pb-3 px-2">Total Amount</th>
                            <th className="pb-3 px-2">Date</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pink-50">
                          {myOrders.map((order) => {
                            const status = ORDER_STATUS[order.status] || { label: order.status, cls: 'text-slate-600 bg-slate-50' };
                            const cancellable = ['PENDING', 'ACCEPTED', 'PREPARING'].includes(order.status);
                            const requestLine = [
                              order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup',
                              order.requestedTime ? `for ${formatDateTime(order.requestedTime)}` : 'ASAP'
                            ].filter(Boolean).join(' · ');
                            return (
                              <tr key={order._id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="py-3.5 px-2 font-mono text-[10px] text-chocolate/60">#{order._id?.slice(-6)}</td>
                                <td className="py-3.5 px-2 font-bold">{order.items?.map((i) => `${i.name} (${i.quantity})`).join(', ')}</td>
                                <td className="py-3.5 px-2 font-semibold">{order.sellerId?.name || 'Local Kitchen'}</td>
                                <td className="py-3.5 px-2 font-bold">
                                  Rs. {order.totalAmount}
                                  {order.cancellation?.refundType && order.cancellation.refundType !== 'NONE' && (
                                    <p className="mt-0.5 text-[9px] font-bold text-emerald-700">
                                      Refund: {order.cancellation.refundType} · Rs. {order.cancellation.refundAmount}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-2">
                                  <p className="text-chocolate/60">{formatDate(order.createdAt)}</p>
                                  <p className="text-[9px] font-semibold text-chocolate/45">{requestLine}</p>
                                </td>
                                <td className="py-3.5 px-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.cls}`}>{status.label}</span>
                                  {order.expiresAt && order.status === 'PENDING' && (
                                    <p className="mt-1 text-[9px] font-semibold text-chocolate/45">
                                      Chef must respond by {formatDateTime(order.expiresAt)}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  {cancellable && (
                                    <button
                                      onClick={() => handleCancelOrder(order._id, order.status)}
                                      className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md text-[10px] font-bold hover:bg-red-100"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Table Bookings */}
              {activeTab === 'bookings' && (
                <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">My dining bookings</h3>
                    <p className="text-xs text-chocolate/60">Check status of dining reservations</p>
                  </div>

                  {myBookings.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <CalendarDays className="w-8 h-8 text-primary/30 mx-auto" />
                      <p className="text-xs font-semibold text-chocolate/50">You have no reservations scheduled.</p>
                      <Link to="/chefs" className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-full">
                        Browse chefs
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-pink-100 text-chocolate/50 font-bold uppercase tracking-wider">
                            <th className="pb-3 px-2">Date</th>
                            <th className="pb-3 px-2">Slot</th>
                            <th className="pb-3 px-2">Chef</th>
                            <th className="pb-3 px-2">Guests</th>
                            <th className="pb-3 px-2">Price</th>
                            <th className="pb-3 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pink-50">
                          {myBookings.map((booking) => {
                            const status = BOOKING_STATUS[booking.status] || { label: booking.status, cls: 'text-slate-600 bg-slate-50' };
                            return (
                              <tr key={booking._id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="py-3.5 px-2 font-bold">{booking.date}</td>
                                <td className="py-3.5 px-2 text-chocolate/60 font-semibold">{booking.slotType} ({booking.startTime}-{booking.endTime})</td>
                                <td className="py-3.5 px-2 font-semibold">{booking.chefId?.name || 'Local Chef'}</td>
                                <td className="py-3.5 px-2 font-bold">{booking.numberOfGuests} Guests</td>
                                <td className="py-3.5 px-2 font-bold">Rs. {booking.totalAmount}</td>
                                <td className="py-3.5 px-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.cls}`}>{status.label}</span>
                                </td>
                                <td className="py-3.5 px-2 text-right text-chocolate/40">-</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: My Profile (Customer) */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">My Profile & Location</h3>
                    <p className="text-xs text-chocolate/60">
                      Keep your details up to date. Your location is used to match you with the nearest chefs.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Email (login)</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        readOnly
                        className="w-full cursor-not-allowed rounded-xl border border-pink-100 bg-pink-50/40 px-3.5 py-2.5 text-xs text-chocolate/60 font-medium"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Area / Address</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        placeholder="e.g. Baneshwor, Kathmandu"
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">
                        Device location (latitude, longitude)
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          step="any"
                          value={profileForm.latitude}
                          onChange={(e) => setProfileForm({ ...profileForm, latitude: e.target.value })}
                          placeholder="Latitude"
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        />
                        <input
                          type="number"
                          step="any"
                          value={profileForm.longitude}
                          onChange={(e) => setProfileForm({ ...profileForm, longitude: e.target.value })}
                          placeholder="Longitude"
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-[11px] font-bold text-primary hover:bg-pink-50 disabled:opacity-60 transition-all"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {locating ? 'Locating...' : 'Use my current location'}
                      </button>
                      <p className="mt-1.5 text-[10px] text-chocolate/50">
                        Uses your device's GPS. Enables "near me" chef matching via the Haversine distance formula.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Profile Image URL (optional)</label>
                      <input
                        type="text"
                        value={profileForm.profileImage}
                        onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full py-3 bg-[#4B254B] hover:bg-[#391B39] text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-all shadow-xs"
                    >
                      {profileSaving ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* HOMECHEF MODE PANELS */}
          {mode === 'chef' && isChef && (
            <>
              {/* Tab: Chef Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-up">
                  {/* Statistics grids */}
                  <div className="grid gap-5 sm:grid-cols-4">
                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-chocolate/50 tracking-wider">Active Dishes</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">{myListings.length}</h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><Utensils className="w-5 h-5" /></span>
                    </div>

                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-chocolate/50 tracking-wider">Orders Received</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">{sellerOrders.length}</h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><ReceiptText className="w-5 h-5" /></span>
                    </div>

                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-chocolate/50 tracking-wider">Pending Orders</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">
                          {sellerOrders.filter((o) => o.status === 'PENDING').length}
                        </h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><Hourglass className="w-5 h-5" /></span>
                    </div>

                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase text-chocolate/50 tracking-wider">Pending Bookings</p>
                        <h4 className="mt-1 text-3xl font-extrabold text-chocolate">
                          {sellerBookings.filter((b) => b.status === 'PENDING').length}
                        </h4>
                      </div>
                      <span className="p-3 bg-primary/10 text-primary rounded-2xl"><CalendarDays className="w-5 h-5" /></span>
                    </div>
                  </div>

                  {/* Greeting */}
                  <div className="bg-[#381E39] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="font-cursive text-3xl text-white">Welcome back to your kitchen!</h3>
                      <p className="text-xs text-pink-100/75 max-w-md font-semibold leading-relaxed">
                        Manage active menus, update orders from neighbors, and configure your table dining slots seamlessly.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="px-6 py-3 bg-white hover:bg-pink-50 text-chocolate text-xs font-bold rounded-full transition-all"
                    >
                      Manage Listings
                    </button>
                  </div>

                  {/* Pending Orders summary */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-display font-extrabold text-base">Alert: Pending Orders</h3>
                    {chefLoading ? (
                      <p className="text-xs text-chocolate/55">Loading orders...</p>
                    ) : sellerOrders.filter(o => o.status === 'PENDING').length === 0 ? (
                      <p className="text-xs text-chocolate/55">No pending orders currently.</p>
                    ) : (
                      <div className="divide-y divide-pink-50">
                        {sellerOrders.filter(o => o.status === 'PENDING').slice(0, 3).map((order) => (
                          <div key={order._id} className="py-3.5 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold">{order.customerId?.name}</p>
                              <p className="text-[10px] text-chocolate/50 mt-0.5">
                                {order.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')} · Rs. {order.totalAmount}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'ACCEPTED')}
                              className="px-4 py-1.5 bg-primary text-white text-[10px] font-bold rounded-full"
                            >
                              Accept Order
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Listings Manager */}
              {activeTab === 'listings' && (
                <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
                  {/* Left Column: Create Listing */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs h-fit">
                    <h3 className="font-display font-extrabold text-base mb-4 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary" /> Create Food Listing
                    </h3>
                    <form onSubmit={handleAddDishSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Dish Name</label>
                        <input
                          type="text"
                          name="name"
                          value={dishForm.name}
                          onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                          placeholder="Matcha Mochi Roll"
                          required
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Category</label>
                          <select
                            name="categoryId"
                            value={dishForm.categoryId}
                            onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Cuisine</label>
                          <input
                            type="text"
                            name="cuisine"
                            value={dishForm.cuisine}
                            onChange={(e) => setDishForm({ ...dishForm, cuisine: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            placeholder="Japanese"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Price (Rs.)</label>
                          <input
                            type="number"
                            name="price"
                            value={dishForm.price}
                            onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            placeholder="350"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Qty Available</label>
                          <input
                            type="number"
                            name="availableQuantity"
                            value={dishForm.availableQuantity}
                            onChange={(e) => setDishForm({ ...dishForm, availableQuantity: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            placeholder="10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Image Link URL (Optional)</label>
                        <input
                          type="text"
                          name="image"
                          value={dishForm.image}
                          onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                          placeholder="https://images.unsplash.com/... (optional)"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Description</label>
                        <textarea
                          name="description"
                          value={dishForm.description}
                          onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                          rows="3"
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                          placeholder="Ingredients, allergen statements..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={dishSubmitting}
                        className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-all shadow-xs"
                      >
                        {dishSubmitting ? 'Creating Listing...' : 'Create Food Listing'}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Listings Directory */}
                  <div className="lg:col-span-2 bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-display font-extrabold text-base">Active Dishes ({myListings.length})</h3>
                    {chefLoading ? (
                      <p className="text-xs text-chocolate/55">Loading kitchen listings...</p>
                    ) : myListings.length === 0 ? (
                      <p className="text-xs text-chocolate/55 py-4">No active dishes found. Add some using the creator form!</p>
                    ) : (
                      <div className="space-y-4">
                        {myListings.map((dish) => (
                          <div key={dish._id} className="p-4 border border-pink-100 rounded-2xl bg-cream/10">
                            {editingDishId === dish._id ? (
                              /* Inline Editing form */
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-chocolate/60">Dish Name</label>
                                  <input
                                    type="text"
                                    value={editDishForm.name}
                                    onChange={(e) => setEditDishForm({ ...editDishForm, name: e.target.value })}
                                    className="w-full rounded-xl border border-pink-200 px-3 py-1.5 text-xs"
                                  />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-4">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-chocolate/60">Price</label>
                                    <input
                                      type="number"
                                      value={editDishForm.price}
                                      onChange={(e) => setEditDishForm({ ...editDishForm, price: e.target.value })}
                                      className="w-full rounded-xl border border-pink-200 px-3 py-1.5 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-chocolate/60">Qty</label>
                                    <input
                                      type="number"
                                      value={editDishForm.availableQuantity}
                                      onChange={(e) => setEditDishForm({ ...editDishForm, availableQuantity: e.target.value })}
                                      className="w-full rounded-xl border border-pink-200 px-3 py-1.5 text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-chocolate/60">Availability Status</label>
                                    <select
                                      value={editDishForm.availabilityStatus}
                                      onChange={(e) => setEditDishForm({ ...editDishForm, availabilityStatus: e.target.value })}
                                      className="w-full rounded-xl border border-pink-200 px-3 py-1.5 text-xs bg-white"
                                    >
                                      <option value="AVAILABLE">AVAILABLE</option>
                                      <option value="LIMITED">LIMITED</option>
                                      <option value="SOLD_OUT">SOLD_OUT</option>
                                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-chocolate/60">Description</label>
                                  <textarea
                                    value={editDishForm.description}
                                    onChange={(e) => setEditDishForm({ ...editDishForm, description: e.target.value })}
                                    rows="2"
                                    className="w-full rounded-xl border border-pink-200 px-3 py-1.5 text-xs"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveDishEdit(dish._id)}
                                    disabled={savingEdit}
                                    className="px-4 py-1.5 bg-[#4B254B] text-white text-[10px] font-bold rounded-lg disabled:opacity-60"
                                  >
                                    {savingEdit ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingDishId(null)}
                                    className="px-4 py-1.5 bg-slate-200 text-chocolate text-[10px] font-bold rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Standard Display */
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <img
                                    src={dish.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=100'}
                                    alt={dish.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-pink-100"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-chocolate flex items-center gap-1.5">
                                      <span>{dish.name}</span>
                                      <span className="text-[10px] font-bold text-primary">Rs. {dish.price}</span>
                                    </p>
                                    <p className="text-[10px] text-chocolate/55 mt-0.5">
                                      {dish.categoryId?.name} · {dish.cuisine} · Qty {dish.availableQuantity} · {dish.availabilityStatus}
                                    </p>
                                    {dish.description && (
                                      <p className="text-[10px] text-chocolate/50 mt-1 line-clamp-1 italic">"{dish.description}"</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => startEditDish(dish)}
                                    className="p-1.5 border border-pink-100 bg-white text-chocolate/60 hover:text-primary rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDish(dish._id)}
                                    className="p-1.5 border border-pink-100 bg-white text-chocolate/60 hover:text-red-600 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              )}

              {/* Tab: Orders Received (Chefs) */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">Incoming customer orders</h3>
                    <p className="text-xs text-chocolate/60">Update status of orders placed by customers</p>
                  </div>

                  {chefLoading ? (
                    <p className="text-xs text-chocolate/55">Loading orders list...</p>
                  ) : sellerOrders.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <ReceiptText className="w-8 h-8 text-primary/30 mx-auto" />
                      <p className="text-xs font-semibold text-chocolate/50">No customer orders received yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-pink-100 text-chocolate/50 font-bold uppercase tracking-wider">
                            <th className="pb-3 px-2">Order ID</th>
                            <th className="pb-3 px-2">Customer</th>
                            <th className="pb-3 px-2">Items ordered</th>
                            <th className="pb-3 px-2">Revenue</th>
                            <th className="pb-3 px-2">Date</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pink-50">
                          {sellerOrders.map((order) => {
                            const status = ORDER_STATUS[order.status] || { label: order.status, cls: 'text-slate-600 bg-slate-50' };
                            const requestLine = [
                              order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup',
                              order.requestedTime ? formatDateTime(order.requestedTime) : 'ASAP'
                            ].filter(Boolean).join(' · ');
                            return (
                              <tr key={order._id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="py-3.5 px-2 font-mono text-[10px] text-chocolate/60">#{order._id?.slice(-6)}</td>
                                <td className="py-3.5 px-2 font-semibold">{order.customerId?.name || 'Customer'}</td>
                                <td className="py-3.5 px-2 font-bold">
                                  {order.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                                  <p className="mt-0.5 text-[9px] font-semibold text-chocolate/45">{requestLine}</p>
                                </td>
                                <td className="py-3.5 px-2 font-bold text-primary">
                                  Rs. {order.totalAmount}
                                  {order.distanceKm != null && (
                                    <p className="text-[9px] font-semibold text-chocolate/45">~{order.distanceKm.toFixed(1)} km away</p>
                                  )}
                                </td>
                                <td className="py-3.5 px-2 text-chocolate/60">{formatDate(order.createdAt)}</td>
                                <td className="py-3.5 px-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.cls}`}>{status.label}</span>
                                  {order.expiresAt && order.status === 'PENDING' && (
                                    <p className="mt-1 text-[9px] font-bold text-red-500">Respond by {formatDateTime(order.expiresAt)}</p>
                                  )}
                                  {order.cancellation?.refundType && order.cancellation.refundType !== 'NONE' && (
                                    <p className="mt-1 text-[9px] font-bold text-emerald-700">
                                      {order.cancellation.refundType} refund · Rs. {order.cancellation.refundAmount}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  <div className="flex gap-1 justify-end">
                                    {order.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order._id, 'ACCEPTED')}
                                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order._id, 'REJECTED')}
                                          className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'ACCEPTED' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(order._id, 'READY')}
                                        className="px-2.5 py-1 bg-sky-600 text-white rounded-md text-[10px] font-bold"
                                      >
                                        Mark Ready
                                      </button>
                                    )}
                                    {order.status === 'READY' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(order._id, 'COMPLETED')}
                                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                    {['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(order.status) && (
                                      <span className="text-chocolate/30 text-[10px] font-bold">Processed</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Table Bookings (Chefs) */}
              {activeTab === 'bookings' && (
                <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">dining reservations received</h3>
                    <p className="text-xs text-chocolate/60">Approve or reject reservation requests</p>
                  </div>

                  {chefLoading ? (
                    <p className="text-xs text-chocolate/55">Loading bookings list...</p>
                  ) : sellerBookings.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <CalendarDays className="w-8 h-8 text-primary/30 mx-auto" />
                      <p className="text-xs font-semibold text-chocolate/50">No booking requests received yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-pink-100 text-chocolate/50 font-bold uppercase tracking-wider">
                            <th className="pb-3 px-2">Date</th>
                            <th className="pb-3 px-2">Slot</th>
                            <th className="pb-3 px-2">Customer</th>
                            <th className="pb-3 px-2">Guests</th>
                            <th className="pb-3 px-2">Revenue</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pink-50">
                          {sellerBookings.map((booking) => {
                            const status = BOOKING_STATUS[booking.status] || { label: booking.status, cls: 'text-slate-600 bg-slate-50' };
                            return (
                              <tr key={booking._id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="py-3.5 px-2 font-bold">{booking.date}</td>
                                <td className="py-3.5 px-2 font-semibold text-chocolate/60">{booking.slotType} ({booking.startTime}-{booking.endTime})</td>
                                <td className="py-3.5 px-2 font-semibold">{booking.customerId?.name || 'Customer'}</td>
                                <td className="py-3.5 px-2 font-bold">{booking.numberOfGuests} Guests</td>
                                <td className="py-3.5 px-2 font-bold text-primary">Rs. {booking.totalAmount}</td>
                                <td className="py-3.5 px-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.cls}`}>{status.label}</span>
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  <div className="flex gap-1 justify-end">
                                    {booking.status === 'PENDING' ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateBookingStatus(booking._id, 'accept')}
                                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBookingStatus(booking._id, 'reject')}
                                          className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-chocolate/30 text-[10px] font-bold font-semibold uppercase">{booking.status}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Manage Slots Availability */}
              {activeTab === 'availability' && (
                <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
                  {/* Left Form: Create slot */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-xs h-fit">
                    <h3 className="font-display font-extrabold text-base mb-4">Create Time Slot</h3>
                    <form onSubmit={handleAddSlotSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/70 uppercase tracking-wider">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={slotForm.date}
                          onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/70 uppercase tracking-wider">Slot Session</label>
                        <select
                          name="slotType"
                          value={slotForm.slotType}
                          onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                        >
                          <option value="MORNING">MORNING</option>
                          <option value="AFTERNOON">AFTERNOON</option>
                          <option value="EVENING">EVENING</option>
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/70 uppercase tracking-wider">Start Time</label>
                          <input
                            type="text"
                            name="startTime"
                            value={slotForm.startTime}
                            onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            placeholder="9:00 AM"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-chocolate/70 uppercase tracking-wider">End Time</label>
                          <input
                            type="text"
                            name="endTime"
                            value={slotForm.endTime}
                            onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                            className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                            placeholder="12:00 PM"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/70 uppercase tracking-wider">Max Bookings</label>
                        <input
                          type="number"
                          name="maxBookings"
                          value={slotForm.maxBookings}
                          onChange={(e) => setSlotForm({ ...slotForm, maxBookings: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate"
                          min="1"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={slotSubmitting}
                        className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-all shadow-xs"
                      >
                        {slotSubmitting ? 'Creating Slot...' : 'Create Availability Slot'}
                      </button>
                    </form>
                  </div>

                  {/* Right: Slot lists */}
                  <div className="lg:col-span-2 bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-display font-extrabold text-base">Active Time Slots</h3>
                    {chefLoading ? (
                      <p className="text-xs text-chocolate/55">Loading slots...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-chocolate/55 py-4">No active availability slots found.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {slots.map((slot) => (
                          <div key={slot._id} className="p-4 border border-pink-100 rounded-2xl bg-cream/10 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-bold text-chocolate">{slot.date} • {slot.slotType}</p>
                              <p className="text-[10px] text-chocolate/60 mt-1">{slot.startTime} - {slot.endTime}</p>
                            </div>
                            <div className="mt-4 pt-2 border-t border-pink-100 flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-white border border-pink-100 rounded text-chocolate">
                                Max Capacity: {slot.maxBookings}
                              </span>
                              <span className="text-[9px] font-bold text-primary">{slot.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Chef settings */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-display font-extrabold text-base">Kitchen Profile Settings</h3>
                    <p className="text-xs text-chocolate/60">Configure public chef details visible to customers</p>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Chef / Kitchen Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Public Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Location</label>
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Profile Image URL</label>
                      <input
                        type="text"
                        value={profileForm.profileImage}
                        onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-chocolate/75 uppercase tracking-wider">Kitchen Bio / Specialties description</label>
                      <textarea
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        rows="4"
                        className="w-full rounded-xl border border-pink-100 bg-cream/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-chocolate font-medium"
                        placeholder="Write a warm note for customers visiting your profile page..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full py-3 bg-[#4B254B] hover:bg-[#391B39] text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-all shadow-xs"
                    >
                      {profileSaving ? 'Saving Settings...' : 'Save Kitchen Settings'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useChefDashboardData from './chef/useChefDashboardData';
import NotificationDropdown from '../components/chef/NotificationDropdown';
import { LoadingState, ErrorState } from '../components/chef/FeedbackStates';
import OverviewSection from './chef/sections/OverviewSection';
import OrdersSection from './chef/sections/OrdersSection';
import BookingsSection from './chef/sections/BookingsSection';
import MealsSection from './chef/sections/MealsSection';
import PortfolioSection from './chef/sections/PortfolioSection';
import AvailabilitySection from './chef/sections/AvailabilitySection';
import ReviewsSection from './chef/sections/ReviewsSection';
import NotificationsSection from './chef/sections/NotificationsSection';
import SettingsSection from './chef/sections/SettingsSection';
import HelpSection from './chef/sections/HelpSection';
import ChatSection from './chef/sections/ChatSection';
import { clearAuth } from '../auth/storage';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  Utensils,
  Camera,
  Clock,
  Star,
  Bell,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Store,
  Mail
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
  { id: 'meals', label: 'My Meals', icon: Utensils },
  { id: 'portfolio', label: 'My Portfolio', icon: Camera },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Profile Settings', icon: Settings },
  { id: 'help', label: 'Help & Settings', icon: LifeBuoy }
];

const SECTION_TITLES = {
  overview: 'Kitchen overview',
  orders: 'My orders',
  bookings: 'My bookings',
  meals: 'My meals',
  portfolio: 'My portfolio',
  availability: 'Availability',
  reviews: 'Reviews',
  messages: 'Messages',
  notifications: 'Notifications',
  settings: 'Profile settings',
  help: 'Help & settings'
};

const ChefDashboardPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, orders, bookings, dishes, slots, reviews, notifications, categories, loading, error, refresh } =
    useChefDashboardData();
  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'HOMECHEF' && user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const goTo = (id) => {
    setActive(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSection = () => {
    switch (active) {
      case 'orders':
        return <OrdersSection orders={orders} refresh={refresh} />;
      case 'bookings':
        return <BookingsSection bookings={bookings} refresh={refresh} />;
      case 'meals':
        return <MealsSection dishes={dishes} categories={categories} refresh={refresh} />;
      case 'portfolio':
        return <PortfolioSection user={user} refresh={refresh} />;
      case 'availability':
        return <AvailabilitySection slots={slots} refresh={refresh} />;
      case 'reviews':
        return <ReviewsSection reviews={reviews} />;
      case 'messages':
        return <ChatSection />;
      case 'notifications':
        return <NotificationsSection notifications={notifications} refresh={refresh} />;
      case 'settings':
        return <SettingsSection user={user} refresh={refresh} />;
      case 'help':
        return <HelpSection />;
      default:
        return <OverviewSection user={user} orders={orders} bookings={bookings} dishes={dishes} slots={slots} reviews={reviews} onNavigate={goTo} />;
    }
  };

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-[#EEDDE2] bg-[#FFFDFC]">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-[#F3E3E8] px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="font-cursive text-2xl text-[#381E39]">HomeChef</span>
          <span className="rounded-full border border-[#E25C80]/25 bg-[#FDE7EF] px-2 py-0.5 text-[10px] font-bold text-[#C54567]">
            Chef Studio
          </span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1.5 text-[#76534A] hover:bg-[#FCECEF] lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* Chef mini card */}
      <div className="border-b border-[#F3E3E8] px-6 py-4">
        <div className="flex items-center gap-3">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDE7EF] text-sm font-bold text-[#C45B7C]">
              {user?.name?.charAt(0) || 'C'}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#381E39]">{user?.name || 'Chef'}</p>
            <p className="truncate text-xs text-[#76534A]">{user?.tagline || 'Home chef'}</p>
          </div>
        </div>
        {user && (
          <Link
            to={`/chefs/${user.id}`}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-[#F0DCE4] bg-[#FFF9F5] px-3 py-2 text-[11px] font-semibold text-[#76534A] transition-colors hover:border-[#D8B5C0] hover:text-[#C45B7C]"
          >
            <ExternalLink size={12} /> View public profile
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => goTo(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#4B254B] text-white shadow-sm' : 'text-[#76534A] hover:bg-[#FCECEF] hover:text-[#C45B7C]'
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-[#F3E3E8] p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#76534A] transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#FFF5F7]">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{Sidebar}</div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-[#381E39]/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-fade-up">{Sidebar}</div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[#EEDDE2] bg-[#FFF9F5]/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#76534A] transition-colors hover:bg-[#FCECEF] hover:text-[#C45B7C] lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="font-display text-lg font-bold text-[#381E39]">{SECTION_TITLES[active]}</h1>
                <p className="hidden text-xs text-[#76534A] sm:block">HomeChef chef portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <div className="flex items-center gap-2.5 border-l border-[#F0DCE4] pl-3">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE7EF] text-xs font-bold text-[#C45B7C]">
                    {user?.name?.charAt(0) || 'C'}
                  </span>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-tight text-[#381E39]">{user?.name?.split(' ')[0] || 'Chef'}</p>
                  <p className="text-[11px] leading-tight text-[#A98990]">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {loading ? (
              <LoadingState label="Loading your kitchen…" />
            ) : error && !user ? (
              <ErrorState message={error} />
            ) : (
              renderSection()
            )}
          </div>
        </main>

        <footer className="border-t border-[#F0DCE4] bg-[#FFFDFC] px-6 py-4">
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#A98990]">
            <Store size={12} className="text-[#C45B7C]" /> HomeChef chef portal — cook, book, and delight.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ChefDashboardPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomerDashboardData from './useCustomerDashboardData';
import NotificationDropdown from '../../components/chef/NotificationDropdown';
import { LoadingState, ErrorState } from '../../components/chef/FeedbackStates';
import OverviewSection from './sections/OverviewSection';
import FindChefsSection from './sections/FindChefsSection';
import SearchResultsSection from './sections/SearchResultsSection';
import BookingsSection from './sections/BookingsSection';
import OrdersSection from './sections/OrdersSection';
import FavoritesSection from './sections/FavoritesSection';
import ProfileSection from './sections/ProfileSection';
import HelpSection from './sections/HelpSection';
import ChatSection from './sections/ChatSection';
import BookingModal from '../../components/customer/BookingModal';
import DishModal from '../../components/customer/DishModal';
import { clearAuth } from '../../auth/storage';
import {
  LayoutDashboard,
  ChefHat,
  CalendarDays,
  ShoppingBag,
  Heart,
  User,
  LifeBuoy,
  MessageSquareText,
  LogOut,
  Menu,
  X,
  Search,
  Sparkles,
  CheckCircle,
  XCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'find', label: 'Find Chefs', icon: ChefHat },
  { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'help', label: 'Help & Settings', icon: LifeBuoy }
];

const SECTION_TITLES = {
  overview: 'Welcome',
  find: 'Find Chefs',
  search: 'Search',
  bookings: 'My Bookings',
  orders: 'My Orders',
  messages: 'Messages',
  favorites: 'Favorites',
  profile: 'My Profile',
  help: 'Help & Settings'
};

const CustomerDashboardPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const {
    user,
    chefs,
    nearbyChefs,
    dishes,
    popularDishes,
    categories,
    bookings,
    orders,
    favorites,
    favoriteChefIds,
    favoriteDishIds,
    loading,
    error,
    refresh,
    toggleFavorite
  } = useCustomerDashboardData();

  const [bookChef, setBookChef] = useState(null);
  const [openDish, setOpenDish] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user) {
      if (user.role === 'HOMECHEF') navigate('/chef/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const showToast = (message, kind = 'success') => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const goTo = (id) => {
    setActive(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setSearchInput(trimmed);
    goTo('search');
  };

  const handleToggleFavorite = async (targetType, targetId) => {
    try {
      const favorited = await toggleFavorite(targetType, targetId);
      showToast(favorited ? 'Saved to favorites.' : 'Removed from favorites.');
    } catch (err) {
      if (err?.message === 'not-authenticated') {
        navigate('/login');
      } else {
        setToast({ message: err.response?.data?.message || 'Unable to update favorites.', kind: 'error' });
        window.setTimeout(() => setToast(null), 4000);
      }
    }
  };

  const renderSection = () => {
    switch (active) {
      case 'find':
        return (
          <FindChefsSection
            chefs={chefs}
            favoriteChefIds={favoriteChefIds}
            onToggleFavorite={handleToggleFavorite}
            onBookChef={setBookChef}
          />
        );
      case 'search':
        return (
          <SearchResultsSection
            query={searchQuery}
            favoriteChefIds={favoriteChefIds}
            favoriteDishIds={favoriteDishIds}
            onToggleFavorite={handleToggleFavorite}
            onBookChef={setBookChef}
            onOpenDish={setOpenDish}
          />
        );
      case 'bookings':
        return <BookingsSection bookings={bookings} refresh={refresh} />;
      case 'orders':
        return <OrdersSection orders={orders} refresh={refresh} />;
      case 'messages':
        return <ChatSection />;
      case 'favorites':
        return (
          <FavoritesSection
            favorites={favorites}
            favoriteChefIds={favoriteChefIds}
            favoriteDishIds={favoriteDishIds}
            onToggleFavorite={handleToggleFavorite}
            onBookChef={setBookChef}
            onOpenDish={setOpenDish}
            onNavigate={goTo}
          />
        );
      case 'profile':
        return <ProfileSection user={user} onUserUpdated={refresh} />;
      case 'help':
        return <HelpSection />;
      default:
        return (
          <OverviewSection
            user={user}
            chefs={chefs}
            nearbyChefs={nearbyChefs}
            dishes={dishes}
            popularDishes={popularDishes}
            categories={categories}
            bookings={bookings}
            orders={orders}
            favoriteChefIds={favoriteChefIds}
            favoriteDishIds={favoriteDishIds}
            onToggleFavorite={handleToggleFavorite}
            onBookChef={setBookChef}
            onOpenDish={setOpenDish}
            onSearch={doSearch}
          />
        );
    }
  };

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-[#EEDDE2] bg-[#FFFDFC]">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-[#F3E3E8] px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="font-cursive text-2xl text-[#381E39]">HomeChef</span>
          <span className="rounded-full border border-[#E25C80]/25 bg-[#FDE7EF] px-2 py-0.5 text-[10px] font-bold text-[#C54567]">
            Customer
          </span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1.5 text-[#76534A] hover:bg-[#FCECEF] lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* Customer mini card */}
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
            <p className="truncate text-sm font-semibold text-[#381E39]">{user?.name || 'Food lover'}</p>
            <p className="truncate text-xs text-[#76534A]">{user?.location?.address || 'Home chef foodie'}</p>
          </div>
        </div>
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
                <p className="hidden text-xs text-[#76534A] sm:block">HomeChef customer portal</p>
              </div>
            </div>

            {/* Search (desktop) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                doSearch(searchInput);
              }}
              className="relative hidden flex-1 max-w-md md:block"
            >
              <Search className="absolute left-4 top-3 h-4 w-4 text-[#A98990]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search chefs, dishes, cuisines…"
                className="w-full rounded-full border border-[#EAD3DC] bg-white py-2 pl-10 pr-4 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
              />
            </form>

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
                  <p className="text-sm font-semibold leading-tight text-[#381E39]">{user?.name?.split(' ')[0] || 'Guest'}</p>
                  <p className="text-[11px] leading-tight text-[#A98990]">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search (mobile) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSearch(searchInput);
            }}
            className="relative border-t border-[#F3E3E8] px-4 py-2.5 md:hidden"
          >
            <Search className="absolute left-8 top-[22px] h-4 w-4 text-[#A98990]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search chefs, dishes, cuisines…"
              className="w-full rounded-full border border-[#EAD3DC] bg-white py-2 pl-10 pr-4 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
            />
          </form>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {loading ? (
              <LoadingState label="Setting the table…" />
            ) : error && !user ? (
              <ErrorState message={error} />
            ) : (
              renderSection()
            )}
          </div>
        </main>

        <footer className="border-t border-[#F0DCE4] bg-[#FFFDFC] px-6 py-4">
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#A98990]">
            <Sparkles size={12} className="text-[#C45B7C]" /> HomeChef customer portal — order, book, and savour.
          </p>
        </footer>
      </div>

      {/* Toasts */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-fade-up">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {toast.kind === 'error' ? <XCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Modals */}
      {bookChef && (
        <BookingModal
          chef={bookChef}
          onClose={() => setBookChef(null)}
          onBooked={(msg) => {
            showToast(msg);
            refresh();
          }}
        />
      )}
      {openDish && (
        <DishModal
          dish={openDish}
          onClose={() => setOpenDish(null)}
          onOrdered={(msg) => {
            showToast(msg);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboardPage;

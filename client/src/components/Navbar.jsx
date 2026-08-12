import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('homechef_user');
    setUser(savedUser ? JSON.parse(savedUser) : null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('homechef_token');
    localStorage.removeItem('homechef_user');
    setUser(null);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/food?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const accountLink = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  const accountLabel =
    user?.role === 'ADMIN'
      ? 'Admin Panel'
      : user?.role === 'HOMECHEF'
        ? 'Dashboard'
        : 'Become a Chef';

  return (
    <header className="bg-cream/90 backdrop-blur-md border-b border-pink-100/70 sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo in Cursive */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-cursive text-3xl text-chocolate hover:text-primary transition-colors">
            HomeChef
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-chocolate">
          {[
            { name: 'Home', path: '/' },
            { name: 'Explore Food', path: '/food' },
            { name: 'Home Chefs', path: '/chefs' },
            { name: 'Categories', path: '/categories' }
          ].map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative px-4 py-1.5 rounded-full transition-all ${
                isActive(link.path)
                  ? 'bg-primary text-white shadow-xs'
                  : 'hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Quick Search */}
          <button
            onClick={() => setShowSearchModal(!showSearchModal)}
            aria-label="Search"
            className="p-2 text-chocolate hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-chocolate/80">Hi, {user.name?.split(' ')[0]}</span>
              <Link
                to={accountLink}
                className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-xs"
              >
                {accountLabel}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-chocolate/60 hover:text-chocolate transition-colors border border-chocolate/20 px-3 py-1.5 rounded-full hover:bg-chocolate/5"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-bold text-chocolate hover:text-primary transition-colors border border-chocolate/20 px-4 py-2 rounded-full hover:bg-chocolate/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-xs"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu controls */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setShowSearchModal(!showSearchModal)}
            aria-label="Search"
            className="p-2 text-chocolate hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-chocolate hover:text-primary rounded-full transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-cream py-4 px-4 space-y-3 shadow-inner">
          <div className="flex flex-col gap-2">
            {[
              { name: 'Home', path: '/' },
              { name: 'Explore Food', path: '/food' },
              { name: 'Home Chefs', path: '/chefs' },
              { name: 'Categories', path: '/categories' }
            ].map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-chocolate hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <hr className="border-pink-100" />

          <div className="pt-2 flex items-center justify-between">
            {user ? (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-bold text-chocolate">Hi, {user.name}</span>
                <div className="flex gap-2">
                  <Link
                    to={accountLink}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-full transition-all"
                  >
                    {accountLabel}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-chocolate/60 hover:text-chocolate transition-colors border border-chocolate/20 px-3 py-1.5 rounded-full"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex w-full gap-2 justify-end">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-chocolate border border-chocolate/20 rounded-full text-center flex-1"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-full text-center flex-1"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Quick Search Bar Modal */}
      {showSearchModal && (
        <div className="border-t border-pink-100/50 bg-pink-50/70 py-3.5 px-4 sm:px-8 animate-fade-up">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-chocolate/50 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search homemade dishes, cuisines, chefs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-chocolate placeholder-chocolate/40"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-full hover:bg-primary-hover"
            >
              Search
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Navbar;

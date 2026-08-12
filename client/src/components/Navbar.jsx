import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    const savedUser = localStorage.getItem('homechef_user');

    setUser(savedUser ? JSON.parse(savedUser) : null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem('homechef_token');
    localStorage.removeItem('homechef_user');

    setUser(null);
    navigate('/');
  };

  // =========================================================
  // ACTIVE LINK
  // =========================================================

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }

    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }

    return false;
  };

  // =========================================================
  // ACCOUNT
  // =========================================================

  const accountLink =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : '/dashboard';

  const accountLabel =
    user?.role === 'ADMIN'
      ? 'Admin Panel'
      : user?.role === 'HOMECHEF'
        ? 'Dashboard'
        : 'Become a Chef';

  // =========================================================
  // NAVIGATION LINKS
  // =========================================================

  const desktopLinks = [
    {
      name: 'Home',
      path: '/',
    },
    {
      name: 'About Us',
      path: '/#about',
    },
    {
      name: 'Our Chefs',
      path: '/chefs',
    },
    {
      name: 'Become a Chef',
      path: '/categories',
    },
  ];

  const mobileLinks = [
    {
      name: 'Home',
      path: '/',
    },
    {
      name: 'Explore Food',
      path: '/food',
    },
    {
      name: 'Our Chefs',
      path: '/chefs',
    },
    {
      name: 'Become a Chef',
      path: '/categories',
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#EEDDE2] bg-[#FFF9F5]/95 backdrop-blur-md">

      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* ==================================================
            LOGO
        ================================================== */}

        <Link
          to="/"
          className="group flex items-center"
        >
          <span className="font-cursive text-[2rem] text-chocolate transition-colors duration-200 group-hover:text-[#C45B7C]">
            HomeChef
          </span>
        </Link>


        {/* ==================================================
            DESKTOP NAVIGATION
        ================================================== */}

        <nav className="hidden items-center gap-1 md:flex">

          {desktopLinks.map((link) => {
            const isHash = link.path.startsWith('/#');

            if (isHash) {
              const hashId = link.path.slice(2);

              return (
                <button
                  key={link.name}
                  onClick={() => {
                    if (location.pathname === '/') {
                      document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(link.path);
                    }
                  }}
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition-all
                    duration-200
                    text-[#76534A] hover:bg-[#FCECEF] hover:text-[#C45B7C]
                  `}
                >
                  {link.name}
                </button>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-medium
                  transition-all
                  duration-200
                  ${
                    isActive(link.path)
                      ? 'bg-[#F4D8E1] text-[#A75D7A]'
                      : 'text-[#76534A] hover:bg-[#FCECEF] hover:text-[#C45B7C]'
                  }
                `}
              >
                {link.name}
              </Link>
            );
          })}

        </nav>


        {/* ==================================================
            DESKTOP RIGHT ACTIONS
        ================================================== */}

        <div className="hidden items-center gap-3 md:flex">

          {/* USER LOGGED IN */}

          {user ? (

            <div className="flex items-center gap-3">

              <span className="hidden text-xs font-medium text-[#76534A] lg:block">
                Hi, {user.name?.split(' ')[0]}
              </span>


              <Link
                to={accountLink}
                className="
                  rounded-full
                  bg-[#D96F91]
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  transition-all
                  duration-200
                  hover:bg-[#C45B7C]
                "
              >
                {accountLabel}
              </Link>


              <button
                onClick={handleLogout}
                className="
                  rounded-full
                  border
                  border-[#E5D1D6]
                  px-3.5
                  py-2
                  text-xs
                  font-medium
                  text-[#76534A]
                  transition-all
                  duration-200
                  hover:border-[#D8B5C0]
                  hover:bg-[#FCECEF]
                  hover:text-[#C45B7C]
                "
              >
                Logout
              </button>

            </div>

          ) : (

            /* USER NOT LOGGED IN */

            <div className="flex items-center gap-2">

              <Link
                to="/login"
                className="
                  rounded-full
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-[#76534A]
                  transition-colors
                  duration-200
                  hover:text-[#C45B7C]
                "
              >
                Login
              </Link>


              <Link
                to="/register"
                className="
                  rounded-full
                  bg-[#D96F91]
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  transition-all
                  duration-200
                  hover:bg-[#C45B7C]
                "
              >
                Sign up
              </Link>

            </div>

          )}

        </div>


        {/* ==================================================
            MOBILE CONTROLS
        ================================================== */}

        <div className="flex items-center gap-1 md:hidden">

          {/* Mobile Menu */}

          <button
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            aria-label="Menu"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-chocolate
              transition-colors
              hover:bg-[#FCECEF]
              hover:text-[#C45B7C]
            "
          >
            {mobileMenuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

        </div>

      </div>


      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenuOpen && (

        <div className="border-t border-[#EEDDE2] bg-[#FFF9F5] md:hidden">

          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">

            {/* LINKS */}

            <nav className="flex flex-col gap-1">

              {mobileLinks.map((link) => (

                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={`
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition-all
                    ${
                      isActive(link.path)
                        ? 'bg-[#F4D8E1] text-[#A75D7A]'
                        : 'text-[#76534A] hover:bg-[#FCECEF] hover:text-[#C45B7C]'
                    }
                  `}
                >
                  {link.name}
                </Link>

              ))}

            </nav>


            {/* DIVIDER */}

            <div className="my-4 border-t border-[#EEDDE2]" />


            {/* ACCOUNT */}

            {user ? (

              <div className="flex items-center justify-between gap-3">

                <span className="text-xs font-semibold text-chocolate">
                  Hi, {user.name}
                </span>

                <div className="flex gap-2">

                  <Link
                    to={accountLink}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="
                      rounded-full
                      bg-[#D96F91]
                      px-4
                      py-2
                      text-xs
                      font-semibold
                      text-white
                    "
                  >
                    {accountLabel}
                  </Link>


                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="
                      rounded-full
                      border
                      border-[#E5D1D6]
                      px-4
                      py-2
                      text-xs
                      font-semibold
                      text-[#76534A]
                    "
                  >
                    Logout
                  </button>

                </div>

              </div>

            ) : (

              <div className="flex gap-2">

                <Link
                  to="/login"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="
                    flex-1
                    rounded-full
                    border
                    border-[#E5D1D6]
                    py-2.5
                    text-center
                    text-xs
                    font-semibold
                    text-[#76534A]
                  "
                >
                  Login
                </Link>


                <Link
                  to="/register"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="
                    flex-1
                    rounded-full
                    bg-[#D96F91]
                    py-2.5
                    text-center
                    text-xs
                    font-semibold
                    text-white
                  "
                >
                  Sign up
                </Link>

              </div>

            )}

          </div>

        </div>

      )}

    </header>
  );
};

export default Navbar;
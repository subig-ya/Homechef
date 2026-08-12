import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  Instagram,
  Facebook,
  Mail,
} from 'lucide-react';

const Footer = () => {
  const isLoggedIn = !!localStorage.getItem('homechef_token');

  return (
    <footer className="border-t border-[#F1DCE3] bg-[#FFF1F5] text-chocolate">

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">

        <div className="lg:col-span-2">

          <Link
            to="/"
            className="group flex w-fit items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4D3DE] text-[#C45B7C] transition-colors group-hover:bg-[#D96F91] group-hover:text-white">
              <ChefHat size={21} strokeWidth={1.8} />
            </div>

            <span className="font-cursive text-[2rem] leading-none text-chocolate transition-colors group-hover:text-[#D96F91]">
              HomeChef
            </span>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-[#876B63]">
            Bringing passionate local chefs and food lovers together
            to create memorable dining experiences, one meal at a time.
          </p>

          <div className="mt-6 flex items-center gap-3">

            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#C45B7C] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D96F91] hover:text-white"
            >
              <Instagram size={16} />
            </a>

            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#C45B7C] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D96F91] hover:text-white"
            >
              <Facebook size={16} />
            </a>

            <a
              href="#"
              aria-label="Email"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#C45B7C] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D96F91] hover:text-white"
            >
              <Mail size={16} />
            </a>

          </div>

        </div>

        <div>

          <h3 className="text-sm font-semibold text-chocolate">
            Explore
          </h3>

          <div className="mt-5 flex flex-col gap-3">

            <a
              href="#home"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              Home
            </a>

            <a
              href="#chefs"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              Find Chefs
            </a>

            <a
              href="#about"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              About Us
            </a>

            <a
              href="#why-us"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              Why Choose Us
            </a>

          </div>

        </div>

        <div>

          <h3 className="text-sm font-semibold text-chocolate">
            Account
          </h3>

          <div className="mt-5 flex flex-col gap-3">

            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
                >
                  Create Account
                </Link>
              </>
            )}

            <Link
              to="/food"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              Browse Meals
            </Link>

            <Link
              to="/become-chef"
              className="w-fit text-sm text-[#876B63] transition-colors hover:text-[#D96F91]"
            >
              Become a Chef
            </Link>

          </div>

        </div>

      </div>

      <div className="border-t border-[#EED9E0]">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-[#A58A82] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">

          <p>
            © {new Date().getFullYear()} HomeChef. All rights reserved.
          </p>

          <p>
            Made for people who love good food.
          </p>

        </div>

      </div>

    </footer>
  );
};

export default Footer;
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#FAF5F7] border-t border-pink-100/60 pt-14 pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-tight text-[#3A233C]">
                Home<span className="text-[#4A254B]">Chef</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              © {new Date().getFullYear()} HomeChef. Artisanal meals for your community.
            </p>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-2 text-sm">
            <div>
              <Link to="/about" className="hover:text-[#4A254B] transition-colors text-slate-600">
                About
              </Link>
            </div>
            <div>
              <Link to="/food" className="font-semibold text-[#4A254B] hover:underline">
                Explore Food
              </Link>
            </div>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-2 text-sm">
            <div>
              <Link to="/chefs" className="hover:text-[#4A254B] transition-colors text-slate-600">
                HomeChefs
              </Link>
            </div>
            <div>
              <Link to="/help" className="hover:text-[#4A254B] transition-colors text-slate-600">
                Help
              </Link>
            </div>
          </div>

          {/* Nav Column 3 */}
          <div className="space-y-2 text-sm">
            <div>
              <Link to="/contact" className="hover:text-[#4A254B] transition-colors text-slate-600">
                Contact
              </Link>
            </div>
            <div>
              <Link to="/privacy" className="hover:text-[#4A254B] transition-colors text-slate-600">
                Privacy
              </Link>
            </div>
            <div>
              <Link to="/terms" className="hover:text-[#4A254B] transition-colors text-slate-600">
                Terms
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

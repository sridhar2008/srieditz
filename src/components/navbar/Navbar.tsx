import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudioLogo } from '../common/StudioLogo';
import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Services', to: '/services' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Portfolio', to: '/portfolio' },
    { label: 'Reviews', to: '/reviews' },
    { label: 'Contact', to: '/contact' },
  ];

  const handlePrimaryClick = () => {
    setMobileOpen(false);
    if (!user) {
      navigate('/login');
    } else if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#070709]/92 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <Link to="/" className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg">
          <StudioLogo size="sm" showWordmark />
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b ${
                  active
                    ? 'text-[#D4AF37] border-[#D4AF37]'
                    : 'text-zinc-300 border-transparent hover:text-white hover:border-zinc-600'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action (+ notification bell only when signed in) */}
        <div className="flex items-center gap-3 shrink-0">
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {!user ? 'Sign In' : isAdmin ? 'Admin Panel' : 'Dashboard'}
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-zinc-800 text-zinc-200 hover:border-zinc-700 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#0b0b0f] px-4 py-4 space-y-2">
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            About Studio
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-900"
            >
              {link.label}
            </Link>
          ))}
          {!isAdmin && (
            <Link
              to="/request-edit"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#D4AF37] hover:bg-zinc-900"
            >
              Request an Edit
            </Link>
          )}
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="w-full mt-2 py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold cursor-pointer"
          >
            {!user ? 'Sign In' : isAdmin ? 'Admin Panel' : 'My Dashboard'}
          </button>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

export default function LandingFooter() {
  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/FeastandFeteEvents',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/feastandfeteevents/',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'Viber',
      href: 'viber://chat?number=%2B639171234567',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19.38 4.62C17.42 2.66 14.81 1.58 12.04 1.58c-5.78 0-10.48 4.7-10.48 10.48 0 1.84.48 3.63 1.39 5.21L1.5 22.5l5.42-1.42c1.52.83 3.24 1.27 5.02 1.27h.01c5.78 0 10.48-4.7 10.48-10.48 0-2.77-1.08-5.38-3.05-7.25zM12.04 20.6c-1.57 0-3.1-.42-4.44-1.22l-.32-.19-3.23.85.86-3.15-.21-.33a8.72 8.72 0 0 1-1.34-4.51c0-4.83 3.93-8.76 8.76-8.76 2.34 0 4.54.91 6.19 2.56 1.65 1.65 2.56 3.85 2.56 6.19 0 4.83-3.93 8.76-8.83 8.76z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="footer-v2-root relative overflow-hidden">
      {/* Top accent line */}
      <div className="footer-v2-top-line h-px w-full" />
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-12">
        {/* Main row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
          {/* Brand block */}
          <div className="max-w-xs space-y-4">
            <div className="flex items-center gap-3">
              <AppLogo size={36} />
              <div>
                <p className="font-display text-lg font-black text-white leading-none">Feast & Fête</p>
                <p className="text-xs text-white/40 mt-0.5">Premium Filipino Catering</p>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Authentic Filipino food trays for every celebration. Serving Metro Manila with love and flavor since 2022.
            </p>
            
            {/* Social */}
            <div className="flex gap-2">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="footer-v2-social w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16">
            <div className="space-y-4">
              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Menu</p>
              <ul className="space-y-2.5">
                {['Beef Trays', 'Pork Trays', 'Chicken Trays', 'Seafood', 'Desserts', 'Packages']?.map(item => (
                  <li key={item}>
                    <Link href="/menu-browse-screen" className="text-sm text-white/40 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Account</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Create Account', href: '/sign-up-login-screen' },
                  { label: 'Sign In', href: '/sign-up-login-screen' },
                  { label: 'My Orders', href: '/sign-up-login-screen' },
                  { label: 'My Profile', href: '/sign-up-login-screen' },
                ]?.map(item => (
                  <li key={item?.label}>
                    <Link href={item?.href} className="text-sm text-white/40 hover:text-white transition-colors">
                      {item?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Contact</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Icon name="PhoneIcon" size={13} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/40">0917-123-4567</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="EnvelopeIcon" size={13} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/40">feastandfete@gmail.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="ClockIcon" size={13} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/40">Cut-off: 12 noon daily</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="MapPinIcon" size={13} className="text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/40">Pick-up: 9 AM – 5 PM</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-v2-bottom-bar mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">© 2026 Feast & Fête. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
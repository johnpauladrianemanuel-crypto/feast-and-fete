import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

export default function LandingFooter() {
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
              {[
                { label: 'FB', name: 'Facebook' },
                { label: 'IG', name: 'Instagram' },
                { label: 'VB', name: 'Viber' },
              ]?.map(s => (
                <a
                  key={s?.name}
                  href="#"
                  aria-label={s?.name}
                  className="footer-v2-social w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white/50 transition-colors"
                >
                  {s?.label}
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
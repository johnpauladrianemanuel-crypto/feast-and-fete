'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/app/sign-up-login-screen/components/AuthCard';
import { ADMIN_PASSWORD } from '@/app/sign-up-login-screen/components/adminPassword';
import WelcomeSplash from '@/components/WelcomeSplash';

export default function SignUpLoginClient() {
  const router = useRouter();

  // State for Welcome Splash
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Direct Password Validation Handler
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (adminPassword === ADMIN_PASSWORD) {
      document.cookie = "admin_session=true; path=/; max-age=28800; SameSite=Lax";
      setIsAdminModalOpen(false);
      router.push('/admin-dashboard');
    } else {
      setError('Incorrect password. Please try again.');
    }

    setLoading(false);
  };

  if (welcomeUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <WelcomeSplash
          userName={welcomeUser}
          onComplete={() => {
            try {
              router.push('/');
            } catch {
              window.location.href = '/';
            }
          }}
        />
      </div>
    );
  }

  return (
    // lg:flex-row-reverse swaps the position: Auth Card goes to the LEFT, Brand Panel goes to the RIGHT
    <div className="min-h-screen flex flex-col lg:flex-row-reverse auth-page-root" style={{ background: 'var(--background)' }}>
      
      {/* Brand panel (Now on the RIGHT side on desktop) */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden auth-brand-panel"
        style={{ background: 'linear-gradient(160deg, #7B1C2E 0%, #5A1020 45%, #3D0A14 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 auth-float-a"
          style={{ background: 'radial-gradient(circle, #D4A017 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full opacity-10 auth-float-b"
          style={{ background: 'radial-gradient(circle, #D4A017 0%, transparent 70%)', transform: 'translate(-40%, 0)' }}
        />

        {/* Top: Logo */}
        <div className="flex items-center gap-3 relative z-10 auth-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-10 h-10 gradient-gold rounded-xl flex items-center justify-center" style={{ boxShadow: '0 4px 12px rgba(212,160,23,0.4)' }}>
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white leading-none">Feast & Fête</p>
            <p className="text-xs text-white/50 mt-0.5">Filipino Food Tray Catering</p>
          </div>
        </div>

        {/* Middle: Hero image grid and copy */}
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                src: "https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png",
                alt: 'Lechon Kawali crispy pork belly Filipino food tray',
                h: 'h-36',
                delay: '0.3s'
              },
              {
                src: "https://img.rocket.new/generatedImages/rocket_gen_img_14a51a9d3-1772868034765.png",
                alt: 'Chicken Inasal Bacolod grilled chicken tray',
                h: 'h-36',
                delay: '0.45s'
              },
              {
                src: "https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png",
                alt: 'Leche Flan Filipino steamed custard dessert',
                h: 'h-36',
                delay: '0.6s'
              },
              {
                src: "https://images.unsplash.com/photo-1630393617712-489929103aae?auto=format&fit=crop&w=800&q=80",
                alt: 'Festive Filipino food spread for a celebration',
                h: 'h-36',
                delay: '0.75s'
              }
            ].map((img, i) => (
              <div
                key={`auth-img-${i}`}
                className={`rounded-xl overflow-hidden ${img.h} auth-img-pop`}
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animationDelay: img.delay }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>

          <div className="auth-fade-up" style={{ animationDelay: '0.85s' }}>
            <h2 className="font-display text-3xl font-bold text-white leading-tight">
              Your Celebration,<br />
              <span className="text-secondary">Perfectly Catered</span>
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              Pre-order authentic Filipino food trays for pickup or delivery. No more missed calls — order online, track your feast in real time.
            </p>
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="flex items-center gap-6 relative z-10">
          {[
            { value: '500+', label: 'Happy customers', delay: '1s' },
            { value: '22', label: 'Menu items', delay: '1.1s' },
            { value: '4.9★', label: 'Average rating', delay: '1.2s' }
          ].map((stat) => (
            <div
              key={`auth-stat-${stat.label}`}
              className="auth-fade-up"
              style={{ animationDelay: stat.delay }}
            >
              <p className="font-display text-xl font-bold text-secondary">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Card Panel (Now on the LEFT side on desktop) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 auth-right-panel relative">
        <AuthCard onSuccess={(name) => setWelcomeUser(name)} />

        {/* Admin Link at Bottom */}
        <button
          onClick={() => setIsAdminModalOpen(true)}
          className="mt-6 text-xs text-stone-500 hover:text-stone-700 underline transition"
        >
          Are you the admin? Go to Admin Panel →
        </button>

        {/* Admin Access Modal */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-stone-200 text-stone-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setError('');
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-900 font-bold">
                  🔒
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Admin Access</h2>
                  <p className="text-xs text-stone-500">Enter admin password to continue</p>
                </div>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {error && (
                  <div className="text-red-600 text-xs bg-red-50 border border-red-200 p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Admin password"
                    className="w-full p-3.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-800 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#7B1C2E] hover:bg-[#5A1020] text-white font-medium py-3.5 rounded-xl transition disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Verifying...' : 'Enter Admin Panel'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setError('');
                  }}
                  className="w-full text-center text-xs text-stone-500 hover:text-stone-700 pt-1 transition"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
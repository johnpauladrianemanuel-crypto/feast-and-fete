'use client';

import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Icon from '@/components/ui/AppIcon';
import { ADMIN_PASSWORD } from './adminPassword';
import { useRouter } from 'next/navigation';

interface AuthCardProps {
  onSuccess?: (userName: string) => void;
}

export default function AuthCard({ onSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [prevTab, setPrevTab] = useState<'login' | 'register' | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [adminGateVisible, setAdminGateVisible] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeAdminTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef1 = useRef<number | null>(null);
  const rafRef2 = useRef<number | null>(null);

  const router = useRouter();

  // Cleanup all active timeouts and RAFs on unmount
  useEffect(() => {
    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
      if (closeAdminTimeout.current) clearTimeout(closeAdminTimeout.current);
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
      if (rafRef1.current) cancelAnimationFrame(rafRef1.current);
      if (rafRef2.current) cancelAnimationFrame(rafRef2.current);
    };
  }, []);

  // Animate tab switch
  function switchTab(tab: 'login' | 'register') {
    if (tab === activeTab || animating) return;
    setPrevTab(activeTab);
    setAnimating(true);
    if (animTimeout.current) clearTimeout(animTimeout.current);
    animTimeout.current = setTimeout(() => {
      setActiveTab(tab);
      setAnimating(false);
      setPrevTab(null);
    }, 220);
  }

  // Modal open/close with animation
  function openAdminGate() {
    if (closeAdminTimeout.current) clearTimeout(closeAdminTimeout.current);
    setShowAdminGate(true);
    setAdminPassword('');
    setAdminPasswordError('');
    
    if (rafRef1.current) cancelAnimationFrame(rafRef1.current);
    if (rafRef2.current) cancelAnimationFrame(rafRef2.current);

    rafRef1.current = requestAnimationFrame(() => {
      rafRef2.current = requestAnimationFrame(() => setAdminGateVisible(true));
    });
  }

  function closeAdminGate() {
    setAdminGateVisible(false);
    if (closeAdminTimeout.current) clearTimeout(closeAdminTimeout.current);
    closeAdminTimeout.current = setTimeout(() => setShowAdminGate(false), 280);
  }

  function handleAdminAccess(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminPasswordError('');
      // Set session cookie for admin protection
      document.cookie = "admin_session=true; path=/; max-age=28800; SameSite=Lax";
      window.location.href = '/admin-dashboard';
    } else {
      setAdminPasswordError('Incorrect password. Please try again.');
    }
  }

  // Common successful auth handler
  function handleAuthSuccess(userName: string) {
    if (onSuccess) {
      onSuccess(userName);
    }
  }

  // Direction: login→register = slide left, register→login = slide right
  const direction = prevTab === 'login' ? -1 : 1;

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      {/* 1. DESKTOP & MOBILE BRAND HEADING (Fixed Position Above Card) */}
      <div className="text-center mb-8 animate-card-in">
        <span className="text-xs font-bold tracking-widest text-[#9B2C3E] uppercase">
      
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#541212] mt-1 tracking-tight">
         
        </h1>
      </div>

      {/* 2. CARD CONTAINER */}
      <div
        className="w-full bg-card rounded-3xl overflow-hidden animate-card-in"
        style={{ boxShadow: '0 20px 60px rgba(123,28,46,0.15), 0 8px 20px rgba(0,0,0,0.1)' }}
      >
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          {(['login', 'register'] as const).map(tab => (
            <button
              key={`tab-${tab}`}
              type="button"
              onClick={() => switchTab(tab)}
              className="flex-1 py-4 text-sm font-semibold relative overflow-hidden"
              style={{
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                background: activeTab === tab ? 'rgba(123,28,46,0.04)' : 'transparent',
                transition: 'color 0.25s ease, background 0.25s ease',
              }}
            >
              {tab === 'login' ? 'Sign In' : 'Create Account'}
              {/* Animated underline indicator */}
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 gradient-brand"
                style={{
                  transform: activeTab === tab ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: activeTab === tab ? (tab === 'login' ? 'left' : 'right') : 'center',
                  transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Form content with slide transition */}
        <div className="p-6 lg:p-8 overflow-hidden relative">
          <div
            style={{
              transform: animating
                ? `translateX(${direction * 32}px)`
                : 'translateX(0)',
              opacity: animating ? 0 : 1,
              transition: animating
                ? 'none'
                : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease',
            }}
          >
            {activeTab === 'login' ? (
              <LoginForm
                onSwitchToRegister={() => switchTab('register')}
                onSuccess={handleAuthSuccess}
              />
            ) : (
              <RegisterForm
                onSwitchToLogin={() => switchTab('login')}
                onSuccess={handleAuthSuccess}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. ADMIN LINK */}
      <p className="text-center text-xs text-muted-foreground mt-6 animate-card-in" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
        Are you the admin?{' '}
        <button
          type="button"
          onClick={openAdminGate}
          className="text-primary font-semibold hover:underline transition-all"
        >
          Go to Admin Panel →
        </button>
      </p>

      {/* Admin Password Gate Modal */}
      {showAdminGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: adminGateVisible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
            transition: 'background 0.28s ease',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeAdminGate(); }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transform: adminGateVisible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(24px)',
              opacity: adminGateVisible ? 1 : 0,
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
                  <Icon name="LockClosedIcon" size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Admin Access</p>
                  <p className="text-xs text-muted-foreground">Enter admin password to continue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAdminGate}
                className="text-muted-foreground hover:text-foreground transition duration-200 hover:rotate-90"
                aria-label="Close"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {/* Password field */}
            <form onSubmit={handleAdminAccess} className="space-y-3">
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => { setAdminPassword(e.target.value); setAdminPasswordError(''); }}
                  className="input-field pr-10"
                  placeholder="Admin password"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showAdminPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
                </button>
              </div>

              {adminPasswordError && (
                <p
                  className="text-xs text-error flex items-center gap-1"
                  style={{ animation: 'shake 0.35s cubic-bezier(0.36,0.07,0.19,0.97)' }}
                >
                  <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
                  {adminPasswordError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ transition: 'opacity 0.2s, transform 0.15s' }}
              >
                Enter Admin Panel
              </button>

              <button
                type="button"
                onClick={closeAdminGate}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .animate-card-in {
          animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useRouter } from 'next/navigation';

interface AuthCardProps {
  onSuccess?: (userName: string) => void;
}

export default function AuthCard({ onSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [prevTab, setPrevTab] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [animating, setAnimating] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Cleanup active timeouts on unmount
  useEffect(() => {
    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
    };
  }, []);

  // Animate tab switch
  function switchTab(tab: 'login' | 'register' | 'forgot') {
    if (tab === activeTab || animating) return;
    setPrevTab(activeTab);
    setAnimating(true);
    setResetSent(false); // Reset feedback state when switching
    if (animTimeout.current) clearTimeout(animTimeout.current);
    animTimeout.current = setTimeout(() => {
      setActiveTab(tab);
      setAnimating(false);
      setPrevTab(null);
    }, 220);
  }

  // Handle password reset submit
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetLoading(true);
    // Simulate sending password reset link
    setTimeout(() => {
      setResetLoading(false);
      setResetSent(true);
    }, 1000);
  };

  // Common successful auth handler
  function handleAuthSuccess(userName: string) {
    if (onSuccess) {
      onSuccess(userName);
    }
  }

  // Direction: slide animation orientation
  const direction = prevTab === 'login' ? -1 : 1;

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      {/* 1. DESKTOP & MOBILE BRAND HEADING */}
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
        {/* Tab switcher (Hidden when in Forgot Password mode) */}
        {activeTab !== 'forgot' ? (
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
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-[#541212]">Reset Password</h2>
            <button
              type="button"
              onClick={() => switchTab('login')}
              className="text-xs font-semibold text-[#9B2C3E] hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

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
            {activeTab === 'login' && (
              <LoginForm
                onSwitchToRegister={() => switchTab('register')}
                onSuccess={handleAuthSuccess}
                onForgotPassword={() => switchTab('forgot')}
              />
            )}

            {activeTab === 'register' && (
              <RegisterForm
                onSwitchToLogin={() => switchTab('login')}
                onSuccess={handleAuthSuccess}
              />
            )}

            {activeTab === 'forgot' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your email address below and we'll send you instructions to reset your password.
                </p>

                {resetSent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
                    <p className="font-semibold">Reset Link Sent!</p>
                    <p>Check your email inbox for further instructions to change your password.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-[#7B1C2E] focus:ring-1 focus:ring-[#7B1C2E]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full bg-[#7B1C2E] hover:bg-[#5A1020] text-white font-medium py-3 rounded-xl text-sm transition shadow-md disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-2 block"
                >
                  Cancel and Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-in {
          animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}
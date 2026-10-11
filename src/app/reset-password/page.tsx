'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

const BG_IMAGES = [
  'https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_14a51a9d3-1772868034765.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png',
];

function GlassBackdrop({ children }: { children: React.ReactNode }) {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBgIndex((i) => (i + 1) % BG_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#1b110e] p-4 overflow-hidden">
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{ backgroundImage: `url(${src})`, opacity: i === bgIndex ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div className="relative w-full max-w-md flex flex-col items-center gap-4">
        <img src="/assets/images/Logo123.png" alt="Feast & F?te logo" className="w-20 h-20 object-contain" />
        {children}
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [verificationError, setVerificationError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) {
        setIsSessionValid(true);
        setChecking(false);
      }
    });

    async function verifyToken() {
      const tokenHash = searchParams.get('token_hash');
      const code = searchParams.get('code');

      // 1. Verify via token_hash (Recommended OTP flow)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (!error && active) {
          setIsSessionValid(true);
          setChecking(false);
          return;
        }
        if (error && active) setVerificationError('This password link is invalid or has expired.');
      }

      // 2. Verify via PKCE code (Fallback)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && active) {
          setIsSessionValid(true);
          setChecking(false);
          return;
        }
        if (error && active) setVerificationError('This password link is invalid or has expired.');
      }

      if (active) {
        setIsSessionValid(false);
        setChecking(false);
      }
    }

    void verifyToken();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8 || !/(?=.*[0-9!@#$%^&*])/.test(newPassword)) {
      toast.error('Password must be at least 8 characters and include a number or symbol.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully! Redirecting...');
        window.setTimeout(() => router.push('/sign-up-login-screen'), 1500);
      }
    } catch {
      toast.error('Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icon name="ArrowPathIcon" size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isSessionValid) {
    return (
      <GlassBackdrop>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md text-center space-y-4 shadow-2xl text-white">
          <Icon name="ExclamationCircleIcon" size={40} className="text-error mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid or Expired Link</h2>
          <p className="text-sm text-white/70">
            The password reset link is invalid or has expired. Please request a new link.
          </p>
          {verificationError && (
            <p role="alert" className="text-sm text-error">
              {verificationError}
            </p>
          )}
          <button
            onClick={() => router.push('/sign-up-login-screen')}
            className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl"
          >
            Back to Sign In
          </button>
        </div>
      </GlassBackdrop>
    );
  }

  return (
    <GlassBackdrop>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-white">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Set New Password</h2>
          <p className="text-xs text-white/70">
            Your email is verified. Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </GlassBackdrop>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Icon name="ArrowPathIcon" size={28} className="animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

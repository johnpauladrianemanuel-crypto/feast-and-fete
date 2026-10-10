'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md text-center space-y-4 shadow-xl">
          <Icon name="ExclamationCircleIcon" size={40} className="text-error mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Invalid or Expired Link</h2>
          <p className="text-sm text-muted-foreground">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
          <p className="text-xs text-muted-foreground">
            Your email is verified. Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">New Password</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
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
    </div>
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

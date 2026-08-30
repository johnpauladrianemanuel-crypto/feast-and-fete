'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeSplash from '@/components/WelcomeSplash';
import { createGuestProfile } from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface Props {
  onSwitchToRegister: () => void;
  onSuccess?: (userName: string) => void;
  onOpenGuestPhoneOtp?: () => void;
  onForgotPassword?: () => void;
}

function AnimatedPanel({ show, children }: { show: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(0);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      if (ref.current) setHeight(ref.current.scrollHeight);
      const timer = setTimeout(() => setHeight('auto'), 300);
      return () => clearTimeout(timer);
    } else {
      if (ref.current) setHeight(ref.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      aria-hidden={!show}
      style={{
        height,
        overflow: 'hidden',
        transition: 'height 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        ref={ref}
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const arr = value.split('').slice(0, 6);
  while (arr.length < 6) arr.push('');

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const nextArr = [...arr];
    nextArr[i] = char;
    const nextVal = nextArr.join('').replace(/\s/g, '');
    onChange(nextVal);
    if (char && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (arr[i]) {
        const nextArr = [...arr];
        nextArr[i] = '';
        onChange(nextArr.join('').replace(/\s/g, ''));
      } else if (i > 0) {
        const nextArr = [...arr];
        nextArr[i - 1] = '';
        onChange(nextArr.join('').replace(/\s/g, ''));
        inputs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIdx = Math.min(pasted.length - 1, 5);
      setTimeout(() => inputs.current[nextIdx]?.focus(), 0);
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={`otp-digit-${i}`}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={arr[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-10 h-12 text-center text-lg font-bold rounded-xl border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
        />
      ))}
    </div>
  );
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeGuestPhoneValue(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  const withoutCountryCode = withoutLeadingZero.startsWith('63') ? withoutLeadingZero.slice(2) : withoutLeadingZero;
  if (withoutCountryCode.length !== 10) return '';
  return `+63${withoutCountryCode}`;
}

export default function LoginForm({ onSwitchToRegister, onSuccess, onOpenGuestPhoneOtp, onForgotPassword }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetSending, setIsResetSending] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);
  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const [guestMethod, setGuestMethod] = useState<'phone' | 'gmail' | null>(null);
  const [guestPhoneRaw, setGuestPhoneRaw] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhoneError, setGuestPhoneError] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [otpContact, setOtpContact] = useState('');

  const { signIn, signInAsGuest } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({ defaultValues: { rememberMe: false } });

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      const name =
        result?.user?.user_metadata?.full_name ||
        result?.user?.user_metadata?.name ||
        result?.user?.email?.split('@')[0] ||
        'there';

      setWelcomeUser(name);
      if (onSuccess) onSuccess(name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials or unconfirmed email.';
      setError('root', { type: 'manual', message });
    } finally {
      setIsLoading(false);
    }
  }

  // Diretsong ipapadala ang reset link sa email na nakalagay sa input field
  async function handleDirectForgotPassword() {
    const email = getValues('email')?.trim();

    if (!email) {
      setError('email', {
        type: 'manual',
        message: 'Please enter your email address first to reset your password.',
      });
      toast.error('Please enter your email address first.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('email', {
        type: 'manual',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setIsResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Password reset link sent to ${email}! Check your Gmail inbox.`);
      }
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsResetSending(false);
    }
  }

  async function sendOtp(contact: string) {
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setOtpContact(contact);
    setOtpCode('');
    setOtpError('');

    if (contact.includes('@')) {
      try {
        const resp = await fetch('/api/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: contact, otp }),
        });
        if (!resp.ok) {
          toast.error('Failed to send verification email.');
        } else {
          toast.success(`Verification code sent to ${contact}`);
        }
      } catch {
        toast.error('Unable to send verification email.');
      }
    } else if (contact.startsWith('+')) {
      try {
        const resp = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact, otp }),
        });
        if (!resp.ok) {
          toast.warning('SMS delivery issue.');
        } else {
          toast.success(`SMS code sent to ${contact}`);
        }
      } catch {
        toast.error('SMS service error.');
      }
    }

    setOtpStep(true);
    setOtpResendCooldown(30);
  }

  function handleGuestPhoneContinue() {
    const normalizedPhone = normalizeGuestPhoneValue(guestPhoneRaw);
    if (!normalizedPhone) {
      setGuestPhoneError('Please enter a valid Philippine phone number.');
      return;
    }
    setGuestPhoneError('');
    setOtpSending(true);
    setTimeout(() => {
      sendOtp(normalizedPhone);
      setOtpSending(false);
    }, 600);
  }

  function handleGuestEmailContinue() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
      setGuestEmailError('Please enter a valid email address.');
      return;
    }
    setGuestEmailError('');
    setOtpSending(true);
    setTimeout(() => {
      sendOtp(guestEmail.trim());
      setOtpSending(false);
    }, 600);
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      setOtpError('Please enter the full 6-digit code.');
      return;
    }
    if (otpCode !== generatedOtp) {
      setOtpError('Incorrect code. Please try again.');
      setOtpCode('');
      return;
    }
    setOtpError('');

    const contactType = guestMethod === 'phone' ? 'phone' : 'email';
    setIsLoading(true);

    try {
      const profile = await createGuestProfile(contactType, otpContact);
      try {
        localStorage.setItem('guestProfileId', profile.id);
        localStorage.setItem('guestContactType', profile.contactType);
        localStorage.setItem('guestContactValue', profile.contactValue);
      } catch {}

      if (signInAsGuest) {
        await signInAsGuest({
          id: profile.id,
          contactType: profile.contactType,
          contactValue: profile.contactValue,
        });
      }
    } catch {
      if (signInAsGuest) {
        await signInAsGuest({
          id: `guest-${Date.now()}`,
          contactType,
          contactValue: otpContact,
        });
      }
    } finally {
      setIsLoading(false);
      toast.success('Verification successful — continuing as guest');
      setOtpStep(false);
      setWelcomeUser('Guest');
      if (onSuccess) onSuccess('Guest');
    }
  }

  function resetGuestFlow() {
    setShowGuestOptions(false);
    setGuestMethod(null);
    setGuestPhoneRaw('');
    setGuestEmail('');
    setGuestPhoneError('');
    setGuestEmailError('');
  }

  if (welcomeUser) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <WelcomeSplash userName={welcomeUser} onComplete={() => router.push('/')} />
      </div>
    );
  }

  const showPhonePanel = guestMethod === 'phone' && !otpStep;
  const showGmailPanel = guestMethod === 'gmail' && !otpStep;
  const showChoicePanel = showGuestOptions && !guestMethod && !otpStep;
  const showOtpPanel = otpStep;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h3 className="font-display text-2xl font-bold text-foreground">Welcome</h3>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your Feast & Fête account.</p>
      </div>

      {errors.root?.message && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-error/8 border border-error/20">
          <Icon name="ExclamationCircleIcon" size={16} className="text-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error">{String(errors.root.message)}</p>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-semibold text-foreground">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          className="input-field"
          placeholder="you@email.com"
          autoComplete="email"
          {...register('email', {
            required: 'Email address is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />
        {errors.email?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className="input-field pr-10"
            placeholder="Your password"
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
          </button>
        </div>
        {errors.password?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Keep signed in & Direct Forgot Password */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <input
            id="login-remember"
            type="checkbox"
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            {...register('rememberMe')}
          />
          <label htmlFor="login-remember" className="text-sm text-muted-foreground select-none cursor-pointer">
            Keep me signed in
          </label>
        </div>

        <button
          type="button"
          onClick={handleDirectForgotPassword}
          disabled={isResetSending}
          className="text-xs font-semibold text-primary hover:underline transition-all disabled:opacity-50"
        >
          {isResetSending ? 'Sending Link…' : 'Forgot Password?'}
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ minHeight: 46 }}
      >
        {isLoading ? (
          <>
            <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign In to Feast & Fête'
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Guest Login */}
      {!showGuestOptions && !guestMethod && !otpStep && (
        <button
          type="button"
          onClick={() => {
            if (onOpenGuestPhoneOtp) onOpenGuestPhoneOtp();
            else setShowGuestOptions(true);
          }}
          className="w-full py-3 border-2 border-dashed border-border text-foreground font-semibold text-sm rounded-xl hover:border-primary hover:text-primary flex items-center justify-center gap-2"
          style={{ minHeight: 46 }}
        >
          <Icon name="UserIcon" size={16} />
          Login as Guest
        </button>
      )}

      {/* Guest Panels */}
      <AnimatedPanel show={showChoicePanel}>
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground text-center">Continue as Guest with:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setShowGuestOptions(false); setGuestMethod('phone'); }}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-border bg-card hover:border-primary"
            >
              <Icon name="PhoneIcon" size={28} className="text-primary" />
            </button>
            <button
              type="button"
              onClick={() => { setShowGuestOptions(false); setGuestMethod('gmail'); }}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-border bg-card hover:border-primary"
            >
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 5.457c6.288 0 10.56 2.718 12.984 4.986l9.54-9.3C41.172 1.332 33.228-2 24-2 14.628-2 6.48 3.348 2.172 11.22l11.1 8.628C15.468 13.2 19.26 5.457 24 5.457z"/>
                <path fill="#4285F4" d="M46.098 24.557c0-1.638-.144-3.204-.396-4.716H24v8.928h12.468c-.54 2.898-2.178 5.358-4.638 7.014l7.2 5.592c4.2-3.876 6.648-9.582 6.648-16.818z"/>
                <path fill="#FBBC05" d="M13.272 28.695A13.8 13.8 0 0 1 12.6 24c0-1.638.24-3.228.672-4.695L2.172 10.677A23.94 23.94 0 0 0 0 24c0 3.876.924 7.536 2.556 10.776l10.716-6.081z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.916-2.148 15.888-5.832l-7.2-5.592c-2.148 1.44-4.896 2.292-8.688 2.292-4.74 0-8.532-3.204-9.936-7.512l-10.716 6.081C6.48 44.652 14.628 48 24 48z"/>
              </svg>
            </button>
          </div>
          <button type="button" onClick={resetGuestFlow} className="w-full text-xs text-muted-foreground text-center">
            Cancel
          </button>
        </div>
      </AnimatedPanel>

      <AnimatedPanel show={showPhonePanel}>
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetGuestFlow} className="text-muted-foreground">
              <Icon name="ArrowLeftIcon" size={16} />
            </button>
            <span className="text-sm font-semibold">Enter phone number</span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🇵🇭 +63</span>
            <input
              type="tel"
              value={guestPhoneRaw}
              onChange={e => setGuestPhoneRaw(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="input-field pl-16"
              placeholder="9171234567"
            />
          </div>
          {guestPhoneError && <p className="text-xs text-error">{guestPhoneError}</p>}
          <button
            type="button"
            onClick={handleGuestPhoneContinue}
            disabled={otpSending}
            className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl"
          >
            {otpSending ? 'Sending…' : 'Send Verification Code'}
          </button>
        </div>
      </AnimatedPanel>

      <AnimatedPanel show={showGmailPanel}>
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetGuestFlow} className="text-muted-foreground">
              <Icon name="ArrowLeftIcon" size={16} />
            </button>
            <span className="text-sm font-semibold">Enter Gmail address</span>
          </div>
          <input
            type="email"
            value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}
            className="input-field"
            placeholder="you@gmail.com"
          />
          {guestEmailError && <p className="text-xs text-error">{guestEmailError}</p>}
          <button
            type="button"
            onClick={handleGuestEmailContinue}
            disabled={otpSending}
            className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl"
          >
            {otpSending ? 'Sending…' : 'Send Verification Code'}
          </button>
        </div>
      </AnimatedPanel>

      <AnimatedPanel show={showOtpPanel}>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOtpStep(false)} className="text-muted-foreground">
              <Icon name="ArrowLeftIcon" size={16} />
            </button>
            <span className="text-sm font-semibold">Enter verification code</span>
          </div>
          <p className="text-xs text-center text-muted-foreground">Sent to {otpContact}</p>
          <OtpInput value={otpCode} onChange={setOtpCode} />
          {otpError && <p className="text-xs text-error text-center">{otpError}</p>}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpCode.length < 6 || isLoading}
            className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl"
          >
            Verify & Continue as Guest
          </button>
        </div>
      </AnimatedPanel>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account yet?{' '}
        <button type="button" onClick={onSwitchToRegister} className="text-primary font-semibold hover:underline">
          Create one
        </button>
      </p>
    </form>
  );
}
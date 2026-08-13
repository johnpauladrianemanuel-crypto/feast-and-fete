'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface Props {
  onSwitchToLogin: () => void;
  onSuccess?: (userName: string) => void;
}

export default function RegisterForm({ onSwitchToLogin }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const passwordValue = watch('password', '');

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
      });

      setRegisteredEmail(data.email);
      setSuccess(true);

      toast.success('Account created!', {
        description: 'Please check your email to confirm your account.',
      });
    } catch (err: any) {
      let message = 'Registration failed. Please try again.';

      if (typeof err === 'string') {
        message = err;
      } else if (err?.message && typeof err.message === 'string') {
        message = err.message;
      } else if (err?.error_description && typeof err.error_description === 'string') {
        message = err.error_description;
      } else if (typeof err === 'object' && err !== null) {
        try {
          message = JSON.stringify(err) === '{}' ? message : String(err);
        } catch {
          message = 'Registration failed. Please try again.';
        }
      }

      setError('root', { type: 'manual', message });
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-4 animate-slide-up">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'rgba(45,122,79,0.12)', border: '2px solid rgba(45,122,79,0.3)' }}
        >
          <Icon name="EnvelopeIcon" size={32} className="text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Check Your Email</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-foreground">{registeredEmail}</span>. Please verify your email address before signing in.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h3 className="font-display text-2xl font-bold text-foreground">Create your account</h3>
        <p className="text-sm text-muted-foreground mt-1">Join Feast & Fête and start pre-ordering today.</p>
      </div>

      {/* Safe Root error display */}
      {errors.root?.message && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-error/8 border border-error/20">
          <Icon name="ExclamationCircleIcon" size={16} className="text-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error">
            {typeof errors.root.message === 'string'
              ? errors.root.message
              : 'Registration failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1.5">
        <label htmlFor="reg-name" className="block text-sm font-semibold text-foreground">
          Full Name <span className="text-error">*</span>
        </label>
        <input
          id="reg-name"
          type="text"
          className="input-field"
          placeholder="e.g. Maria Cristina Santos"
          autoComplete="name"
          {...register('fullName', {
            required: 'Full name is required',
            minLength: { value: 3, message: 'Enter your full name (at least 3 characters)' },
          })}
          aria-invalid={!!errors.fullName}
        />
        {errors.fullName?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-sm font-semibold text-foreground">
          Email Address <span className="text-error">*</span>
        </label>
        <input
          id="reg-email"
          type="email"
          className="input-field"
          placeholder="you@email.com"
          autoComplete="email"
          {...register('email', {
            required: 'Email address is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
          aria-invalid={!!errors.email}
        />
        {errors.email?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label htmlFor="reg-phone" className="block text-sm font-semibold text-foreground">
          Philippine Mobile Number <span className="text-error">*</span>
        </label>
        <p className="text-xs text-muted-foreground">For order updates via SMS or Viber.</p>
        <input
          id="reg-phone"
          type="tel"
          className="input-field"
          placeholder="09XX-XXX-XXXX"
          autoComplete="tel"
          {...register('phone', {
            required: 'Mobile number is required',
            pattern: {
              value: /^(09|\+639)\d{9}$/,
              message: 'Enter a valid Philippine mobile number (e.g. 09171234567)',
            },
          })}
          aria-invalid={!!errors.phone}
        />
        {errors.phone?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label htmlFor="reg-address" className="block text-sm font-semibold text-foreground">
          Delivery Address
        </label>
        <p className="text-xs text-muted-foreground">Used as your default delivery address.</p>
        <input
          id="reg-address"
          type="text"
          className="input-field"
          placeholder="Street, Barangay, City, Province"
          autoComplete="street-address"
          {...register('address')}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="block text-sm font-semibold text-foreground">
          Password <span className="text-error">*</span>
        </label>
        <p className="text-xs text-muted-foreground">At least 8 characters with a number or symbol.</p>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            className="input-field pr-10"
            placeholder="Create a strong password"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              pattern: { value: /(?=.*[0-9!@#$%^&*])/, message: 'Include at least one number or symbol' },
            })}
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="reg-confirm" className="block text-sm font-semibold text-foreground">
          Confirm Password <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirm ? 'text' : 'password'}
            className="input-field pr-10"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: val => val === passwordValue || 'Passwords do not match',
            })}
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            <Icon name={showConfirm ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
          </button>
        </div>
        {errors.confirmPassword?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <input
            id="reg-terms"
            type="checkbox"
            className="w-4 h-4 mt-0.5 rounded border-border accent-primary flex-shrink-0"
            {...register('agreeToTerms', { required: 'You must agree to the terms to continue' })}
          />
          <label htmlFor="reg-terms" className="text-sm text-muted-foreground cursor-pointer select-none leading-snug">
            I agree to the{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>.
            No refunds, but payments can be applied to future orders.
          </label>
        </div>
        {errors.agreeToTerms?.message && (
          <p className="text-xs text-error flex items-center gap-1 ml-6">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ minHeight: 46 }}
      >
        {isLoading ? (
          <>
            <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
            Creating account…
          </>
        ) : (
          'Create My Account'
        )}
      </button>

      {/* Switch to login */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}
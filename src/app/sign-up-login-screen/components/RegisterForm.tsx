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
  region: string;
  city: string;
  barangay: string;
  street: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface Props {
  onSwitchToLogin: () => void;
  onSuccess?: (userName: string) => void;
}

const REGION_OPTIONS = [
  { value: 'NCR', label: 'National Capital Region (NCR)' },
  { value: 'CALABARZON', label: 'Calabarzon (Region IV-A)' },
  { value: 'CENTRAL_LUZON', label: 'Central Luzon (Region III)' },
];

const REGION_CITY_MAP: Record<string, string[]> = {
  NCR: [
    'Quezon City', 'Manila', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong',
    'Parañaque', 'Las Piñas', 'Muntinlupa', 'Marikina', 'Caloocan',
    'Valenzuela', 'Malabon', 'Navotas', 'San Juan', 'Pasay'
  ],
  CALABARZON: [
    'San Mateo (Rizal)', 'Antipolo City', 'Taytay', 'Cainta', 'Rodriguez (Montalban)',
    'Bacoor City', 'Imus City', 'Dasmariñas City', 'General Trias City',
    'Calamba City', 'Santa Rosa City', 'Biñan City', 'Cabuyao City',
    'San Pedro City', 'Lipa City', 'Batangas City'
  ],
  CENTRAL_LUZON: [
    'Angeles City', 'San Fernando City', 'Mabalacat City', 'Malolos City',
    'Meycauayan City', 'San Jose del Monte City', 'Tarlac City',
    'Olongapo City', 'Cabanatuan City'
  ],
};

const CITY_BARANGAY_MAP: Record<string, string[]> = {
  'Quezon City': ['Barangay San Jose', 'Barangay Holy Spirit', 'Barangay Tatalon', 'Batasan Hills', 'Commonwealth', 'Cubao', 'Diliman', 'Kamuning', 'Loyola Heights', 'New Manila', 'Novaliches', 'Project 6', 'Teachers Village'],
  'Manila': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Miguel', 'San Nicolas', 'Santa Cruz', 'Santa Ana', 'Tondo'],
  'Makati': ['Poblacion', 'San Antonio', 'Bel-Air', 'Dasmariñas', 'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Magallanes', 'Pio del Pilar', 'San Lorenzo', 'Urdaneta'],
  'Pasig': ['Bagong Ilog', 'Pinagbuhatan', 'Caniogan', 'Kapitolyo', 'Manggahan', 'Maybunga', 'Oranbo', 'Rosario', 'San Antonio', 'San Joaquin', 'Ugong'],
  'Taguig': ['Central Bicutan', 'Ususan', 'Bambang', 'Fort Bonifacio (BGC)', 'Lower Bicutan', 'Napindan', 'Pinagsama', 'Signal Village', 'Tuktukan', 'Upper Bicutan'],
  'Mandaluyong': ['Addition Hills', 'Barangka Drive', 'Highway Hills', 'Hulo', 'Malamig', 'Plainview', 'Pleasant Hills', 'Poblacion', 'San Jose', 'Wack-Wack Greenhills'],
  'Parañaque': ['B F Homes', 'Don Bosco', 'Baclaran', 'Don Galo', 'La Huerta', 'Moonwalk', 'San Dionisio', 'San Isidro', 'Santo Niño', 'Sun Valley', 'Tambo'],
  'Las Piñas': ['Alabang-Zapote', 'BF International', 'Daniel Fajardo', 'Pamplona Uno', 'Pamplona Tres', 'Pilar', 'Pulang Lupa Uno', 'Talon Uno', 'Talon Dos'],
  'Muntinlupa': ['Alabang', 'Bayanan', 'Cupang', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan'],
  'Marikina': ['Barangka', 'Concepcion Uno', 'Concepcion Dos', 'Industrial Valley', 'Fortune', 'Malanday', 'Marikina Heights', 'Nangka', 'Parang', 'San Roque', 'Santa Elena'],
  'Caloocan': ['Barangay 1 to 188 (North/South Caloocan)', 'Bagong Silang', 'Camarin', 'Deparo', 'Grace Park', 'Monumento', 'Tala'],
  'Valenzuela': ['Arkong Bato', 'Gen. T. de Leon', 'Karuhatan', 'Lawang Bato', 'Malinta', 'Mapulang Lupa', 'Marulas', 'Paso de Blas', 'Poblacion', 'Punturin'],
  'Malabon': ['Acacia', 'Catmon', 'Concepcion', 'Dampalit', 'Longos', 'Niugan', 'Potrero', 'San Agustin', 'Tañong', 'Tugatog'],
  'Navotas': ['Bagumbayan North', 'Bagumbayan South', 'Bangkulasi', 'Daanghari', 'Navotas East', 'Navotas West', 'San Jose', 'San Roque', 'Tangos North', 'Tangos South'],
  'San Juan': ['Addition Hills', 'Balong-Bato', 'Greenhills', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadena', 'Poblacion', 'Progreso', 'San Perfecta', 'Tibagan'],
  'Pasay': ['Baclaran', 'Don Carlos Village', 'Malibay', 'Maricaban', 'Poblacion', 'San Jose', 'San Rafael', 'San Roque', 'Villamor Airbase'],
  'San Mateo (Rizal)': ['Ampid I', 'Ampid II', 'Banaba', 'Dulumbayan', 'Guitnang Bayan I', 'Guitnang Bayan II', 'Gulod Malaya', 'Malanday', 'Maly', 'Pintong Bukawe', 'Santa Ana', 'Santo Niño', 'Silangan', 'Kambal'],
  'Antipolo City': ['Bagong Nayon', 'Beverly Hills', 'Calawis', 'Cupang', 'Dalig', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntingdilaw', 'San Cruz', 'San Isidro', 'San Jose', 'San Roque'],
  'Taytay': ['Dolores (Poblacion)', 'Muzon', 'San Juan', 'San Isidro', 'Santa Ana'],
  'Cainta': ['San Andres', 'San Juan', 'San Roque', 'Santa Rosa', 'Santo Domingo'],
  'Rodriguez (Montalban)': ['Balite', 'Burgos', 'Geronimo', 'Macabud', 'Manggahan', 'Mascap', 'Rosario', 'San Jose', 'San Rafael'],
  'Bacoor City': ['Bayanan', 'Habay I', 'Habay II', 'Mambog I', 'Mambog II', 'Molino I', 'Molino II', 'Molino III', 'Molino IV', 'Niog I', 'Niog II', 'Panapaan', 'Salawag', 'Talaba'],
  'Imus City': ['Anabu I-A', 'Anabu II-A', 'Bucandala', 'Carsadang Bago', 'Malagasang I-A', 'Malagasang II-A', 'Medicion', 'Poblacion', 'Tanzang Luma'],
  'Dasmariñas City': ['Burol', 'Dasmariñas Bagong Bayan', 'Langkaan I', 'Langkaan II', 'Paliparan I', 'Paliparan II', 'Paliparan III', 'Sabang', 'Salawag', 'Salitran I', 'Salitran II', 'Sampaloc I'],
  'General Trias City': ['Arnaldo', 'Bacao', 'Manggahan', 'Navarro', 'Pasong Kawayan', 'San Francisco', 'Tejero'],
  'Calamba City': ['Barandal', 'Bucal', 'Canlubang', 'Halang', 'Lawa', 'Makiling', 'Parian', 'Poblacion', 'Real', 'Saimsim', 'Turbina'],
  'Santa Rosa City': ['Balibago', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Macabling', 'Malitlit', 'Market Area', 'Sinalhan', 'Tagapo'],
  'Biñan City': ['Caniogan', 'De La Paz', 'Ganado', 'Langkiwa', 'Loma', 'Malaban', 'Platero', 'Poblacion', 'San Antonio', 'San Francisco', 'Santo Tomas'],
  'Cabuyao City': ['Banaybanay', 'Banlic', 'Bigaa', 'Casile', 'Diezmo', 'Gulod', 'Mamatid', 'Poblacion', 'Pulo', 'Sala'],
  'San Pedro City': ['Chrysanthemum', 'Cuyab', 'Landayan', 'Langgam', 'Magsaysay', 'Pacita 1', 'Pacita 2', 'Poblacion', 'San Antonio', 'San Vicente', 'United Bayanihan'],
  'Lipa City': ['Balintawak', 'Inosloban', 'Mataas na Lupa', 'Pangao', 'Poblacion', 'Sabang', 'San Carlos', 'Tambobong', 'Tibig'],
  'Batangas City': ['Alangilan', 'Balagtas', 'Bolbok', 'Calicanto', 'Cuta', 'Gulod Labac', 'Kumintang Ibaba', 'Kumintang Ilaya', 'Poblacion', 'Soro-soro Karsada'],
  'Angeles City': ['Balibago', 'Cutcut', 'Malabanias', 'Margardt', 'Pami', 'Pulung Maragul', 'Salapungan', 'Santo Rosario', 'Sapu Bato'],
  'San Fernando City': ['Calulut', 'Dolores', 'Lacing', 'Magliman', 'Maimpis', 'Palawe', 'San Agustin', 'San Jose', 'Sindalan', 'Telabastagan'],
  'Mabalacat City': ['Dau', 'Lakandula', 'Mabiga', 'Macapagal Village', 'Poblacion', 'San Francisco', 'Santa Ines', 'Tabun'],
  'Malolos City': ['Bulihan', 'Cofradia', 'Guinhawa', 'Ligas', 'Longos', 'Lugam', 'Mojon', 'Panasahan', 'San Gabriel', 'San Vicente'],
  'Meycauayan City': ['Banga', 'Bayugo', 'Calvario', 'Iba', 'Lawa', 'Libtong', 'Perez', 'Poblacion', 'Saluysoy', 'Zamora'],
  'San Jose del Monte City': ['Fierce', 'Gumaoc', 'Muzon', 'Poblacion', 'Graceville', 'Kaypian', 'San Manuel', 'Santo Cristo', 'Tungkong Mangga'],
  'Tarlac City': ['Binauganan', 'Central', 'Matatalaib', 'Poblacion', 'San Nicolas', 'San Rafael', 'San Vicente', 'Sepung Calzada', 'Suizo', 'Tibag'],
  'Olongapo City': ['Barretto', 'East Bajac-Bajac', 'East Tapinac', 'Gordon Heights', 'Kalaklan', 'New Cabalan', 'Old Cabalan', 'Santa Rita', 'West Bajac-Bajac', 'West Tapinac'],
  'Cabanatuan City': ['Bitas', 'Cabanatuan', 'Mabini Extension', 'Sangitan', 'San Josef', 'Supermarket', 'Aduas Norte', 'Aduas Sur', 'Barangay 1-10'],
};

function PasswordStrengthIndicator({ value }: { value: string }) {
  if (!value) return null;

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  const levels = [
    { label: 'Very Weak', color: 'bg-red-500', width: 'w-1/4' },
    { label: 'Weak', color: 'bg-orange-500', width: 'w-2/4' },
    { label: 'Medium', color: 'bg-yellow-500', width: 'w-3/4' },
    { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' },
  ];

  const currentLevel = levels[Math.max(0, score - 1)];

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${currentLevel.color} ${currentLevel.width} transition-all duration-300 rounded-full`} />
      </div>
      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
        <span>Strength: <strong className="text-foreground">{currentLevel.label}</strong></span>
        <span>{value.length}/8+ chars</span>
      </div>
    </div>
  );
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
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      region: 'NCR',
    }
  });

  const passwordValue = watch('password', '');
  const selectedRegion = watch('region', 'NCR');
  const selectedCity = watch('city', '');

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    try {
      const fullAddress = `${data.street}, ${data.barangay}, ${data.city}, ${data.region}`;
      await signUp(data.email, data.password, {
        fullName: data.fullName,
        phone: data.phone,
        address: fullAddress,
        region: data.region,
        city: data.city,
        barangay: data.barangay,
        street_address: data.street,
      });

      setRegisteredEmail(data.email);
      setSuccess(true);

      toast.success('Account created!', {
        description: 'Please check your email to confirm your account.',
      });
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.';

      if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        const errorObj = err as { message?: string; error_description?: string };
        if (errorObj.message && typeof errorObj.message === 'string') {
          message = errorObj.message;
        } else if (errorObj.error_description && typeof errorObj.error_description === 'string') {
          message = errorObj.error_description;
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

      {errors.root?.message && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-error/8 border border-error/20">
          <Icon name="ExclamationCircleIcon" size={16} className="text-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error">{errors.root.message}</p>
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
        />
        {errors.phone?.message && (
          <p className="text-xs text-error flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Structured Address Fields */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="block text-sm font-semibold text-foreground">Delivery Address Details</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Region</label>
            <select
              {...register('region', { required: 'Region is required' })}
              onChange={(e) => {
                setValue('region', e.target.value);
                setValue('city', '');
                setValue('barangay', '');
              }}
              className="input-field text-xs py-2"
            >
              {REGION_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">City / Municipality</label>
            <select
              {...register('city', { required: 'City is required' })}
              onChange={(e) => {
                setValue('city', e.target.value);
                setValue('barangay', '');
              }}
              className="input-field text-xs py-2"
            >
              <option value="">Select city</option>
              {(REGION_CITY_MAP[selectedRegion] || []).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Barangay</label>
            <select
              {...register('barangay', { required: 'Barangay is required' })}
              className="input-field text-xs py-2"
            >
              <option value="">Select barangay</option>
              {(CITY_BARANGAY_MAP[selectedCity] || []).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Street Address, Unit / House No.</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 123 Rizal St."
            {...register('street', { required: 'Street address is required' })}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5 pt-2">
        <label htmlFor="reg-password" className="block text-sm font-semibold text-foreground">
          Password <span className="text-error">*</span>
        </label>
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
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
          </button>
        </div>
        <PasswordStrengthIndicator value={passwordValue} />
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
          />
          <button
            type="button"
            onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
          </label>
        </div>
        {errors.agreeToTerms?.message && (
          <p className="text-xs text-error flex items-center gap-1 ml-6">
            <Icon name="ExclamationCircleIcon" size={12} className="text-error" />
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

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

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}
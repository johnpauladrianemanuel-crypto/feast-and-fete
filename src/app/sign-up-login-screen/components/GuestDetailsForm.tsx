'use client';

import React, { useState } from 'react';
import { REGION_OPTIONS, REGION_CITY_MAP, CITY_BARANGAY_MAP } from './RegisterForm';

export interface GuestDetails {
  fullName: string;
  phone: string;
  region: string;
  city: string;
  barangay: string;
  street: string;
  address: string;
}

interface Props {
  contactType: 'phone' | 'email';
  contactValue: string;
  loading?: boolean;
  onSubmit: (details: GuestDetails) => void;
}

type Errors = Partial<Record<'fullName' | 'phone' | 'region' | 'city' | 'barangay' | 'street', string>>;

function toLocalPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('63')) return `0${digits.slice(2)}`;
  return digits;
}

export default function GuestDetailsForm({ contactType, contactValue, loading, onSubmit }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(contactType === 'phone' ? toLocalPhone(contactValue) : '');
  const [region, setRegion] = useState('NCR');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [street, setStreet] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit() {
    const next: Errors = {};
    const phoneDigits = phone.replace(/\D/g, '');

    if (!fullName.trim()) next.fullName = 'Full name is required';
    if (phoneDigits.length < 10 || phoneDigits.length > 12) next.phone = 'Enter a valid contact number';
    if (!region) next.region = 'Region is required';
    if (!city) next.city = 'City is required';
    if (!barangay) next.barangay = 'Barangay is required';
    if (!street.trim()) next.street = 'Street address is required';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      region,
      city,
      barangay,
      street: street.trim(),
      address: `${street.trim()}, ${barangay}, ${city}, ${region}`,
    });
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Complete your details</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verified: {contactValue}. This will be saved as your default delivery address.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        {errors.fullName && <p className="mt-1 text-xs text-error">{errors.fullName}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Number</label>
        <input
          type="tel"
          className="input-field"
          placeholder="09171234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 13))}
        />
        {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone}</p>}
      </div>

      <p className="text-sm font-semibold text-foreground">Delivery Address Details</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Region</label>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setCity('');
              setBarangay('');
            }}
            className="input-field text-xs py-2"
          >
            <option value="">Select region</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.region && <p className="mt-1 text-xs text-error">{errors.region}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">City / Municipality</label>
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setBarangay('');
            }}
            className="input-field text-xs py-2"
          >
            <option value="">Select city</option>
            {(REGION_CITY_MAP[region] || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.city && <p className="mt-1 text-xs text-error">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Barangay</label>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="input-field text-xs py-2"
          >
            <option value="">Select barangay</option>
            {(CITY_BARANGAY_MAP[city] || []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.barangay && <p className="mt-1 text-xs text-error">{errors.barangay}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Street Address, Unit / House No.
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. 123 Rizal St."
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
        {errors.street && <p className="mt-1 text-xs text-error">{errors.street}</p>}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save & Continue as Guest'}
      </button>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClaimedVouchers } from '@/lib/claimedVouchers';
import { createClient } from '@/lib/supabase/client';
import { AVAILABLE_VOUCHERS, unclaimedVouchers } from '@/lib/vouchers';

export default function VoucherClaimSection() {
  const { user, loading } = useAuth();
  const customerId: string | null = user && !user.is_guest ? user.id : null;
  const [claimed, setClaimed] = useState<string[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsLoadError, setClaimsLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [claiming, setClaiming] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    requestId.current += 1;
    setClaimed([]);
    setMessage('');
    setError('');
    setClaimsLoadError('');
    setClaiming('');
    if (!customerId) {
      setLoadingClaims(false);
      return () => { active = false; requestId.current += 1; };
    }
    setLoadingClaims(true);
    fetchClaimedVouchers(customerId)
      .then((vouchers) => {
        if (active) setClaimed(vouchers.map((voucher) => voucher.code));
      })
      .catch((err: unknown) => {
        if (active) setClaimsLoadError(err instanceof Error ? err.message : 'Could not load vouchers.');
      })
      .finally(() => { if (active) setLoadingClaims(false); });
    return () => { active = false; requestId.current += 1; };
  }, [customerId, reload]);

  const available = customerId ? unclaimedVouchers(claimed) : AVAILABLE_VOUCHERS;

  async function claim(code: string) {
    const request = ++requestId.current;
    setClaiming(code);
    setError('');
    setMessage('');
    try {
      const { data, error: claimError } = await createClient().rpc('claim_voucher', { p_code: code });
      if (request !== requestId.current) return;
      if (claimError) throw new Error(claimError.message);
      const voucher = AVAILABLE_VOUCHERS.find((item) => item.code === code);
      if (!voucher || data !== voucher.percentage) throw new Error('Voucher details changed. Please refresh and try again.');
      setClaimed((previous) => previous.includes(code) ? previous : [...previous, code]);
      setMessage(`${code} claimed. Use it at checkout during the promotion period.`);
    } catch (err) {
      if (request === requestId.current) {
        setError(err instanceof Error ? err.message : 'Could not claim this voucher. Please try again.');
      }
    } finally {
      if (request === requestId.current) setClaiming('');
    }
  }

  return (
    <section id="claim-vouchers" className="mb-6 rounded-2xl border border-primary/20 bg-card p-5 scroll-mt-24" aria-labelledby="voucher-heading" aria-busy={loading || loadingClaims}>
      <h2 id="voucher-heading" className="font-display text-xl font-bold">Claim Vouchers</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Registered customers can claim vouchers anytime. Use them from Nov 15–Dec 24, 2026,
        8 AM–5 PM Philippine time. The better of the voucher or your 20% menu discount applies.
      </p>
      {!loading && !customerId && (
        <p className="mt-3 text-sm text-muted-foreground">
          Vouchers are for registered customers only.{' '}
          <Link href="/sign-up-login-screen" className="font-semibold text-primary underline">Sign in or sign up</Link>.
          Guests pay regular prices.
        </p>
      )}
      {(loading || loadingClaims) ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Loading vouchers…</p>
      ) : claimsLoadError ? (
        <div role="alert" className="mt-4 text-sm text-red-600">
          <p>Could not load claimed vouchers: {claimsLoadError}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      ) : available.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You have claimed all available vouchers. View them in{' '}
          <Link href="/customer-profile" className="font-semibold text-primary underline">My Vouchers</Link>.
        </p>
      ) : (
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {available.map((voucher) => (
          <div key={voucher.code} className="rounded-xl border border-border p-3">
            <p className="font-bold text-primary">{voucher.percentage}% OFF</p>
            <p className="text-sm font-semibold">{voucher.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">Whole order including fees</p>
            {customerId && (
              <button
                type="button"
                onClick={() => claim(voucher.code)}
                disabled={Boolean(claiming)}
                className="mt-3 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50"
              >
                {claiming === voucher.code ? 'Claiming…' : 'Claim voucher'}
              </button>
            )}
          </div>
        ))}
      </div>
      )}
      {message && <p role="status" className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}

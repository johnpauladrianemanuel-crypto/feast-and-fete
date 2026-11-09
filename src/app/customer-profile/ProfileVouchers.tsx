'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchClaimedVouchers } from '@/lib/claimedVouchers';
import { AppliedVoucher } from '@/lib/vouchers';

export default function ProfileVouchers({ userId }: { userId: string }) {
  const [vouchers, setVouchers] = useState<AppliedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setVouchers([]);
    setError('');
    setLoading(true);
    fetchClaimedVouchers(userId)
      .then((result) => {
        if (active) setVouchers(result);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your vouchers.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId, reload]);

  return (
    <section className="bg-card border border-border rounded-2xl p-6 mb-6" aria-labelledby="profile-vouchers-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="profile-vouchers-heading" className="text-base font-bold text-foreground">My Vouchers</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your claimed vouchers are reusable Nov 15–Dec 24, 2026, 8 AM–5 PM Philippine time.
          </p>
        </div>
        <Link href="/menu-browse-screen#claim-vouchers" className="text-sm font-semibold text-primary hover:underline">
          Claim vouchers
        </Link>
      </div>

      {loading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Loading your vouchers…</p>
      ) : error ? (
        <div role="alert" className="mt-4 text-sm text-red-600">
          <p>Could not load your vouchers: {error}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      ) : vouchers.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          You have not claimed any vouchers yet. Claim one anytime from the menu.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {vouchers.map((voucher) => (
              <div key={voucher.code} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-lg font-bold text-primary">{voucher.percentage}% OFF</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{voucher.code}</p>
                <p className="mt-1 text-xs text-muted-foreground">Whole order including fees · Reusable during promo hours</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Select a voucher at checkout. Only the better of your voucher or automatic menu discount applies.
          </p>
          <Link href="/cart-review" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Go to cart
          </Link>
        </>
      )}
    </section>
  );
}

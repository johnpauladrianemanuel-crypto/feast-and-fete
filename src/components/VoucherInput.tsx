'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fetchClaimedVouchers, validateClaimedVoucher } from '@/lib/claimedVouchers';
import { AppliedVoucher } from '@/lib/vouchers';

interface Props {
  userId: string;
  voucher: AppliedVoucher | null;
  onChange: (voucher: AppliedVoucher | null) => void;
}

export default function VoucherInput({ userId, voucher, onChange }: Props) {
  const [claimed, setClaimed] = useState<AppliedVoucher[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [checking, setChecking] = useState(false);
  const [reload, setReload] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    requestId.current += 1;
    onChange(null);
    setSelected('');
    setClaimed([]);
    setError('');
    setChecking(false);
    setLoadingClaims(true);
    fetchClaimedVouchers(userId)
      .then((vouchers) => { if (active) setClaimed(vouchers); })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load vouchers.');
      })
      .finally(() => { if (active) setLoadingClaims(false); });
    return () => { active = false; requestId.current += 1; };
  }, [userId, onChange, reload]);

  async function applyVoucher() {
    if (!selected) {
      setError('Select a claimed voucher.');
      return;
    }
    const request = ++requestId.current;
    setChecking(true);
    setError('');
    try {
      const validated = await validateClaimedVoucher(selected);
      if (request === requestId.current) onChange(validated);
    } catch (err) {
      if (request !== requestId.current) return;
      onChange(null);
      setError(err instanceof Error ? err.message : 'Could not validate this voucher. Please try again.');
    } finally {
      if (request === requestId.current) setChecking(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-border p-3">
      <label htmlFor="voucher-code" className="block text-sm font-semibold mb-2">My vouchers</label>
      <p className="text-xs text-muted-foreground mb-2">
        Use one claimed voucher per order. The larger of your automatic menu discount or voucher
        applies. Claimed vouchers can only be used Nov 15–Dec 24, 2026, 8 AM–5 PM Philippine time.
      </p>
      {loadingClaims ? (
        <p className="text-sm text-muted-foreground">Loading your vouchers…</p>
      ) : claimed.length > 0 ? (
        <div className="flex gap-2">
          <select
            id="voucher-code"
            value={selected}
            onChange={(event) => {
              requestId.current += 1;
              setSelected(event.target.value);
              onChange(null);
              setChecking(false);
              setError('');
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a voucher</option>
            {claimed.map((item) => (
              <option key={item.code} value={item.code}>{item.code} — {item.percentage}% off</option>
            ))}
          </select>
          <button type="button" disabled={checking || !selected} onClick={applyVoucher} className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50">
            {checking ? 'Checking…' : 'Apply'}
          </button>
        </div>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">
          No claimed vouchers. <Link href="/menu-browse-screen#claim-vouchers" className="text-primary underline">Claim a voucher on the menu</Link>.
        </p>
      ) : null}
      {error && (
        <div role="alert" className="mt-2 text-xs text-red-600">
          <p>{error}</p>
          <button type="button" className="mt-1 underline" onClick={() => setReload((value) => value + 1)}>Reload vouchers</button>
        </div>
      )}
      {voucher && <p role="status" className="mt-2 text-xs text-green-700">{voucher.code} validated. Your order summary shows the better discount.</p>}
    </div>
  );
}

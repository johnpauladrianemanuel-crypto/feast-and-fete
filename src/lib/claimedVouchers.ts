import { createClient } from '@/lib/supabase/client';
import { AppliedVoucher, AVAILABLE_VOUCHERS } from '@/lib/vouchers';

export async function fetchClaimedVouchers(userId: string): Promise<AppliedVoucher[]> {
  const { data, error } = await createClient()
    .from('claimed_vouchers')
    .select('voucher_code')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  const codes = new Set((data ?? []).map((row: { voucher_code: string }) => row.voucher_code));
  return AVAILABLE_VOUCHERS.filter((voucher) => codes.has(voucher.code));
}

export async function validateClaimedVoucher(code: string): Promise<AppliedVoucher> {
  const { data, error } = await createClient().rpc('validate_claimed_voucher', { p_code: code });
  if (error) throw new Error(error.message);
  const voucher = AVAILABLE_VOUCHERS.find((item) => item.code === code);
  if (!voucher || data !== voucher.percentage) {
    throw new Error('Voucher details changed. Please refresh and try again.');
  }
  return voucher;
}

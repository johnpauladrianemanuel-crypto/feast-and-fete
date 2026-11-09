export interface AppliedVoucher {
  code: string;
  percentage: number;
}

export const AVAILABLE_VOUCHERS: readonly AppliedVoucher[] = [
  { code: 'FEAST20', percentage: 20 },
  { code: 'FETE30', percentage: 30 },
  { code: 'CELEBRATE50', percentage: 50 },
];

export function unclaimedVouchers(claimedCodes: readonly string[]): AppliedVoucher[] {
  const claimed = new Set(claimedCodes);
  return AVAILABLE_VOUCHERS.filter((voucher) => !claimed.has(voucher.code));
}

export function voucherDiscount(total: number, voucher: AppliedVoucher | null): number {
  if (!voucher) return 0;
  return Math.round((Math.round(total * 100) * voucher.percentage) / 100) / 100;
}

export function customerDiscount(subtotal: number, isCustomer: boolean): number {
  return isCustomer ? voucherDiscount(subtotal, { code: '', percentage: 20 }) : 0;
}

export function orderDiscount(
  subtotal: number,
  fees: number,
  isCustomer: boolean,
  voucher: AppliedVoucher | null
): { amount: number; voucher: AppliedVoucher | null } {
  if (!isCustomer) return { amount: 0, voucher: null };
  const automatic = customerDiscount(subtotal, true);
  const promotional = voucherDiscount(subtotal + fees, voucher);
  if (voucher && promotional > automatic) return { amount: promotional, voucher };
  return { amount: automatic, voucher: null };
}

export function customerMenuPrice(price: number, isCustomer: boolean): number {
  return Number((price - customerDiscount(price, isCustomer)).toFixed(2));
}

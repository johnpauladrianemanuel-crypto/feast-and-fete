import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVAILABLE_VOUCHERS, unclaimedVouchers, voucherDiscount, customerDiscount, customerMenuPrice, orderDiscount } from '../src/lib/vouchers.ts';

test('voucher catalog exposes the three claimable promotions', () => {
  assert.deepEqual(AVAILABLE_VOUCHERS, [
    { code: 'FEAST20', percentage: 20 },
    { code: 'FETE30', percentage: 30 },
    { code: 'CELEBRATE50', percentage: 50 },
  ]);
});

test('claimed vouchers disappear from the available menu promotions', () => {
  assert.deepEqual(unclaimedVouchers([]), AVAILABLE_VOUCHERS);
  assert.deepEqual(unclaimedVouchers(['FETE30']).map((voucher) => voucher.code), ['FEAST20', 'CELEBRATE50']);
  assert.deepEqual(unclaimedVouchers(AVAILABLE_VOUCHERS.map((voucher) => voucher.code)), []);
  assert.deepEqual(unclaimedVouchers(['OTHER']).map((voucher) => voucher.code), ['FEAST20', 'FETE30', 'CELEBRATE50']);
});

test('orders without a voucher retain their full price', () => {
  assert.equal(voucherDiscount(1250, null), 0);
});

test('each voucher discounts the full order including fees', () => {
  const total = 1000 + 100 + 250;
  assert.equal(voucherDiscount(total, { code: 'FEAST20', percentage: 20 }), 270);
  assert.equal(voucherDiscount(total, { code: 'FETE30', percentage: 30 }), 405);
  assert.equal(voucherDiscount(total, { code: 'CELEBRATE50', percentage: 50 }), 675);
});

test('discounts round to centavos', () => {
  assert.equal(voucherDiscount(10.03, { code: 'CELEBRATE50', percentage: 50 }), 5.02);
  assert.equal(voucherDiscount(10.01, { code: 'FETE30', percentage: 30 }), 3);
});

test('registered customers receive 20% off the menu subtotal, not fees', () => {
  assert.equal(customerMenuPrice(1000, true), 800);
  assert.equal(customerDiscount(1000, true), 200);
  assert.deepEqual(orderDiscount(1000, 250, true, null), { amount: 200, voucher: null });
});

test('guests receive regular prices and cannot use vouchers', () => {
  assert.equal(customerMenuPrice(1000, false), 1000);
  assert.deepEqual(orderDiscount(1000, 250, false, { code: 'CELEBRATE50', percentage: 50 }), { amount: 0, voucher: null });
});

test('only the larger voucher or automatic discount applies', () => {
  const voucher = { code: 'FETE30', percentage: 30 };
  assert.deepEqual(orderDiscount(1000, 250, true, voucher), { amount: 375, voucher });
  assert.deepEqual(orderDiscount(1000, 0, true, { code: 'FEAST20', percentage: 20 }), { amount: 200, voucher: null });
  assert.deepEqual(orderDiscount(1000, 100, true, { code: 'FEAST20', percentage: 20 }), {
    amount: 220, voucher: { code: 'FEAST20', percentage: 20 },
  });
});

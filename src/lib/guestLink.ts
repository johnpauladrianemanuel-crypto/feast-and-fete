import { createHmac, timingSafeEqual } from 'crypto';

const LINK_TTL_DAYS = 30;

function getSecret(): string {
  return (
    process.env.GUEST_LINK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SEMAPHORE_API_KEY ||
    ''
  );
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url').slice(0, 16);
}

// Compact token (kept short for SMS): <guestId bytes>.<expiry base36>.<signature>
export function createGuestLinkToken(guestProfileId: string): string | null {
  if (!getSecret()) return null;
  const id = Buffer.from(guestProfileId.replace(/-/g, ''), 'hex').toString('base64url');
  const exp = Math.floor(Date.now() / 1000 / 60) + LINK_TTL_DAYS * 24 * 60;
  const payload = `${id}.${exp.toString(36)}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyGuestLinkToken(token: string): string | null {
  if (!getSecret()) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, expRaw, sig] = parts;
  const expected = sign(`${id}.${expRaw}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const exp = parseInt(expRaw, 36);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000 / 60)) return null;
  const hex = Buffer.from(id, 'base64url').toString('hex');
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

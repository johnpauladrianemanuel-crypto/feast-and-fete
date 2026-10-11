const MAX_ATTEMPTS = 10;
const LOCK_MS = 30 * 60 * 1000;

interface AttemptState {
  count: number;
  lockedUntil: number;
}

const keyFor = (scope: string) => `loginAttempts:${scope}`;

function read(scope: string): AttemptState {
  if (typeof window === 'undefined') return { count: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(keyFor(scope));
    if (raw) return JSON.parse(raw) as AttemptState;
  } catch {
    // ignore corrupted state
  }
  return { count: 0, lockedUntil: 0 };
}

function write(scope: string, state: AttemptState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(scope), JSON.stringify(state));
}

export function assertLoginAllowed(scope: string): void {
  const state = read(scope);
  if (state.lockedUntil > Date.now()) {
    const mins = Math.ceil((state.lockedUntil - Date.now()) / 60000);
    throw new Error(
      `You have too many login attempts. Please wait ${mins} minute${mins === 1 ? '' : 's'} (30 minutes lockout) before trying again.`
    );
  }
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    write(scope, { count: 0, lockedUntil: 0 });
  }
}

export function recordLoginFailure(scope: string): void {
  const state = read(scope);
  const count = state.count + 1;
  write(scope, {
    count,
    lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
  });
}

export function resetLoginAttempts(scope: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(keyFor(scope));
}

/** Local demo authentication + profile state. No real Deriv auth, no real data. */
import { create } from 'zustand';
import { audit, db, notify, type AuthSession, type Profile } from '../db/db';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`deriv-demo:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface AuthState {
  profile: Profile | null;
  signedIn: boolean;
  loading: boolean;
  error: string | null;
  balance: number;

  bootstrap(): Promise<void>;
  register(input: { email: string; password: string; firstName: string; lastName: string; country: string }): Promise<boolean>;
  login(email: string, password: string): Promise<boolean>;
  logout(): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<void>;
  changePassword(current: string, next: string): Promise<{ ok: boolean; message: string }>;
  setBalance(balance: number): void;
  sessions(): Promise<AuthSession[]>;
  endSession(id: number): Promise<void>;
}

export const DEMO_BASE_BALANCE = 10_000;

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  signedIn: false,
  loading: true,
  error: null,
  balance: DEMO_BASE_BALANCE,

  async bootstrap() {
    const { computeBalance } = await import('../store/botStore');
    const balance = await computeBalance(DEMO_BASE_BALANCE);
    set({ balance, loading: false });
  },

  async register({ email, password, firstName, lastName, country }) {
    const existing = await db.profiles.where('email').equals(email.toLowerCase()).first();
    if (existing) {
      set({ error: 'An account with this email already exists (local demo).' });
      return false;
    }
    const passwordHash = await hashPassword(password);
    const profile: Profile = {
      id: 'local',
      email: email.toLowerCase(),
      firstName,
      lastName,
      country,
      phone: '',
      currency: 'USD',
      createdAt: Date.now(),
      passwordHash,
    };
    await db.profiles.put(profile);
    await db.authSessions.add({
      profileId: 'local',
      startedAt: Date.now(),
      lastSeenAt: Date.now(),
      userAgent: navigator.userAgent,
      active: true,
    });
    await audit('auth.register', `Local demo account created for ${email}`);
    await notify('success', 'Welcome to the demo', 'Your local demo account is ready. Everything is simulated.');
    set({ profile, signedIn: true, error: null });
    return true;
  },

  async login(email, password) {
    const profile = await db.profiles.where('email').equals(email.toLowerCase()).first();
    const hash = await hashPassword(password);
    if (!profile || profile.passwordHash !== hash) {
      set({ error: 'Invalid email or password (local demo).' });
      return false;
    }
    await db.authSessions.add({
      profileId: profile.id,
      startedAt: Date.now(),
      lastSeenAt: Date.now(),
      userAgent: navigator.userAgent,
      active: true,
    });
    await audit('auth.login', `Signed in as ${email}`);
    set({ profile, signedIn: true, error: null });
    return true;
  },

  async logout() {
    const p = get().profile;
    if (p) {
      await db.authSessions.where('profileId').equals(p.id).modify({ active: false, lastSeenAt: Date.now() });
      await audit('auth.logout', `Signed out ${p.email}`);
    }
    set({ profile: null, signedIn: false });
  },

  async updateProfile(patch) {
    const p = get().profile;
    if (!p) return;
    const updated = { ...p, ...patch };
    await db.profiles.put(updated);
    await audit('profile.update', `Updated profile fields: ${Object.keys(patch).join(', ')}`);
    set({ profile: updated });
  },

  async changePassword(current, next) {
    const p = get().profile;
    if (!p) return { ok: false, message: 'Not signed in.' };
    const curHash = await hashPassword(current);
    if (p.passwordHash && p.passwordHash !== curHash) {
      return { ok: false, message: 'Current password is incorrect.' };
    }
    if (next.length < 6) return { ok: false, message: 'New password must be at least 6 characters.' };
    const nextHash = await hashPassword(next);
    await db.profiles.put({ ...p, passwordHash: nextHash });
    await audit('profile.password', 'Password changed (local demo)');
    await notify('success', 'Password updated', 'Your local demo password was changed.');
    return { ok: true, message: 'Password updated.' };
  },

  setBalance(balance) {
    set({ balance });
  },

  async sessions() {
    return db.authSessions.orderBy('startedAt').reverse().toArray();
  },

  async endSession(id) {
    await db.authSessions.update(id, { active: false, lastSeenAt: Date.now() });
    await audit('auth.session_end', `Session ${id} ended`);
  },
}));

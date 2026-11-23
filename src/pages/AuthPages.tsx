/** Signup + Login pages — modeled on the Deriv signup reference. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COUNTRIES, isEmail, isPassword, required } from '../lib/validation';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Spinner } from '../components/ui/kit';
import { DerivLogo } from '../components/layout/SiteHeader';

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-white dark:bg-deriv-dark-2">
      {/* Brand panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-deriv-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-deriv-red/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-deriv-teal/25 blur-3xl" />
        </div>
        <div className="relative">
          <DerivLogo light />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Trading for anyone.
            <br />
            Anywhere. Anytime.
          </h2>
          <p className="mt-4 max-w-sm text-white/70">
            Practise with a zero-risk demo account. Simulated markets, virtual balance, full platform experience.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-white/60">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">💬</span>
          Ask Amy — 24/7 help
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();

  const emailOk = isEmail(email);
  const passwordOk = isPassword(password);
  const namesOk = required(firstName) && required(lastName);
  const countryOk = required(country);
  const valid = emailOk && passwordOk && namesOk && countryOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    const ok = await register({ email, password, firstName, lastName, country });
    setBusy(false);
    if (ok) {
      toast('success', 'Welcome!', 'Your local demo account is ready.');
      navigate('/account');
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-deriv-ink dark:text-white">Join 3M+ global traders</h1>
      <p className="mt-2 text-sm text-deriv-muted">
        Tell us where you live. We&apos;ll show you the products and services available in your region.{' '}
        <span className="block pt-1 text-xs text-deriv-muted/80">Demo only — all information stays in your browser.</span>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="firstName">First name</label>
            <input id="firstName" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" />
            {touched && !namesOk && <p className="mt-1 text-xs text-loss">Required</p>}
          </div>
          <div>
            <label className="label" htmlFor="lastName">Last name</label>
            <input id="lastName" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Morgan" />
            {touched && !namesOk && <p className="mt-1 text-xs text-loss">Required</p>}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="country">Country/region</label>
          <select id="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {touched && !countryOk && <p className="mt-1 text-xs text-loss">Please select your country</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {touched && !emailOk && <p className="mt-1 text-xs text-loss">Enter a valid email</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          {touched && !passwordOk && <p className="mt-1 text-xs text-loss">At least 6 characters</p>}
        </div>

        {error && <p className="rounded-btn bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

        <button type="submit" className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner size={18} /> : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-deriv-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-deriv-red hover:underline">Log in</Link>
      </p>
      <p className="mt-4 text-center text-xs leading-relaxed text-deriv-muted/70">
        By signing up you agree that this is a local educational demo. No real accounts, no real money, no data leaves
        your browser.
      </p>
    </AuthShell>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) {
      toast('success', 'Welcome back', 'Signed in to the local demo.');
      navigate('/account');
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-deriv-ink dark:text-white">Log in</h1>
      <p className="mt-2 text-sm text-deriv-muted">Access your local demo account.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="lemail">Email</label>
          <input id="lemail" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="lpassword">Password</label>
          <input id="lpassword" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>

        {error && <p className="rounded-btn bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

        <button type="submit" className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner size={18} /> : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-deriv-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-deriv-red hover:underline">Sign up</Link>
      </p>
    </AuthShell>
  );
}

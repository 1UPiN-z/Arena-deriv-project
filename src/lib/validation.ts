/** Small validation helpers for forms. */

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isPassword(v: string): boolean {
  return v.length >= 6;
}

export function required(v: string): boolean {
  return v.trim().length > 0;
}

export function isNumeric(v: string | number): boolean {
  return Number.isFinite(Number(v)) && String(v).trim() !== '';
}

export const COUNTRIES = [
  'Kenya',
  'South Africa',
  'Nigeria',
  'Ghana',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'India',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Thailand',
  'Vietnam',
  'Brazil',
  'Mexico',
  'Argentina',
  'United Arab Emirates',
  'Saudi Arabia',
  'Australia',
  'New Zealand',
  'Canada',
  'United States (demo)',
  'Other',
];

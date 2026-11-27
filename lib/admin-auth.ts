import 'server-only';

// Strictly lock Super Admin access to the Founder's primary email (+ explicit ADMIN_EMAILS env var).
// Never add test or generic emails here so regular individual signups can never receive Admin privileges.
const DEFAULT_SUPER_ADMIN_EMAILS = [
  'abdallahelzamly200393@gmail.com',
];

export function getSuperAdminEmails(): string[] {
  const rawEnv = process.env.ADMIN_EMAILS || '';
  const fromEnv = rawEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_SUPER_ADMIN_EMAILS, ...fromEnv]));
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getSuperAdminEmails().includes(normalized);
}

import 'server-only';

const DEFAULT_SUPER_ADMIN_EMAILS = [
  'abdallahelzamly200393@gmail.com',
  'abdallahelzamly@gmail.com',
  '56141320+abdallahelzamly@users.noreply.github.com',
  'admin@kuwi.com',
  'admin@cards-platform.local',
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

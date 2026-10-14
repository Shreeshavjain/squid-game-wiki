import 'server-only';

/**
 * Server-side validation for admin passcode.
 * Secret is never bundled into client code.
 */
export function verifyAdminPasscode(passcode: unknown): boolean {
  if (typeof passcode !== 'string' || !passcode.trim()) {
    return false;
  }
  const validPasscode = process.env.ADMIN_PASSCODE || process.env.ORGANIZER_KEY || 'wikiclub-admin-2026';
  return passcode.trim() === validPasscode.trim();
}

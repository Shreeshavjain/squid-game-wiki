import 'server-only';
import crypto from 'crypto';

const getSecret = () =>
  (
    process.env.ORGANIZER_PASSCODE ||
    process.env.ORGANIZER_KEY ||
    process.env.ADMIN_PASSCODE ||
    'wikiclub-admin-2026'
  ).trim();

export function verifyEvaluatorPasscode(passcode: unknown): boolean {
  if (typeof passcode !== 'string' || !passcode.trim()) return false;
  return passcode.trim() === getSecret();
}

/**
 * Creates an HMAC-SHA256 signed session token for the HTTP-only cookie.
 * Valid for 24 hours.
 */
export function createEvaluatorSessionToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`evaluator:${timestamp}`).digest('hex');
  return `${timestamp}.${signature}`;
}

/**
 * Validates the HMAC signature and timestamp of the session token.
 */
export function verifyEvaluatorSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const timeNum = Number(timestamp);
  if (isNaN(timeNum)) return false;

  // Max session age: 24 hours
  if (Date.now() - timeNum > 24 * 60 * 60 * 1000) return false;

  const secret = getSecret();
  const expectedSignature = crypto.createHmac('sha256', secret).update(`evaluator:${timestamp}`).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Extracts and verifies the evaluator token from the request's HTTP cookies.
 */
export function isRequestAuthorizedAsEvaluator(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/evaluator_session=([^;]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
    if (verifyEvaluatorSessionToken(token)) return true;
  }

  // Fallback to custom header if provided
  const headerToken = request.headers.get('x-evaluator-token');
  if (headerToken && verifyEvaluatorSessionToken(headerToken)) return true;

  return false;
}

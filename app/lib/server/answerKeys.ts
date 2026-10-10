import 'server-only';

/**
 * ANSWER KEYS — SERVER ONLY
 * =========================
 * `server-only` makes the build fail if this file is ever imported from client
 * code, so the keys never reach the browser bundle (and can't be found with
 * Inspect). Scoring happens in the /api/quiz/<tier>/score route handlers.
 */
export const MEDIUM_ANSWER_KEY: Readonly<Record<string, string>> = {
  q1: 'B',
  q2: 'A',
  q3: 'A',
  q4: 'B',
  q5: 'C',
};

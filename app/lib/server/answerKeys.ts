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

/**
 * Easy is typed, so each question lists accepted keywords instead of one
 * option. An answer is correct when it contains any of them, ignoring case.
 */
export const EASY_ANSWER_KEY: Readonly<Record<string, readonly string[]>> = {
  q1: ['mysql', 'mariadb'],
  q2: ['nodejs', 'node.js'],
  q3: ['docker'],
  q4: ['llama'],
  q5: ['kubernetes', 'k8s'],
  q6: ['linux'],
  q7: ['fork'],
  q8: ['commit'],
  q9: ['branch'],
  q10: ['merge'],
};

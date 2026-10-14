import { correctQuestionScore } from '../../../../lib/server/db';

/**
 * Organizer passphrase for score corrections.
 * In production this should come from an environment variable;
 * for the event this hardcoded value is acceptable.
 */
const ORGANIZER_KEY = process.env.ORGANIZER_KEY || 'wikiclub-correct-2026';

/**
 * POST /api/quiz/hard/correct
 * Body: { teamName, questionId, correctedPoints, organizerKey }
 *
 * Allows authorized organisers to manually correct the points awarded for
 * a specific Hard quiz question. The correction is logged, the original
 * auto-evaluation is preserved for auditing, and the total score is
 * recalculated.
 *
 * Server-side authorization: the `organizerKey` must match the configured
 * passphrase. Requests without a valid key are rejected with 403.
 */
export async function POST(request: Request) {
  let body: {
    action?: unknown;
    teamName?: unknown;
    questionId?: unknown;
    correctedPoints?: unknown;
    organizerKey?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, teamName, questionId, correctedPoints, organizerKey } = body;

  // ── Authorization ──
  const validOrganizerKey = (
    process.env.ORGANIZER_PASSCODE ||
    process.env.ORGANIZER_KEY ||
    process.env.ADMIN_PASSCODE ||
    'wikiclub-correct-2026'
  ).trim();

  if (typeof organizerKey !== 'string' || organizerKey.trim() !== validOrganizerKey) {
    return Response.json({ error: 'Unauthorized: invalid organizer key' }, { status: 403 });
  }

  if (action === 'verify') {
    return Response.json({ ok: true, verified: true });
  }

  // ── Validation ──
  if (typeof teamName !== 'string' || !teamName.trim()) {
    return Response.json({ error: 'Missing teamName' }, { status: 400 });
  }
  if (typeof questionId !== 'string' || !questionId.trim()) {
    return Response.json({ error: 'Missing questionId' }, { status: 400 });
  }
  if (typeof correctedPoints !== 'number' || !Number.isFinite(correctedPoints)) {
    return Response.json({ error: 'correctedPoints must be a finite number' }, { status: 400 });
  }

  const result = await correctQuestionScore(teamName, questionId, correctedPoints);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, newScore: result.newScore });
}

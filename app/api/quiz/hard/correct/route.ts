import { correctQuestionScore, saveAllEvaluatorGrades } from '../../../../lib/server/db';
import { EvaluatorDecision } from '../../../../types/quiz';

/**
 * POST /api/quiz/hard/correct
 * Batch Body:  { teamName, organizerKey, decisions: { q1: 'correct', q2: 'wrong', ... } }
 * Single Body: { teamName, questionId, correctedPoints, organizerKey }
 *
 * Allows authorized organisers to manually evaluate or correct points awarded for
 * Hard quiz questions. Supports saving all evaluations in one batch operation.
 */
export async function POST(request: Request) {
  let body: {
    action?: unknown;
    teamName?: unknown;
    questionId?: unknown;
    correctedPoints?: unknown;
    organizerKey?: unknown;
    decisions?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, teamName, questionId, correctedPoints, organizerKey, decisions } = body;

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

  // Batch Save All Evaluations
  if (decisions && typeof decisions === 'object') {
    const rawDecisions = decisions as Record<string, unknown>;
    const decisionsMap: Record<string, EvaluatorDecision> = {};
    for (const [qid, val] of Object.entries(rawDecisions)) {
      if (val === 'correct' || val === 30 || val === '30') decisionsMap[qid] = 'correct';
      else if (val === 'wrong' || val === -20 || val === '-20') decisionsMap[qid] = 'wrong';
      else decisionsMap[qid] = 'ungraded';
    }
    const result = await saveAllEvaluatorGrades(teamName, decisionsMap);
    if (!result.success) {
      return Response.json({ error: result.error || 'Failed to save evaluations' }, { status: 400 });
    }
    return Response.json({ ok: true, newScore: result.newScore, evaluatorGrades: result.evaluatorGrades });
  }

  // Single Question Correction (legacy fallback)
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

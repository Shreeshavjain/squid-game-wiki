import { recordSubmission } from '../../../lib/server/db';

// Tiers without an answer key — graded by hand, so only the answers are stored
const MANUAL_TIERS = ['easy', 'hard'] as const;

/**
 * POST /api/quiz/submit
 * Body: { teamName: 'Red Light', tier: 'easy' | 'hard', answers: { q1: '...', ... } }
 *
 * Saves a manually graded quiz's final answers; the score stays null until graded.
 */
export async function POST(request: Request) {
  let body: { teamName?: unknown; tier?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { teamName, tier, answers } = body;
  if (
    typeof teamName !== 'string' ||
    !teamName.trim() ||
    !MANUAL_TIERS.includes(tier as never) ||
    typeof answers !== 'object' ||
    answers === null
  ) {
    return Response.json(
      { error: "Expected { teamName: string, tier: 'easy' | 'hard', answers: { [questionId]: string } }" },
      { status: 400 }
    );
  }

  await recordSubmission(teamName, tier as (typeof MANUAL_TIERS)[number], answers as Record<string, string>);
  return Response.json({ ok: true });
}

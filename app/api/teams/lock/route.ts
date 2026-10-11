import { lockDifficulty } from '../../../lib/server/db';

const TIERS = ['easy', 'medium', 'hard'] as const;

/**
 * POST /api/teams/lock
 * Body: { teamName: 'Red Light', difficulty: 'easy' | 'medium' | 'hard' }
 *
 * Records the difficulty a team locked. The first lock is final.
 */
export async function POST(request: Request) {
  let body: { teamName?: unknown; difficulty?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { teamName, difficulty } = body;
  if (typeof teamName !== 'string' || !teamName.trim() || !TIERS.includes(difficulty as never)) {
    return Response.json({ error: "Expected { teamName: string, difficulty: 'easy' | 'medium' | 'hard' }" }, { status: 400 });
  }

  await lockDifficulty(teamName, difficulty as (typeof TIERS)[number]);
  return Response.json({ ok: true });
}

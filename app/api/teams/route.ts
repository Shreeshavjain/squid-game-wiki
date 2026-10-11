import { enrollTeam } from '../../lib/server/db';

/**
 * POST /api/teams
 * Body: { teamName: 'Red Light' }
 *
 * Enrolls a team in the database when it enters the arena.
 */
export async function POST(request: Request) {
  let teamName: unknown;
  try {
    ({ teamName } = await request.json());
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof teamName !== 'string' || !teamName.trim()) {
    return Response.json({ error: 'Expected { teamName: string }' }, { status: 400 });
  }

  await enrollTeam(teamName);
  return Response.json({ ok: true });
}

import { verifyAdminPasscode } from '../../../lib/server/adminAuth';
import { getAdminLeaderboard } from '../../../lib/server/db';

/**
 * GET /api/admin/leaderboard
 * Headers:
 *   x-admin-passcode: <passcode>
 *   (or Authorization: Bearer <passcode>)
 *
 * Protected live leaderboard data source for organizers.
 * Sensitive fields (participant answers, model answers, credentials) are never exposed.
 */
export async function GET(request: Request) {
  const customHeader = request.headers.get('x-admin-passcode');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const passcode = customHeader || bearerToken;

  if (!verifyAdminPasscode(passcode)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leaderboard = await getAdminLeaderboard();
    return Response.json({ ok: true, leaderboard, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to retrieve leaderboard:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

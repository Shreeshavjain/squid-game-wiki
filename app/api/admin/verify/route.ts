import { verifyAdminPasscode } from '../../../lib/server/adminAuth';

/**
 * POST /api/admin/verify
 * Body: { passcode: '...' }
 *
 * Verifies admin passcode on the server.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (!verifyAdminPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid admin passcode' }, { status: 401 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }
}

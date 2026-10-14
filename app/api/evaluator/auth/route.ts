import { verifyEvaluatorPasscode, createEvaluatorSessionToken } from '../../../lib/server/evaluatorAuth';

/**
 * POST /api/evaluator/auth
 * Body: { passcode: '...' }
 *
 * Validates evaluator passcode and sets a secure, signed HTTP-only cookie.
 */
export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    if (!verifyEvaluatorPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid evaluator passcode' }, { status: 401 });
    }

    const token = createEvaluatorSessionToken();
    const isProduction = process.env.NODE_ENV === 'production';

    const response = Response.json({ ok: true, message: 'Evaluator authenticated' });
    response.headers.set(
      'Set-Cookie',
      `evaluator_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${
        isProduction ? '; Secure' : ''
      }`
    );

    return response;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * POST /api/evaluator/logout
 * Clears the HTTP-only evaluator session cookie.
 */
export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = Response.json({ ok: true, message: 'Evaluator logged out' });
  response.headers.set(
    'Set-Cookie',
    `evaluator_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`
  );
  return response;
}

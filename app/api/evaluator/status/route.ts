import { isRequestAuthorizedAsEvaluator } from '../../../lib/server/evaluatorAuth';

/**
 * GET /api/evaluator/status
 * Verifies if the incoming request has a valid evaluator session cookie.
 */
export async function GET(request: Request) {
  const isAuthed = isRequestAuthorizedAsEvaluator(request);
  return Response.json({ authenticated: isAuthed });
}

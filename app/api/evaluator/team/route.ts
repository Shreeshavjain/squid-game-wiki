import { isRequestAuthorizedAsEvaluator } from '../../../lib/server/evaluatorAuth';
import { getTeamRecord } from '../../../lib/server/db';
import { HARD_MODEL_ANSWERS } from '../../../lib/server/answerKeys';

/**
 * GET /api/evaluator/team?teamName=...
 * Protected route for evaluators to fetch a team's answers and current grades.
 */
export async function GET(request: Request) {
  if (!isRequestAuthorizedAsEvaluator(request)) {
    return Response.json({ error: 'Unauthorized: valid evaluator session required' }, { status: 401 });
  }

  const url = new URL(request.url);
  const teamName = url.searchParams.get('teamName');

  if (!teamName || !teamName.trim()) {
    return Response.json({ error: 'Missing teamName parameter' }, { status: 400 });
  }

  const team = await getTeamRecord(teamName);
  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  return Response.json({
    ok: true,
    teamName: team.teamName,
    difficulty: team.difficulty,
    answers: team.answers || {},
    modelAnswers: HARD_MODEL_ANSWERS,
    evaluatorGrades: team.evaluatorGrades || {},
    autoResults: team.autoResults || {},
    score: team.score,
    maxScore: team.maxScore ?? 150,
    submittedAt: team.submittedAt ? team.submittedAt.toISOString() : null,
  });
}

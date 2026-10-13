import { getTeamResults } from '../../../../lib/server/db';

/**
 * GET /api/quiz/hard/results?teamName=…
 *
 * Returns a team's Hard quiz results from MongoDB: score, per-question
 * auto-evaluation results (with any organizer corrections applied),
 * model answers, submitted answers, and correction history.
 *
 * Used by the results page to display data after a page refresh
 * (when localStorage may no longer have the full server response).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamName = url.searchParams.get('teamName');

  if (!teamName?.trim()) {
    return Response.json({ error: 'Missing teamName query parameter' }, { status: 400 });
  }

  const team = await getTeamResults(teamName);

  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }

  if (team.difficulty !== 'hard') {
    return Response.json({ error: 'Team did not take the Hard quiz' }, { status: 400 });
  }

  if (!team.submittedAt) {
    return Response.json({ error: 'Team has not submitted yet' }, { status: 400 });
  }

  return Response.json({
    teamName: team.teamName,
    score: team.score,
    maxScore: team.maxScore,
    answers: team.answers,
    results: team.autoResults,
    modelAnswers: team.modelAnswers,
    originalAutoResults: team.originalAutoResults,
    corrections: team.corrections,
  });
}

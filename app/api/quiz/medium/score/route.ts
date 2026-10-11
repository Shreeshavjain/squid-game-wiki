import { MEDIUM_ANSWER_KEY } from '../../../../lib/server/answerKeys';
import { DIFFICULTY_TIERS } from '../../../../data/difficultyTiers';
import { recordSubmission } from '../../../../lib/server/db';

const MEDIUM_SCORING = DIFFICULTY_TIERS.find((t) => t.id === 'medium')!.scoring!;

/**
 * POST /api/quiz/medium/score
 * Body: { teamName: 'Red Light', answers: { q1: 'A', ... } }
 *
 * Grades on the server against the hidden key and saves the score to the
 * team's record. Returns the total plus, per question, whether the team's
 * answer was right and the points it earned — but never the correct option
 * itself. Unanswered questions count as wrong.
 */
export async function POST(request: Request) {
  let teamName: unknown;
  let answers: unknown;
  try {
    ({ teamName, answers } = await request.json());
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof teamName !== 'string' || !teamName.trim() || typeof answers !== 'object' || answers === null) {
    return Response.json({ error: 'Expected { teamName: string, answers: { [questionId]: option } }' }, { status: 400 });
  }

  const submitted = answers as Record<string, unknown>;
  const questionIds = Object.keys(MEDIUM_ANSWER_KEY);
  const results = Object.fromEntries(
    questionIds.map((id) => {
      const correct = submitted[id] === MEDIUM_ANSWER_KEY[id];
      return [id, { correct, points: correct ? MEDIUM_SCORING.correct : MEDIUM_SCORING.wrong }];
    })
  );

  const score = Object.values(results).reduce((sum, r) => sum + r.points, 0);
  const maxScore = questionIds.length * MEDIUM_SCORING.correct;
  await recordSubmission(teamName, 'medium', submitted as Record<string, string>, { score, maxScore });

  return Response.json({ score, maxScore, results });
}

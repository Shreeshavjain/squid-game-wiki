import { EASY_ANSWER_KEY } from '../../../../lib/server/answerKeys';
import { DIFFICULTY_TIERS } from '../../../../data/difficultyTiers';
import { recordSubmission } from '../../../../lib/server/db';

const EASY_SCORING = DIFFICULTY_TIERS.find((t) => t.id === 'easy')!.scoring!;

/**
 * POST /api/quiz/easy/score
 * Body: { teamName: 'Red Light', answers: { q1: 'MySQL', q2: '', ... } }
 *
 * Grades typed answers on the server: correct when the answer contains one of
 * the question's keywords (any case). Skipped (empty) answers score 0 and are
 * flagged so the report can show them apart from wrong ones. Saves the score
 * to the team's record and never returns the keywords themselves.
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
    return Response.json({ error: 'Expected { teamName: string, answers: { [questionId]: string } }' }, { status: 400 });
  }

  const submitted = answers as Record<string, unknown>;
  const questionIds = Object.keys(EASY_ANSWER_KEY);
  const results = Object.fromEntries(
    questionIds.map((id) => {
      const answer = typeof submitted[id] === 'string' ? (submitted[id] as string).trim().toLowerCase() : '';
      if (!answer) return [id, { correct: false, skipped: true, points: 0 }];
      const correct = EASY_ANSWER_KEY[id].some((keyword) => answer.includes(keyword));
      return [id, { correct, points: correct ? EASY_SCORING.correct : EASY_SCORING.wrong }];
    })
  );

  const score = Object.values(results).reduce((sum, r) => sum + r.points, 0);
  const maxScore = questionIds.length * EASY_SCORING.correct;
  await recordSubmission(teamName, 'easy', submitted as Record<string, string>, { score, maxScore });

  return Response.json({ score, maxScore, results });
}

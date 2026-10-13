import { HARD_QUESTION_IDS, evaluateHardAnswer } from '../../../../lib/server/answerKeys';
import { DIFFICULTY_TIERS } from '../../../../data/difficultyTiers';
import { recordSubmission } from '../../../../lib/server/db';

const HARD_SCORING = DIFFICULTY_TIERS.find((t) => t.id === 'hard')!.scoring!;

/**
 * POST /api/quiz/hard/score
 * Body: { teamName: 'Sang-Woo Consortium', answers: { q1: '...', q2: '...', ... } }
 *
 * Grades Hard round answers on the server against the official answer key
 * from "docs/Hard_Level_Questions (1).pdf".
 * Scoring follows DIFFICULTY_TIERS: +30 for correct, -20 for wrong (max 150 points, min -100 points).
 * Records final answers and calculated score to MongoDB.
 * Returns { score, maxScore, results } without leaking answer keys.
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
    return Response.json(
      { error: 'Expected { teamName: string, answers: { [questionId]: string } }' },
      { status: 400 }
    );
  }

  const submitted = answers as Record<string, unknown>;
  const questionIds = HARD_QUESTION_IDS;
  const results = Object.fromEntries(
    questionIds.map((id) => {
      const raw = typeof submitted[id] === 'string' ? (submitted[id] as string) : '';
      const evaluation = evaluateHardAnswer(id, raw);
      if (evaluation.skipped) {
        return [id, { correct: false, skipped: true, points: 0 }];
      }
      return [
        id,
        {
          correct: evaluation.correct,
          points: evaluation.correct ? HARD_SCORING.correct : HARD_SCORING.wrong,
        },
      ];
    })
  );

  const score = Object.values(results).reduce((sum, r) => sum + r.points, 0);
  const maxScore = questionIds.length * HARD_SCORING.correct;
  await recordSubmission(teamName, 'hard', submitted as Record<string, string>, { score, maxScore });

  return Response.json({ score, maxScore, results });
}

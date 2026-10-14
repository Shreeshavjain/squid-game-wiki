import { HARD_QUESTION_IDS, HARD_MODEL_ANSWERS, evaluateHardAnswer } from '../../../../lib/server/answerKeys';
import { DIFFICULTY_TIERS } from '../../../../data/difficultyTiers';
import { QuestionResult, getTeamRecord, recordSubmission } from '../../../../lib/server/db';

const HARD_SCORING = DIFFICULTY_TIERS.find((t) => t.id === 'hard')!.scoring!;

/**
 * POST /api/quiz/hard/score
 * Body: { teamName: 'Sang-Woo Consortium', answers: { q1: '...', q2: '...', ... } }
 *
 * Grades Hard round answers on the server against the official answer key
 * and keyword-matching rules from "docs/Hard_Level_Questions (1).pdf".
 * Scoring follows DIFFICULTY_TIERS: +30 for correct, -20 for wrong (max 150 points).
 * Skipped answers score 0 points (no deduction).
 * Records final answers, calculated score, per-question results, and model answers to MongoDB.
 * Returns { score, maxScore, results, modelAnswers } without leaking answer keys.
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

  const existingTeam = await getTeamRecord(teamName);
  const evaluatorGrades = existingTeam?.evaluatorGrades ?? {};

  const results: Record<string, QuestionResult> = {};
  for (const id of questionIds) {
    if (evaluatorGrades[id]) {
      const g = evaluatorGrades[id];
      results[id] = {
        correct: g.points > 0,
        points: g.points,
        skipped: g.decision === 'ungraded',
        needsReview: false,
      };
    } else {
      const raw = typeof submitted[id] === 'string' ? (submitted[id] as string) : '';
      const evaluation = evaluateHardAnswer(id, raw);
      if (evaluation.skipped) {
        results[id] = { correct: false, skipped: true, points: 0 };
      } else if (evaluation.correct) {
        results[id] = {
          correct: true,
          points: HARD_SCORING.correct,
        };
      } else {
        results[id] = {
          correct: false,
          points: HARD_SCORING.wrong,
        };
      }
    }
  }

  const score = Object.values(results).reduce((sum, r) => sum + r.points, 0);
  const maxScore = questionIds.length * HARD_SCORING.correct;

  // Build a copy of model answers keyed by question ID
  const modelAnswers: Record<string, string> = {};
  for (const id of questionIds) {
    modelAnswers[id] = HARD_MODEL_ANSWERS[id] ?? '';
  }

  await recordSubmission(teamName, 'hard', submitted as Record<string, string>, {
    score,
    maxScore,
    autoResults: results,
    modelAnswers,
  });

  return Response.json({ score, maxScore, results, modelAnswers });
}

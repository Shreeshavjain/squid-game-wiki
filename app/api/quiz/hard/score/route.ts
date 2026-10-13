import { HARD_QUESTION_IDS, HARD_MODEL_ANSWERS } from '../../../../lib/server/answerKeys';
import { DIFFICULTY_TIERS } from '../../../../data/difficultyTiers';
import { QuestionResult, recordSubmission } from '../../../../lib/server/db';
import { evaluateHardQuizBatchWithGemini } from '../../../../lib/server/geminiEvaluator';

const HARD_SCORING = DIFFICULTY_TIERS.find((t) => t.id === 'hard')!.scoring!;

/**
 * POST /api/quiz/hard/score
 * Body: { teamName: 'Sang-Woo Consortium', answers: { q1: '...', q2: '...', ... } }
 *
 * Grades Hard round answers on the server using Gemini (@google/genai SDK)
 * in a SINGLE batched API request against the official questions, model answers,
 * and grading criteria from "docs/Hard_Level_Questions (1).pdf".
 *
 * Scoring follows DIFFICULTY_TIERS: +30 for correct, -20 for wrong (max 150 points).
 * Gemini judges semantic meaning, synonyms, and factual correctness, returning
 * an independent structured decision per question ('correct' | 'incorrect' | 'needs_review').
 * Points and totals are calculated entirely by the application.
 *
 * On API timeout, quota error, or service outage, questions are flagged with
 * needsReview: true for manual review instead of silently awarding zero points.
 * Records final answers, calculated score, per-question results, and model answers to MongoDB.
 * Returns { score, maxScore, results, modelAnswers } without leaking API keys or secrets.
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

  // Single batched Gemini evaluation for all submitted answers (1 API call per team)
  const batchEvaluation = await evaluateHardQuizBatchWithGemini(submitted);

  const results: Record<string, QuestionResult> = {};
  for (const id of questionIds) {
    const item = batchEvaluation[id];
    if (item?.skipped) {
      results[id] = { correct: false, skipped: true, points: 0 };
    } else if (item?.decision === 'correct') {
      results[id] = {
        correct: true,
        points: HARD_SCORING.correct,
      };
    } else if (item?.decision === 'incorrect') {
      results[id] = {
        correct: false,
        points: HARD_SCORING.wrong,
      };
    } else {
      // 'needs_review': safe manual-review fallback (API error, quota, or ambiguous answer)
      results[id] = {
        correct: false,
        points: 0,
        needsReview: true,
        reviewReason: item?.reason || 'Flagged for organizer review',
      };
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


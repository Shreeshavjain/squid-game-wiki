import { isRequestAuthorizedAsEvaluator } from '../../../lib/server/evaluatorAuth';
import { saveEvaluatorGrade } from '../../../lib/server/db';
import { EvaluatorDecision } from '../../../types/quiz';

/**
 * POST /api/evaluator/grade
 * Body: { teamName: '...', questionId: 'q1', decision: 'correct' | 'wrong' | 'ungraded' }
 *
 * Saves an evaluator's manual decision for a question, recomputes total score
 * from the five question decisions, and updates MongoDB immediately.
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedAsEvaluator(request)) {
    return Response.json({ error: 'Unauthorized: valid evaluator session required' }, { status: 401 });
  }

  try {
    const { teamName, questionId, decision } = await request.json();

    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      return Response.json({ error: 'Missing teamName' }, { status: 400 });
    }

    if (!questionId || typeof questionId !== 'string' || !['q1', 'q2', 'q3', 'q4', 'q5'].includes(questionId)) {
      return Response.json({ error: 'Invalid questionId' }, { status: 400 });
    }

    if (!['correct', 'wrong', 'ungraded'].includes(decision)) {
      return Response.json({ error: 'Invalid decision: expected "correct", "wrong", or "ungraded"' }, { status: 400 });
    }

    const result = await saveEvaluatorGrade(teamName, questionId, decision as EvaluatorDecision);
    if (!result.success) {
      return Response.json({ error: result.error || 'Failed to save grade' }, { status: 400 });
    }

    return Response.json({
      ok: true,
      newScore: result.newScore,
      evaluatorGrades: result.evaluatorGrades,
    });
  } catch (err) {
    console.error('Error saving evaluator grade:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

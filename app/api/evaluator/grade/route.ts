import { isRequestAuthorizedAsEvaluator } from '../../../lib/server/evaluatorAuth';
import { saveEvaluatorGrade, saveAllEvaluatorGrades } from '../../../lib/server/db';
import { EvaluatorDecision } from '../../../types/quiz';

/**
 * POST /api/evaluator/grade
 * Batch Body:  { teamName: '...', decisions: { q1: 'correct', q2: 'wrong', ... } }
 * Single Body: { teamName: '...', questionId: 'q1', decision: 'correct' | 'wrong' | 'ungraded' }
 *
 * Saves evaluator manual decision(s), recomputes total score across all 5 questions,
 * and updates MongoDB immediately. Unmarked questions default to 0 points.
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedAsEvaluator(request)) {
    return Response.json({ error: 'Unauthorized: valid evaluator session required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamName, questionId, decision, decisions } = body;

    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      return Response.json({ error: 'Missing teamName' }, { status: 400 });
    }

    // Batch evaluation (Save All Evaluations)
    if (decisions && typeof decisions === 'object') {
      const result = await saveAllEvaluatorGrades(teamName, decisions);
      if (!result.success) {
        return Response.json({ error: result.error || 'Failed to save grades' }, { status: 400 });
      }
      return Response.json({
        ok: true,
        newScore: result.newScore,
        evaluatorGrades: result.evaluatorGrades,
      });
    }

    // Single question fallback
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

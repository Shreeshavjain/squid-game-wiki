import 'server-only';
import { GoogleGenAI, Type } from '@google/genai';
import { HARD_MODEL_ANSWERS, HARD_QUESTION_IDS } from './answerKeys';

export type CorrectnessDecision = 'correct' | 'incorrect' | 'needs_review';

export interface HardQuestionEvaluation {
  decision: CorrectnessDecision;
  reason: string;
}

export interface HardQuizQuestionResult {
  decision: CorrectnessDecision;
  reason: string;
  skipped: boolean;
}

export interface HardQuestionMetadata {
  id: string;
  title: string;
  question: string;
  context: string;
  modelAnswer: string;
  criteria: string;
}

/**
 * Official Hard Question specifications, model answers, and evaluation criteria.
 * Transcribed from "docs/Hard_Level_Questions (1).pdf".
 */
export const HARD_QUESTION_CRITERIA: Readonly<Record<string, HardQuestionMetadata>> = {
  q1: {
    id: 'q1',
    title: 'Emoji → Programming Language',
    question: 'Name the programming language each emoji represents: (a) ☕, (b) 💎, (c) 🐹, (d) 🐦, (e) 🐪',
    context: '(a) ☕ (steaming coffee cup), (b) 💎 (gemstone), (c) 🐹 (gopher mascot), (d) 🐦 (swift bird logo), (e) 🐪 (camel mascot)',
    modelAnswer: HARD_MODEL_ANSWERS.q1,
    criteria: `The participant must identify the programming language represented by each emoji:
(a) Java
(b) Ruby
(c) Go (or Golang)
(d) Swift
(e) Perl

Grading rules:
- Judge semantic correctness and allow synonyms or alternate accepted names (e.g., "Golang" for Go).
- If at least 4 of the 5 languages are correctly identified, mark "correct".
- If fewer than 3 languages are correctly identified, mark "incorrect".
- If exactly 3 languages are correctly identified or the answer is ambiguous, mark "needs_review".`,
  },
  q2: {
    id: 'q2',
    title: 'Who Am I?',
    question: 'Who am I, and what are the two creations?',
    context: 'Started a hobby project in 1991 that now runs most servers and Android phones; also created the version control tool everyone uses on GitHub.',
    modelAnswer: HARD_MODEL_ANSWERS.q2,
    criteria: `The participant must identify:
1. Person: Linus Torvalds (or Linus Benedict Torvalds).
2. Two creations: Linux (operating system / kernel) and Git (distributed version control system).

Grading rules:
- Judge semantic meaning, synonyms, and factual accuracy.
- CRITICAL FACTUAL ACCURACY: An answer that mentions expected keywords like "Linux" or "Git" but attributes them to the wrong person (e.g. "Bill Gates created Linux and Git" or "Steve Jobs") MUST be marked "incorrect".
- If the participant correctly identifies Linus Torvalds and both creations (or semantically describes Linux and Git), mark "correct".
- If the participant identifies the person but misses or misidentifies the creations (or vice versa), mark "needs_review".
- If both the person and creations are completely wrong or missing, mark "incorrect".`,
  },
  q3: {
    id: 'q3',
    title: 'Switch Puzzle',
    question: 'Three switches outside a closed room control three bulbs inside. You can enter the room only once. How do you find which switch controls which bulb?',
    context: 'Three switches outside, three bulbs inside. Can enter the room only once.',
    modelAnswer: HARD_MODEL_ANSWERS.q3,
    criteria: `The participant's solution must describe the two-factor test using light and heat/temperature:
1. Turn switch 1 ON and wait (e.g., 5–10 minutes) so the bulb heats up.
2. Turn switch 1 OFF, then turn switch 2 ON (leaving switch 3 OFF).
3. Enter the room once and observe:
   - Lit bulb = Switch 2
   - Unlit but warm/hot bulb = Switch 1
   - Unlit and cold bulb = Switch 3

Grading rules:
- Judge conceptual understanding and semantic meaning. Accept different labeling of switches (e.g. A/B/C or 1/2/3) and synonyms for temperature (warm, hot, heat, thermal).
- If the explanation correctly employs the state + heat deduction to determine all three bulbs in one entry, mark "correct".
- If the explanation fails to use heat/temperature, assumes multiple entries, or makes logically contradictory deductions, mark "incorrect" (even if words like "switch" and "bulb" are present).
- If the explanation is partially sound or ambiguous, mark "needs_review".`,
  },
  q4: {
    id: 'q4',
    title: 'The Binary Search That Never Ends (Python)',
    question: 'Find both bugs, and give an input where the code hangs and another where it returns the wrong answer.',
    context: `Python binary search implementation:
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low < high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid
        else:
            high = mid
    return -1`,
    modelAnswer: HARD_MODEL_ANSWERS.q4,
    criteria: `The participant must address:
1. Bug 1: Updating boundaries (low = mid and high = mid instead of low = mid + 1 and high = mid - 1), leading to an infinite loop / failure to advance.
2. Bug 2: Loop condition ('while low < high' instead of 'while low <= high'), which fails to check the final or single element.
3. Hanging input: an input where target causes low = mid when high - low == 1 (e.g. binary_search([1, 3, 5, 7], 7)).
4. Wrong answer input: an input where a valid target is not found (e.g. binary_search([5], 5) returning -1).

Grading rules:
- Judge conceptual understanding and semantic explanations. They do not need verbatim syntax if they explain the stagnant boundary update causing infinite loops, and the loop terminating before checking the final element, plus valid examples.
- If both bugs are accurately identified and valid inputs/scenarios are provided, mark "correct".
- If only one bug is identified or input examples are incomplete/ambiguous, mark "needs_review".
- If the bugs identified are completely erroneous, mark "incorrect".`,
  },
  q5: {
    id: 'q5',
    title: 'License Detective',
    question: 'Match each license to its key feature.',
    context: `Licenses: MIT, GPL v3, Apache 2.0, AGPL.
Features:
A. Anyone who modifies it and offers it as a network service must share their source
B. Very short and permissive, only requires keeping the copyright notice
C. Derivative works that are distributed must also be GPL (copyleft)
D. Permissive, but with an explicit patent grant`,
    modelAnswer: HARD_MODEL_ANSWERS.q5,
    criteria: `The official matches are:
- MIT → B (permissive, copyright notice only)
- GPL v3 → C (copyleft)
- Apache 2.0 → D (permissive with patent grant)
- AGPL → A (network service copyleft)

Grading rules:
- At least 3 of the 4 matches must be correct for "correct" (all 4 is ideal).
- If fewer than 2 matches are correct, mark "incorrect".
- If exactly 2 matches are correct or formatting is ambiguous, mark "needs_review".`,
  },
};

/**
 * Evaluates all submitted Hard questions for a team in a SINGLE batched Gemini API request.
 * - Skipped answers (empty / whitespace) are handled locally without calling Gemini.
 * - All answered questions are bundled into ONE structured API request.
 * - Gemini returns independent decisions per questionId.
 * - Missing or malformed decisions for any question fall back to 'needs_review' without affecting others.
 * - Bounded retries: 429 quota errors are NEVER retried. Transient errors (503/timeout) retry at most once.
 */
export async function evaluateHardQuizBatchWithGemini(
  submittedAnswers: Record<string, unknown>
): Promise<Record<string, HardQuizQuestionResult>> {
  const results: Record<string, HardQuizQuestionResult> = {};
  const answeredIds: string[] = [];
  const trimmedAnswers: Record<string, string> = {};

  for (const id of HARD_QUESTION_IDS) {
    const raw = typeof submittedAnswers[id] === 'string' ? (submittedAnswers[id] as string).trim() : '';
    if (!raw) {
      results[id] = { decision: 'needs_review', reason: 'No answer submitted (skipped)', skipped: true };
    } else {
      answeredIds.push(id);
      trimmedAnswers[id] = raw;
    }
  }

  // If the team skipped all questions, no API request is needed.
  if (answeredIds.length === 0) {
    return results;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    console.warn('[GeminiEvaluator] GEMINI_API_KEY is not set. Routing answered questions to needs_review.');
    for (const id of answeredIds) {
      results[id] = {
        decision: 'needs_review',
        reason: 'Gemini API key is not configured on server. Flagged for manual review.',
        skipped: false,
      };
    }
    return results;
  }

  const systemInstruction = `You are an expert impartial examiner grading a technical quiz.
You are provided with multiple questions that a participant has answered.
Your task is to independently evaluate EACH participant answer against its respective official question, model answer, and grading criteria.

Guidelines:
1. Evaluate each question strictly and independently. A participant's answer to one question must never influence another.
2. Judge semantic meaning, conceptual understanding, synonyms, and factual correctness rather than exact string or keyword matches.
3. Beware of keyword traps: if an answer mentions expected keywords but asserts incorrect facts (for example, attributing creations to the wrong person), you MUST mark it 'incorrect'.
4. Do NOT award points or calculate marks.
5. In the "evaluations" array, you MUST return one evaluation object for EVERY question provided, containing:
   - "questionId": the exact question ID (e.g. "q1", "q2")
   - "decision": exactly one of "correct", "incorrect", or "needs_review"
   - "reason": a concise explanation (1-2 sentences) of your evaluation.`;

  const prompt = `Official Questions, Model Answers, and Grading Criteria:
${answeredIds
  .map((id) => {
    const meta = HARD_QUESTION_CRITERIA[id];
    return `--- Question [${id}] ---
Title: ${meta.title}
Context: ${meta.context}
Official Question: ${meta.question}
Official Model Answer:
${meta.modelAnswer}
Grading Criteria:
${meta.criteria}`;
  })
  .join('\n\n')}

========================================
Participant's Submitted Answers:
${answeredIds
  .map((id) => {
    return `--- Answer [${id}] ---
${trimmedAnswers[id]}`;
  })
  .join('\n\n')}`;

  const maxAttempts = 2; // At most 1 initial attempt + 1 retry for transient errors
  let lastError: Error | null = null;
  let rawEvaluations: unknown[] | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API call timed out after 15000ms')), 15000);
      });

      const generatePromise = ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: {
                      type: Type.STRING,
                      enum: ['q1', 'q2', 'q3', 'q4', 'q5'],
                    },
                    decision: {
                      type: Type.STRING,
                      enum: ['correct', 'incorrect', 'needs_review'],
                    },
                    reason: {
                      type: Type.STRING,
                    },
                  },
                  required: ['questionId', 'decision', 'reason'],
                },
              },
            },
            required: ['evaluations'],
          },
          temperature: 0.1,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = response.text?.trim() || '';

      if (!text) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.evaluations)) {
        throw new Error('Malformed response: "evaluations" array missing');
      }

      rawEvaluations = parsed.evaluations;
      break; // Success
    } catch (err) {
      lastError = err as Error;
      const isQuotaError = /429|quota|resource_exhausted/i.test(lastError.message);

      console.warn(
        `[GeminiEvaluator] Batch attempt ${attempt}/${maxAttempts} failed:`,
        lastError.message
      );

      // CRITICAL: Do NOT repeatedly retry HTTP 429 quota-exceeded errors.
      if (isQuotaError) {
        console.warn('[GeminiEvaluator] 429 Quota exceeded encountered. Halting retries immediately.');
        break;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // If the batch API call failed (quota, timeout, unavailable, malformed)
  if (!rawEvaluations) {
    const isQuotaError = lastError && /429|quota|resource_exhausted/i.test(lastError.message);
    const failureReason = isQuotaError
      ? 'Gemini API quota exceeded (HTTP 429). Preserved for organizer manual review.'
      : `Automated AI grading unavailable (${lastError?.message || 'unknown error'}). Flagged for organizer review.`;

    for (const id of answeredIds) {
      results[id] = {
        decision: 'needs_review',
        reason: failureReason,
        skipped: false,
      };
    }
    return results;
  }

  // Parse and independently validate returned decisions per question
  const evalMap = new Map<string, { decision: CorrectnessDecision; reason: string }>();
  for (const item of rawEvaluations) {
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const qid = typeof rec.questionId === 'string' ? rec.questionId : '';
      const dec = rec.decision;
      const rsn = typeof rec.reason === 'string' ? rec.reason : 'Evaluated by Gemini';
      if (qid && (dec === 'correct' || dec === 'incorrect' || dec === 'needs_review')) {
        evalMap.set(qid, { decision: dec, reason: rsn });
      }
    }
  }

  for (const id of answeredIds) {
    const match = evalMap.get(id);
    if (match) {
      results[id] = {
        decision: match.decision,
        reason: match.reason,
        skipped: false,
      };
    } else {
      // Model omitted this question ID or returned malformed decision.
      // Safely flag ONLY this question for manual review, preserving other questions!
      results[id] = {
        decision: 'needs_review',
        reason: 'AI evaluation decision missing or invalid for this question. Preserved for manual review.',
        skipped: false,
      };
    }
  }

  return results;
}

/**
 * Evaluates a single Hard quiz answer using the Gemini API.
 * Uses the official @google/genai SDK on the server with structured output.
 * Retries transient errors, but immediately halts on 429 quota exhaustion.
 */
export async function evaluateHardAnswerWithGemini(
  questionId: string,
  rawAnswer: string
): Promise<HardQuestionEvaluation> {
  const trimmed = rawAnswer.trim();
  if (!trimmed) {
    return {
      decision: 'needs_review',
      reason: 'No answer provided.',
    };
  }

  const meta = HARD_QUESTION_CRITERIA[questionId];
  if (!meta) {
    return {
      decision: 'needs_review',
      reason: `Unknown question ID: ${questionId}`,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    return {
      decision: 'needs_review',
      reason: 'Gemini API key is not configured on server. Flagged for manual review.',
    };
  }

  const systemInstruction = `You are an expert impartial examiner grading a technical quiz question.
Your task is to judge whether the participant's submitted answer is correct, incorrect, or needs_review.

Guidelines:
1. Judge semantic meaning, conceptual understanding, synonyms, and factual correctness rather than exact string or keyword matches.
2. Beware of keyword traps: if an answer mentions required keywords but asserts incorrect facts (for example, attributing creations to the wrong person), you MUST mark it 'incorrect'.
3. Do NOT award points or calculate marks.
4. Output strictly a JSON object conforming to the required schema:
   - "decision": exactly one of "correct", "incorrect", or "needs_review"
   - "reason": a concise explanation (1-2 sentences) of your evaluation.`;

  const prompt = `Official Question:
Title: ${meta.title}
Context: ${meta.context}
Question: ${meta.question}

Official Model Answer:
${meta.modelAnswer}

Grading Criteria:
${meta.criteria}

Participant's Submitted Answer:
${trimmed}`;

  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API call timed out after 12000ms')), 12000);
      });

      const generatePromise = ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: {
                type: Type.STRING,
                enum: ['correct', 'incorrect', 'needs_review'],
              },
              reason: {
                type: Type.STRING,
              },
            },
            required: ['decision', 'reason'],
          },
          temperature: 0.1,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = response.text?.trim() || '';

      if (!text) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsed = JSON.parse(text);
      const decision = parsed.decision;
      if (decision === 'correct' || decision === 'incorrect' || decision === 'needs_review') {
        const reason = typeof parsed.reason === 'string' ? parsed.reason : 'Evaluated by Gemini';
        return { decision, reason };
      }

      throw new Error(`Invalid decision received from Gemini: ${String(decision)}`);
    } catch (err) {
      lastError = err as Error;
      const isQuotaError = /429|quota|resource_exhausted/i.test(lastError.message);

      console.warn(
        `[GeminiEvaluator] Attempt ${attempt}/${maxAttempts} for ${questionId} failed:`,
        lastError.message
      );

      // Do NOT repeatedly retry HTTP 429 quota-exceeded errors.
      if (isQuotaError) {
        break;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  const isQuotaError = lastError && /429|quota|resource_exhausted/i.test(lastError.message);
  return {
    decision: 'needs_review',
    reason: isQuotaError
      ? 'Gemini API quota exceeded (HTTP 429). Preserved for organizer manual review.'
      : `Automated AI grading unavailable (${lastError?.message || 'unknown error'}). Flagged for organizer review.`,
  };
}

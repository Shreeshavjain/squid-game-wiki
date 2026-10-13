import 'server-only';
import { MongoClient, type Collection } from 'mongodb';
import { DifficultyId } from '../../types/difficulty';

/**
 * MongoDB access — SERVER ONLY
 * ============================
 * One `teams` document per enrolled team in the `squidgame` database:
 * which difficulty they locked and what they scored. The client is cached on
 * globalThis so dev hot-reloads don't open a new connection pool each time.
 */

export interface QuestionResult {
  correct: boolean;
  points: number;
  skipped?: boolean;
  needsReview?: boolean;
  reviewReason?: string;
}

export interface ScoreCorrection {
  questionId: string;
  originalPoints: number;
  correctedPoints: number;
  correctedAt: Date;
}

export interface TeamRecord {
  /** Lowercased team name — the unique key, matching trialStorage */
  teamKey: string;
  /** Team name as the team typed it */
  teamName: string;
  difficulty: DifficultyId | null;
  /** null until scored (Easy/Hard are graded by hand) */
  score: number | null;
  maxScore: number | null;
  /** Submitted answers keyed by question id, kept for manual grading */
  answers: Record<string, string> | null;
  /** Per-question auto-evaluation results (current — may include organizer corrections) */
  autoResults: Record<string, QuestionResult> | null;
  /** Model answers shown on the results page */
  modelAnswers: Record<string, string> | null;
  /** Original auto-evaluation before any organizer corrections, for auditing */
  originalAutoResults: Record<string, QuestionResult> | null;
  /** Log of organizer corrections applied */
  corrections: ScoreCorrection[] | null;
  enrolledAt: Date;
  lockedAt: Date | null;
  submittedAt: Date | null;
}

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClient?: Promise<MongoClient>;
  _teamsIndexed?: Promise<unknown>;
};

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  globalForMongo._mongoClient ??= new MongoClient(uri).connect();
  return globalForMongo._mongoClient;
}

async function teams(): Promise<Collection<TeamRecord>> {
  const db = (await client()).db(process.env.MONGODB_DB || 'squidgame');
  const collection = db.collection<TeamRecord>('teams');
  globalForMongo._teamsIndexed ??= collection.createIndex({ teamKey: 1 }, { unique: true });
  await globalForMongo._teamsIndexed;
  return collection;
}

export const toTeamKey = (teamName: string) => teamName.trim().toLowerCase();

/** Registers a team on entry; re-entering with the same name is a no-op */
export async function enrollTeam(teamName: string) {
  const name = teamName.trim();
  await (await teams()).updateOne(
    { teamKey: toTeamKey(name) },
    {
      $setOnInsert: {
        teamKey: toTeamKey(name),
        teamName: name,
        difficulty: null,
        score: null,
        maxScore: null,
        answers: null,
        enrolledAt: new Date(),
        lockedAt: null,
        submittedAt: null,
      },
    },
    { upsert: true }
  );
}

/** Records the team's difficulty. First lock wins — a later different choice is ignored. */
export async function lockDifficulty(teamName: string, difficulty: DifficultyId) {
  await enrollTeam(teamName);
  await (await teams()).updateOne(
    { teamKey: toTeamKey(teamName), difficulty: null },
    { $set: { difficulty, lockedAt: new Date() } }
  );
}

/** Stores the final answers and, when auto-scored, the score. Only the first submission counts. */
export async function recordSubmission(
  teamName: string,
  difficulty: DifficultyId,
  answers: Record<string, string>,
  result?: {
    score: number;
    maxScore: number;
    autoResults?: Record<string, QuestionResult>;
    modelAnswers?: Record<string, string>;
  }
) {
  await lockDifficulty(teamName, difficulty);
  await (await teams()).updateOne(
    { teamKey: toTeamKey(teamName), difficulty, submittedAt: null },
    {
      $set: {
        answers,
        score: result?.score ?? null,
        maxScore: result?.maxScore ?? null,
        autoResults: result?.autoResults ?? null,
        modelAnswers: result?.modelAnswers ?? null,
        originalAutoResults: result?.autoResults ?? null,
        corrections: [],
        submittedAt: new Date(),
      },
    }
  );
}

/** Retrieves a team's submission results for the results page */
export async function getTeamResults(teamName: string) {
  const col = await teams();
  return col.findOne(
    { teamKey: toTeamKey(teamName) },
    {
      projection: {
        _id: 0,
        teamName: 1,
        difficulty: 1,
        score: 1,
        maxScore: 1,
        answers: 1,
        autoResults: 1,
        modelAnswers: 1,
        originalAutoResults: 1,
        corrections: 1,
        submittedAt: 1,
      },
    }
  );
}

/**
 * Applies an organizer correction to a single question's points.
 * Preserves the original auto results and recalculates the total score.
 */
export async function correctQuestionScore(
  teamName: string,
  questionId: string,
  correctedPoints: number
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  const col = await teams();
  const team = await col.findOne({ teamKey: toTeamKey(teamName) });

  if (!team) return { success: false, error: 'Team not found' };
  if (!team.autoResults) return { success: false, error: 'No auto results to correct' };
  if (!(questionId in team.autoResults)) return { success: false, error: 'Invalid question ID' };

  const originalPoints = team.autoResults[questionId].points;
  const updatedResults = { ...team.autoResults };
  updatedResults[questionId] = {
    ...updatedResults[questionId],
    points: correctedPoints,
    // If correctedPoints > 0, mark as correct; if <= 0, mark as false
    correct: correctedPoints > 0,
    skipped: false,
    needsReview: false,
  };

  const newScore = Object.values(updatedResults).reduce((sum, r) => sum + r.points, 0);

  const correction: ScoreCorrection = {
    questionId,
    originalPoints,
    correctedPoints,
    correctedAt: new Date(),
  };

  const existingCorrections = Array.isArray(team.corrections) ? team.corrections : [];
  const updatedCorrections = [...existingCorrections, correction];

  await col.updateOne(
    { teamKey: toTeamKey(teamName) },
    {
      $set: {
        autoResults: updatedResults,
        score: newScore,
        corrections: updatedCorrections,
      },
    }
  );

  return { success: true, newScore };
}

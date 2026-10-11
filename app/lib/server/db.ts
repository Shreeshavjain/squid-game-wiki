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
  result?: { score: number; maxScore: number }
) {
  await lockDifficulty(teamName, difficulty);
  await (await teams()).updateOne(
    { teamKey: toTeamKey(teamName), difficulty, submittedAt: null },
    {
      $set: {
        answers,
        score: result?.score ?? null,
        maxScore: result?.maxScore ?? null,
        submittedAt: new Date(),
      },
    }
  );
}

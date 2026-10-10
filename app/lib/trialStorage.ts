import { DifficultyId } from '../types/difficulty';
import { QuizProgress } from '../types/quiz';

/**
 * Browser-side persistence for a team's locked difficulty and quiz progress.
 *
 * Prototype note: this lives in localStorage, so it survives refreshes and
 * back-navigation but not a cleared browser / different device. Enforcing the
 * lock for real needs a server-side record.
 */

const teamKey = (teamName: string) => teamName.trim().toLowerCase();
const lockKey = (teamName: string) => `squid:lock:${teamKey(teamName)}`;
const progressKey = (teamName: string, tier: DifficultyId) =>
  `squid:quiz:${tier}:${teamKey(teamName)}`;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode etc.) — lock only lasts this page view
  }
}

export function getLockedTier(teamName: string): DifficultyId | null {
  const value = read(lockKey(teamName));
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : null;
}

export function setLockedTier(teamName: string, tier: DifficultyId) {
  write(lockKey(teamName), tier);
}

export function getQuizProgress(teamName: string, tier: DifficultyId): QuizProgress {
  const fallback: QuizProgress = { current: 0, answers: {}, completed: false };
  const raw = read(progressKey(teamName, tier));
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveQuizProgress(teamName: string, tier: DifficultyId, progress: QuizProgress) {
  write(progressKey(teamName, tier), JSON.stringify(progress));
}

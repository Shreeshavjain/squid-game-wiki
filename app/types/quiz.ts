export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuizOption {
  readonly key: QuizOptionKey;
  readonly text: string;
}

export type QuizContextBlock =
  | { readonly type: 'text' | 'code'; readonly value: string }
  /** Row of labelled emojis, e.g. (a) ☕ (b) 💎 */
  | { readonly type: 'emojis'; readonly items: readonly { readonly label: string; readonly emoji: string }[] }
  | { readonly type: 'table'; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[] };

interface QuizQuestionBase {
  readonly id: string;
  readonly section: string;
}

/** Multiple choice: pick one of A–D */
export interface McqQuestion extends QuizQuestionBase {
  readonly kind: 'mcq';
  readonly title: string;
  readonly context: readonly QuizContextBlock[];
  readonly question: string;
  readonly options: readonly QuizOption[];
}

/** Descriptive: decode an emoji clue, type the answer */
export interface EmojiQuestion extends QuizQuestionBase {
  readonly kind: 'emoji';
  readonly emojis: readonly string[];
  readonly category: string;
  readonly hint: string;
}

/** Descriptive: unscramble the letters, type the word */
export interface UnscrambleQuestion extends QuizQuestionBase {
  readonly kind: 'unscramble';
  readonly letters: readonly string[];
  readonly hint: string;
}

export type HardInteractionConfig =
  | {
      readonly type: 'hard_emojis';
      readonly items: readonly { readonly id: string; readonly label: string; readonly emoji: string }[];
    }
  | { readonly type: 'hard_whoami' }
  | { readonly type: 'hard_puzzle' }
  | { readonly type: 'hard_binary_search' }
  | {
      readonly type: 'hard_matching';
      readonly licenses: readonly string[];
      readonly features: readonly { readonly key: string; readonly text: string }[];
    };

/** Descriptive: free-form written answer to a prompt with optional context */
export interface WrittenQuestion extends QuizQuestionBase {
  readonly kind: 'written';
  readonly title: string;
  readonly context: readonly QuizContextBlock[];
  readonly question: string;
  /** Placeholder for the answer box, e.g. to suggest a per-part layout */
  readonly placeholder?: string;
  /** Custom interaction configuration for structured inputs */
  readonly interaction?: HardInteractionConfig;
}

export type QuizQuestion = McqQuestion | EmojiQuestion | UnscrambleQuestion | WrittenQuestion;

/** Persisted per team so a refresh can't restart or revisit questions */
export interface QuizProgress {
  /** Index of the question currently on screen */
  current: number;
  /** Locked-in answers keyed by question id (option key for MCQ, typed text otherwise) */
  answers: Record<string, string>;
  completed: boolean;
  /** Server-calculated result, for quizzes that are auto-scored */
  score?: number;
  maxScore?: number;
  /** Per-question outcome from the server (never includes the correct option) */
  results?: Record<string, { correct: boolean; points: number; skipped?: boolean; needsReview?: boolean; reviewReason?: string }>;
  /** Model answers for display on the results page (Hard only) */
  modelAnswers?: Record<string, string>;
}

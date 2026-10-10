export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuizOption {
  readonly key: QuizOptionKey;
  readonly text: string;
}

export interface QuizContextBlock {
  readonly type: 'text' | 'code';
  readonly value: string;
}

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

export type QuizQuestion = McqQuestion | EmojiQuestion | UnscrambleQuestion;

/** Persisted per team so a refresh can't restart or revisit questions */
export interface QuizProgress {
  /** Index of the question currently on screen */
  current: number;
  /** Locked-in answers keyed by question id (option key for MCQ, typed text otherwise) */
  answers: Record<string, string>;
  completed: boolean;
}

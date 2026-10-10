export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuizOption {
  readonly key: QuizOptionKey;
  readonly text: string;
}

export interface QuizContextBlock {
  readonly type: 'text' | 'code';
  readonly value: string;
}

export interface QuizQuestion {
  readonly id: string;
  readonly section: string;
  readonly title: string;
  readonly context: readonly QuizContextBlock[];
  readonly question: string;
  readonly options: readonly QuizOption[];
}

/** Persisted per team so a refresh can't restart or revisit questions */
export interface QuizProgress {
  /** Index of the question currently on screen */
  current: number;
  /** Locked-in answers keyed by question id */
  answers: Record<string, QuizOptionKey>;
  completed: boolean;
}

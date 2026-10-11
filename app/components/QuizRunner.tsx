'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_TEAM_SESSION } from '../data/difficultyTiers';
import { DifficultyTier } from '../types/difficulty';
import { QuizContextBlock, QuizProgress, QuizQuestion } from '../types/quiz';
import { ArenaBackground } from './ArenaBackground';
import { Header } from './Header';
import { RichText } from './RichText';
import { getLockedTier, getQuizProgress, saveQuizProgress } from '../lib/trialStorage';

/**
 * QUIZ RUNNER
 * ===========
 * Shared trial flow for every quiz page. One question at a time: a question
 * must be answered and submitted before the next one appears. Teams can step
 * back to earlier questions and re-answer them until they submit the last one.
 * The browser back button is neutralised and progress is persisted, so
 * neither going back nor refreshing lets a team leave or restart the trial.
 */

/**
 * Per-tier accent classes. Written out in full so Tailwind can detect them
 * (template-built class names are never generated).
 */
const QUIZ_THEMES = {
  easy: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    segmentDone: 'bg-emerald-400',
    cardBorder: 'border-emerald-400/20',
    topBar: 'from-emerald-400/0 via-emerald-400 to-emerald-400/0',
    underline: 'underline underline-offset-4 decoration-emerald-400',
    ring: 'focus-visible:ring-emerald-400',
    optionSelected: 'border-emerald-400 bg-emerald-400/10 text-zinc-50 shadow-[0_0_20px_rgba(16,185,129,0.18)]',
    optionIdle: 'border-zinc-700/50 bg-zinc-950/50 text-zinc-300 hover:border-emerald-400/50 hover:bg-zinc-900/60',
    badgeSelected: 'border-emerald-400 bg-emerald-400 text-zinc-950',
    input: 'focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,0.18)]',
    caret: 'caret-emerald-400',
    button: 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300 shadow-[0_0_22px_rgba(16,185,129,0.4)]',
  },
  medium: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    segmentDone: 'bg-amber-400',
    cardBorder: 'border-amber-400/20',
    topBar: 'from-amber-400/0 via-amber-400 to-amber-400/0',
    underline: 'underline underline-offset-4 decoration-amber-400',
    ring: 'focus-visible:ring-amber-400',
    optionSelected: 'border-amber-400 bg-amber-400/10 text-zinc-50 shadow-[0_0_20px_rgba(245,158,11,0.18)]',
    optionIdle: 'border-zinc-700/50 bg-zinc-950/50 text-zinc-300 hover:border-amber-400/50 hover:bg-zinc-900/60',
    badgeSelected: 'border-amber-400 bg-amber-400 text-zinc-950',
    input: 'focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.18)]',
    caret: 'caret-amber-400',
    button: 'bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.4)]',
  },
  hard: {
    text: 'text-rose-400',
    dot: 'bg-rose-500',
    segmentDone: 'bg-rose-500',
    cardBorder: 'border-rose-500/25',
    topBar: 'from-rose-500/0 via-rose-500 to-rose-500/0',
    underline: 'underline underline-offset-4 decoration-rose-500',
    ring: 'focus-visible:ring-rose-500',
    optionSelected: 'border-rose-500 bg-rose-500/10 text-zinc-50 shadow-[0_0_20px_rgba(225,29,72,0.2)]',
    optionIdle: 'border-zinc-700/50 bg-zinc-950/50 text-zinc-300 hover:border-rose-500/50 hover:bg-zinc-900/60',
    badgeSelected: 'border-rose-500 bg-rose-500 text-white',
    input: 'focus:border-rose-500 focus:shadow-[0_0_20px_rgba(225,29,72,0.2)]',
    caret: 'caret-rose-400',
    button: 'bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_22px_rgba(225,29,72,0.45)]',
  },
} as const;

type QuizTheme = (typeof QUIZ_THEMES)[keyof typeof QUIZ_THEMES];

const subscribeNoop = () => () => {};

const glassStyle = {
  backgroundColor: 'rgba(12, 12, 18, 0.78)',
  backdropFilter: 'blur(18px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
};

interface QuizRunnerProps {
  tier: DifficultyTier & { id: keyof typeof QUIZ_THEMES };
  /** Shown above the progress bar, e.g. "Open Source & Tech Challenge" */
  quizTitle: string;
  questions: readonly QuizQuestion[];
  /**
   * Route handler that grades the final answers server-side (the answer key
   * never reaches the browser). Omit for quizzes graded by the organisers.
   */
  scoreEndpoint?: string;
}

export function QuizRunner({ tier, quizTitle, questions, scoreEndpoint }: QuizRunnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamName = searchParams.get('teamName') || DEFAULT_TEAM_SESSION.teamName;
  const theme = QUIZ_THEMES[tier.id];

  // false during SSR + hydration, true afterwards — storage is only readable on the client
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const hasLockedTier = isClient && getLockedTier(teamName) === tier.id;

  // Saved progress until the team answers something on this page view.
  // null = not yet readable, or this team hasn't locked this tier (redirected below).
  const [answeredProgress, setProgress] = useState<QuizProgress | null>(null);
  const progress = answeredProgress ?? (hasLockedTier ? getQuizProgress(teamName, tier.id) : null);
  // Unsaved edit for the question on screen; null = show its saved answer
  const [draft, setDraft] = useState<string | null>(null);

  // Only teams that locked this tier may be here; for them, trap the browser
  // back button by re-pushing the current entry whenever it's popped
  useEffect(() => {
    if (getLockedTier(teamName) !== tier.id) {
      router.replace(`/dashboard?${new URLSearchParams({ teamName })}`);
      return;
    }
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [teamName, tier.id, router]);

  const session = {
    teamId: DEFAULT_TEAM_SESSION.teamId,
    teamName,
    sessionCode: DEFAULT_TEAM_SESSION.sessionCode,
    arenaStatus: 'LOCKED' as const,
  };

  const total = questions.length;
  const question = progress && !progress.completed ? questions[progress.current] : null;
  const isLast = progress?.current === total - 1;
  const value = draft ?? (question && progress?.answers[question.id]) ?? '';
  const answer = value.trim();

  // Questions can be revisited up to (and including) the first unanswered one
  const firstUnanswered = progress ? questions.findIndex((q) => !progress.answers[q.id]) : -1;
  const furthestReachable = firstUnanswered === -1 ? total - 1 : firstUnanswered;

  const commit = (next: QuizProgress) => {
    saveQuizProgress(teamName, tier.id, next);
    setProgress(next);
    setDraft(null);
  };

  const goTo = (index: number) => {
    if (!progress || index < 0 || index > furthestReachable || index === progress.current) return;
    commit({ ...progress, current: index });
  };

  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState(false);

  const handleSubmit = async () => {
    if (!progress || !question || !answer || isScoring) return;
    const answers = {
      ...progress.answers,
      // Unscramble input is displayed uppercase, so store it the way the team saw it
      [question.id]: question.kind === 'unscramble' ? answer.toUpperCase() : answer,
    };

    if (!isLast) {
      commit({ ...progress, current: progress.current + 1, answers });
      return;
    }

    // Final submit: saved on the server (and graded there, for auto-scored quizzes) before finishing
    let result: Pick<QuizProgress, 'score' | 'maxScore' | 'results'> | null = null;
    setIsScoring(true);
    setScoreError(false);
    try {
      const res = await fetch(scoreEndpoint ?? '/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, tier: tier.id, answers }),
      });
      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      if (scoreEndpoint) result = await res.json();
    } catch {
      setScoreError(true);
      return;
    } finally {
      setIsScoring(false);
    }
    commit({ ...progress, answers, completed: true, ...result });
  };

  return (
    <div className="relative min-h-screen flex flex-col text-zinc-100 overflow-x-hidden">
      <ArenaBackground />
      <Header session={session} isLocked />

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col">
        {/* ── Trial heading ── */}
        <div className="text-center mb-4">
          <div className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase ${theme.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.dot}`} aria-hidden="true" />
            {tier.title} trial · {quizTitle}
          </div>
          {tier.scoring && (
            <div className="mt-2 font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
              Correct <span className="font-bold text-emerald-400">+{tier.scoring.correct}</span>
              <span className="mx-2 text-zinc-600">·</span>
              Wrong <span className="font-bold text-rose-500">-{Math.abs(tier.scoring.wrong)}</span>
            </div>
          )}
        </div>

        {progress && (
          <>
            {/* ── Progress segments ── */}
            <div className="mb-4">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-zinc-400 mb-2">
                <span>
                  {progress.completed ? 'All questions answered' : `Question ${progress.current + 1} of ${total}`}
                </span>
                <span>{Object.keys(progress.answers).length} / {total} answered</span>
              </div>
              {/* Segments double as navigation back to any reachable question */}
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
                {questions.map((q, i) => {
                  const canJump = !progress.completed && i <= furthestReachable && i !== progress.current;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={!canJump}
                      aria-label={`Go to question ${i + 1}`}
                      aria-current={i === progress.current && !progress.completed ? 'step' : undefined}
                      className={[
                        'py-1.5 group/seg focus:outline-none',
                        canJump ? 'cursor-pointer' : 'cursor-default',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'block h-1.5 rounded-full transition-colors duration-300',
                          i === progress.current && !progress.completed
                            ? 'bg-zinc-100'
                            : progress.answers[q.id]
                            ? theme.segmentDone
                            : 'bg-zinc-800',
                          canJump ? 'group-hover/seg:opacity-70 group-focus-visible/seg:ring-2 ring-offset-2 ring-offset-black ring-zinc-400' : '',
                        ].join(' ')}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {question ? (
              /* ── Question card ── */
              <section
                key={question.id}
                className={`relative overflow-hidden rounded-2xl border p-5 sm:p-7 motion-safe:animate-[modal-in_260ms_ease-out_both] ${theme.cardBorder}`}
                style={glassStyle}
                aria-labelledby="quiz-question"
              >
                <div
                  className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${theme.topBar}`}
                  aria-hidden="true"
                />

                <div className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
                  {question.section}
                </div>

                {question.kind === 'mcq' ? (
                  <McqBody
                    question={question}
                    number={progress.current + 1}
                    theme={theme}
                    selected={value}
                    onSelect={setDraft}
                  />
                ) : question.kind === 'written' ? (
                  <WrittenBody
                    question={question}
                    number={progress.current + 1}
                    theme={theme}
                    value={value}
                    onChange={setDraft}
                    onSubmit={handleSubmit}
                    isLast={isLast}
                  />
                ) : (
                  <DescriptiveBody
                    question={question}
                    number={progress.current + 1}
                    theme={theme}
                    value={value}
                    onChange={setDraft}
                    onSubmit={handleSubmit}
                    isLast={isLast}
                  />
                )}

                {/* ── Navigation ── */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => goTo(progress.current - 1)}
                    disabled={progress.current === 0}
                    className={[
                      'px-5 py-3 rounded-full font-mono text-xs uppercase tracking-widest border transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2',
                      theme.ring,
                      progress.current === 0
                        ? 'invisible'
                        : 'cursor-pointer border-zinc-700 text-zinc-300 hover:text-zinc-50 hover:border-zinc-500',
                    ].join(' ')}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!answer || isScoring}
                    className={[
                      'px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest font-bold transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      theme.ring,
                      answer
                        ? `cursor-pointer ${theme.button}`
                        : 'cursor-not-allowed bg-zinc-900/60 text-zinc-600 border border-zinc-800',
                    ].join(' ')}
                  >
                    {isScoring ? (scoreEndpoint ? 'Calculating…' : 'Submitting…') : isLast ? 'Submit' : 'Next →'}
                  </button>
                </div>
                {scoreError && (
                  <p role="alert" className="mt-3 text-right font-mono text-[11px] text-rose-400">
                    Couldn&apos;t submit — check your connection and press Submit again.
                  </p>
                )}
              </section>
            ) : (
              /* ── Completion ── */
              <section
                className="relative overflow-hidden rounded-2xl border border-emerald-400/25 p-8 sm:p-10 text-center motion-safe:animate-[modal-in_260ms_ease-out_both]"
                style={glassStyle}
              >
                <div className="mx-auto w-14 h-14 rounded-full border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 text-2xl">
                  ✓
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-zinc-50 uppercase">
                  Trial complete
                </h2>
                {progress.score !== undefined ? (
                  <>
                    <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
                      All {total} answers from <strong className="text-zinc-100">{teamName}</strong> have been submitted.
                    </p>
                    <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-950/60 px-10 py-5">
                      <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">Your score</span>
                      <span
                        className={`mt-1 text-5xl font-black tabular-nums ${progress.score >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}
                      >
                        {progress.score}
                      </span>
                      <span className="mt-1 font-mono text-xs text-zinc-500">out of {progress.maxScore}</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
                    All {total} answers from <strong className="text-zinc-100">{teamName}</strong> have been
                    locked in. Results will be announced by the organisers.
                  </p>
                )}

                {/* Auto-scored: each answer with ✓/✗ and its points. Otherwise short
                    answers (single words) fit in tiles and long ones are listed in full. */}
                {progress.results ? (
                  <ul className="mt-6 space-y-2 text-left">
                    {questions.map((q, i) => {
                      const result = progress.results?.[q.id];
                      const picked = progress.answers[q.id];
                      const optionText = q.kind === 'mcq' ? q.options.find((o) => o.key === picked)?.text : undefined;
                      return (
                        <li
                          key={q.id}
                          className={[
                            'flex items-center gap-3 rounded-lg border px-4 py-3',
                            result?.correct ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                              result?.correct ? 'bg-emerald-400 text-zinc-950' : 'bg-rose-500 text-white',
                            ].join(' ')}
                            aria-label={result?.correct ? 'Correct' : 'Wrong'}
                          >
                            {result?.correct ? '✓' : '✗'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                              Q{i + 1}
                              {q.kind === 'mcq' || q.kind === 'written' ? ` · ${q.title}` : ''}
                            </div>
                            <div className="mt-0.5 text-sm text-zinc-200 truncate">
                              <span className="font-mono font-bold text-zinc-50">{picked ?? '—'}</span>
                              {optionText && (
                                <span className="text-zinc-400">
                                  {' '}· <RichText text={optionText} />
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 font-mono text-base font-black tabular-nums ${result?.correct ? 'text-emerald-400' : 'text-rose-500'}`}
                          >
                            {result && result.points > 0 ? `+${result.points}` : result?.points}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  /* Report for organiser-graded (descriptive) quizzes: each question with the team's full answer */
                  <div className="mt-8 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                      <h3 className="font-mono text-[11px] tracking-[0.25em] uppercase text-zinc-400">Your answers</h3>
                      <span className="font-mono text-[11px] text-zinc-500">{total} questions</span>
                    </div>
                    <ol className="space-y-3">
                      {questions.map((q, i) => (
                        <li key={q.id} className="rounded-xl border border-zinc-700/40 bg-zinc-950/60 overflow-hidden">
                          <div className="px-4 pt-3 pb-2.5 border-b border-zinc-800/80">
                            <div className="flex items-baseline gap-2">
                              <span className={`font-mono text-xs font-bold ${theme.text}`}>Q{i + 1}</span>
                              <span className="text-sm font-semibold text-zinc-100">
                                <QuestionSummary question={q} />
                              </span>
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-1">Your answer</div>
                            {progress.answers[q.id] ? (
                              <div className="overflow-x-auto font-mono text-sm text-zinc-50 whitespace-pre leading-relaxed">
                                {progress.answers[q.id]}
                              </div>
                            ) : (
                              <div className="text-sm italic text-zinc-500">No answer</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Multiple choice ─────────────────────────────────────────────
function McqBody({
  question,
  number,
  theme,
  selected,
  onSelect,
}: {
  question: Extract<QuizQuestion, { kind: 'mcq' }>;
  number: number;
  theme: QuizTheme;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <>
      <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-zinc-50">
        <span className={theme.text}>Q{number}.</span> {question.title}
      </h2>

      <ContextBlocks blocks={question.context} />

      <p id="quiz-question" className="mt-5 text-base sm:text-lg font-bold text-zinc-50 leading-snug">
        <RichText text={question.question} boldClassName={theme.underline} />
      </p>

      <div role="radiogroup" aria-labelledby="quiz-question" className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isSelected = selected === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.key)}
              className={[
                'flex items-start gap-3 text-left rounded-xl border px-4 py-3 cursor-pointer',
                'text-sm leading-snug transition-all duration-150',
                'focus:outline-none focus-visible:ring-2',
                theme.ring,
                isSelected ? theme.optionSelected : theme.optionIdle,
              ].join(' ')}
            >
              <span
                className={[
                  'shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[11px] font-bold',
                  isSelected ? theme.badgeSelected : 'border-zinc-600 text-zinc-400',
                ].join(' ')}
              >
                {option.key}
              </span>
              <span className="pt-0.5">
                <RichText text={option.text} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Descriptive (emoji decoder / word unscramble) ───────────────
function DescriptiveBody({
  question,
  number,
  theme,
  value,
  onChange,
  onSubmit,
  isLast,
}: {
  question: Extract<QuizQuestion, { kind: 'emoji' | 'unscramble' }>;
  number: number;
  theme: QuizTheme;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLast: boolean;
}) {
  const isEmoji = question.kind === 'emoji';

  return (
    <>
      <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-zinc-50">
        <span className={theme.text}>Q{number}.</span>{' '}
        {isEmoji ? 'Decode the emojis' : 'Unscramble the word'}
      </h2>

      {/* ── Clue ── */}
      <div className="mt-5 rounded-xl border border-zinc-700/40 bg-zinc-950/60 px-4 py-6 flex flex-col items-center gap-4">
        {isEmoji ? (
          <div className="flex items-center justify-center gap-5 sm:gap-8 text-5xl sm:text-6xl leading-none" aria-label="Emoji clue">
            {question.emojis.map((emoji, i) => (
              <span key={i}>{emoji}</span>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Scrambled letters">
            {question.letters.map((letter, i) => (
              <span
                key={i}
                className="w-11 h-12 sm:w-12 sm:h-14 rounded-lg border border-zinc-600/60 bg-zinc-900/80 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-zinc-50"
              >
                {letter}
              </span>
            ))}
          </div>
        )}
        <span className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border border-zinc-700/60 text-zinc-400">
          {isEmoji ? question.category : `${question.letters.length} letters`}
        </span>
      </div>

      <p id="quiz-question" className="mt-4 text-sm text-zinc-300 leading-relaxed">
        <span className={`font-bold ${theme.text}`}>Hint:</span> {question.hint}
      </p>

      <AnswerBox
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isLast={isLast}
        theme={theme}
        monospaceCaps={!isEmoji}
        placeholder={isEmoji ? 'Type your answer…' : `Type the ${question.letters.length}-letter word…`}
      />
    </>
  );
}

// ── Written (free-form descriptive with context) ────────────────
function WrittenBody({
  question,
  number,
  theme,
  value,
  onChange,
  onSubmit,
  isLast,
}: {
  question: Extract<QuizQuestion, { kind: 'written' }>;
  number: number;
  theme: QuizTheme;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLast: boolean;
}) {
  return (
    <>
      <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-zinc-50">
        <span className={theme.text}>Q{number}.</span> {question.title}
      </h2>

      <ContextBlocks blocks={question.context} />

      <p id="quiz-question" className="mt-5 text-base sm:text-lg font-bold text-zinc-50 leading-snug">
        <RichText text={question.question} boldClassName={theme.underline} />
      </p>

      <AnswerBox
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isLast={isLast}
        theme={theme}
        placeholder={question.placeholder ?? 'Type your answer…'}
      />
    </>
  );
}

// ── Shared: question context (text, code, emoji row, table) ─────
function ContextBlocks({ blocks }: { blocks: readonly QuizContextBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="mt-4 space-y-3 text-sm text-zinc-300 leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'code':
            return (
              <pre
                key={i}
                className="font-mono text-sm text-zinc-100 bg-zinc-950/70 border border-zinc-700/40 rounded-lg px-4 py-2.5 overflow-x-auto"
              >
                {block.value}
              </pre>
            );
          case 'emojis':
            return (
              <div
                key={i}
                className="grid rounded-xl border border-zinc-700/40 bg-zinc-950/60 divide-x divide-zinc-700/40"
                style={{ gridTemplateColumns: `repeat(${block.items.length}, minmax(0, 1fr))` }}
              >
                {block.items.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 py-4">
                    <span className="text-4xl sm:text-5xl leading-none">{item.emoji}</span>
                    <span className="font-mono text-xs text-zinc-400">{item.label}</span>
                  </div>
                ))}
              </div>
            );
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-zinc-700/40">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/80 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    <tr>
                      {block.headers.map((h) => (
                        <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/50">
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={c === 0 ? 'px-4 py-2.5 font-semibold text-zinc-100 whitespace-nowrap' : 'px-4 py-2.5 text-zinc-300'}
                          >
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return (
              <p key={i}>
                <RichText text={block.value} />
              </p>
            );
        }
      })}
    </div>
  );
}

// ── Shared: notepad-style answer box ────────────────────────────
function AnswerBox({
  value,
  onChange,
  onSubmit,
  isLast,
  theme,
  placeholder,
  monospaceCaps = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLast: boolean;
  theme: QuizTheme;
  placeholder: string;
  /** Uppercase monospace entry (word unscramble) */
  monospaceCaps?: boolean;
}) {
  return (
    <>
      <label htmlFor="quiz-answer" className="mt-5 block font-mono text-[10px] tracking-widest uppercase text-zinc-500">
        Your answer
      </label>
      {/* Works like a notepad: text stays on its line (no auto-wrap, scrolls sideways)
          and only Enter starts a new line; the box grows with each line.
          Ctrl/⌘ + Enter does the same as the Next / Submit button. */}
      <textarea
        id="quiz-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={3}
        wrap="off"
        autoFocus
        autoComplete="off"
        autoCapitalize={monospaceCaps ? 'characters' : 'off'}
        spellCheck={false}
        placeholder={placeholder}
        aria-describedby="quiz-question"
        className={[
          'mt-2 block w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-3.5',
          'text-base leading-relaxed text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] duration-150',
          'resize-none [field-sizing:content] min-h-[5.5rem] max-h-64 overflow-auto whitespace-pre',
          monospaceCaps ? 'font-mono uppercase tracking-[0.3em]' : '',
          theme.input,
          theme.caret,
        ].join(' ')}
      />
      <p className="mt-1.5 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
        Press Ctrl / ⌘ + Enter for {isLast ? 'submit' : 'next'}
      </p>
    </>
  );
}

// ── Shared: one-line description of a question for reports ──────
function QuestionSummary({ question }: { question: QuizQuestion }) {
  switch (question.kind) {
    case 'emoji':
      return (
        <>
          <span className="mr-1.5">{question.emojis.join(' ')}</span>
          <span className="font-normal text-zinc-400">· {question.category}</span>
        </>
      );
    case 'unscramble':
      return (
        <>
          <span className="font-mono tracking-[0.3em]">{question.letters.join('')}</span>
          <span className="font-normal text-zinc-400"> · Unscramble ({question.letters.length} letters)</span>
        </>
      );
    case 'written':
      return (
        <>
          {question.title}
          <span className="block mt-0.5 font-normal text-zinc-400">
            <RichText text={question.question} />
          </span>
        </>
      );
    default:
      return <>{question.title}</>;
  }
}

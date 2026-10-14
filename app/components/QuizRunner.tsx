'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_TEAM_SESSION } from '../data/difficultyTiers';
import { DifficultyTier } from '../types/difficulty';
import { QuizContextBlock, QuizProgress, QuizQuestion, EvaluatorDecision } from '../types/quiz';
import { ArenaBackground } from './ArenaBackground';
import { Header } from './Header';
import { RichText } from './RichText';
import { EvaluatorMode } from './EvaluatorMode';
import { getLockedTier, setLockedTier, getQuizProgress, saveQuizProgress } from '../lib/trialStorage';

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
  /** Show a Skip button; a skipped question is saved as an empty answer */
  allowSkip?: boolean;
}

export function QuizRunner({ tier, quizTitle, questions, scoreEndpoint, allowSkip }: QuizRunnerProps) {
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

  const total = questions.length;

  // Only teams that locked this tier may be here; for them, trap the browser
  // back button by re-pushing the current entry whenever it's popped
  useEffect(() => {
    if (getLockedTier(teamName) !== tier.id) {
      if (tier.id === 'hard') {
        fetch(`/api/quiz/hard/results?teamName=${encodeURIComponent(teamName)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.results) {
              setLockedTier(teamName, tier.id);
              const restored: QuizProgress = {
                current: total - 1,
                completed: true,
                answers: data.answers ?? {},
                score: data.score,
                maxScore: data.maxScore,
                results: data.results,
                modelAnswers: data.modelAnswers,
              };
              saveQuizProgress(teamName, tier.id, restored);
              setProgress(restored);
              return;
            }
            router.replace(`/dashboard?${new URLSearchParams({ teamName })}`);
          })
          .catch(() => {
            router.replace(`/dashboard?${new URLSearchParams({ teamName })}`);
          });
        return;
      }
      router.replace(`/dashboard?${new URLSearchParams({ teamName })}`);
      return;
    }
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [teamName, tier.id, router, total]);

  const session = {
    teamId: DEFAULT_TEAM_SESSION.teamId,
    teamName,
    sessionCode: DEFAULT_TEAM_SESSION.sessionCode,
    arenaStatus: 'LOCKED' as const,
  };

  const question = progress && !progress.completed ? questions[progress.current] : null;
  const isLast = progress?.current === total - 1;
  const value = draft ?? (question && progress?.answers[question.id]) ?? '';
  const answer = value.trim();

  // Questions can be revisited up to (and including) the first unanswered one.
  // A skipped question is stored as '' — passed, but not answered.
  const firstUnanswered = progress ? questions.findIndex((q) => !(q.id in progress.answers)) : -1;
  const furthestReachable = firstUnanswered === -1 ? total - 1 : firstUnanswered;

  const commit = (next: QuizProgress) => {
    saveQuizProgress(teamName, tier.id, next);
    setProgress(next);
    setDraft(null);
  };

  const handleEvaluatorScoreUpdate = (newScore: number, questionId?: string, decision?: EvaluatorDecision) => {
    if (progress) {
      const nextResults = { ...(progress.results || {}) };
      if (questionId && decision) {
        const points = decision === 'correct' ? 30 : decision === 'wrong' ? -20 : 0;
        nextResults[questionId] = {
          correct: points > 0,
          points,
          skipped: decision === 'ungraded',
          needsReview: false,
        };
      }
      commit({
        ...progress,
        score: newScore,
        results: nextResults,
      });
    }
  };

  const goTo = (index: number) => {
    if (!progress || index < 0 || index > furthestReachable || index === progress.current) return;
    commit({ ...progress, current: index });
  };

  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState(false);

  const advance = async (given: string) => {
    if (!progress || !question || isScoring) return;
    const answers = {
      ...progress.answers,
      // Unscramble input is displayed uppercase, so store it the way the team saw it
      [question.id]: question.kind === 'unscramble' ? given.toUpperCase() : given,
    };

    if (!isLast) {
      commit({ ...progress, current: progress.current + 1, answers });
      return;
    }

    // Final submit: saved on the server (and graded there, for auto-scored quizzes) before finishing
    let result: Pick<QuizProgress, 'score' | 'maxScore' | 'results' | 'modelAnswers'> | null = null;
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

  const handleSubmit = () => {
    if (answer) advance(answer);
  };
  const handleSkip = () => advance('');

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
                <span>{Object.values(progress.answers).filter(Boolean).length} / {total} answered</span>
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
                  <div className="flex items-center gap-2">
                    {allowSkip && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={isScoring}
                        className={[
                          'px-5 py-3 rounded-full font-mono text-xs uppercase tracking-widest border transition-colors duration-150',
                          'focus:outline-none focus-visible:ring-2',
                          theme.ring,
                          isScoring
                            ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                            : 'cursor-pointer border-zinc-700 text-zinc-300 hover:text-zinc-50 hover:border-zinc-500',
                        ].join(' ')}
                      >
                        Skip
                      </button>
                    )}
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
                </div>
                {scoreError && (
                  <p role="alert" className="mt-3 text-right font-mono text-[11px] text-rose-400">
                    Couldn&apos;t submit — check your connection and press Submit again.
                  </p>
                )}
              </section>
            ) : tier.id === 'hard' ? (
              /* ── Hard Quiz Completion & Organizer Results ── */
              <HardResultsSection
                progress={progress}
                questions={questions}
                teamName={teamName}
                theme={theme}
                total={total}
                glassStyle={glassStyle}
                onUpdateProgress={commit}
              />
            ) : (
              /* ── Standard Completion (Easy & Medium) ── */
              <StandardResultsSection
                progress={progress}
                questions={questions}
                teamName={teamName}
                theme={theme}
                total={total}
                glassStyle={glassStyle}
              />
            )}
          </>
        )}
      </main>

      {tier.id === 'hard' && (
        <EvaluatorMode
          teamName={teamName}
          questions={questions}
          onScoreUpdated={handleEvaluatorScoreUpdate}
        />
      )}
    </div>
  );
}

function StandardResultsSection({
  progress,
  questions,
  teamName,
  theme,
  total,
  glassStyle,
}: {
  progress: QuizProgress;
  questions: readonly QuizQuestion[];
  teamName: string;
  theme: QuizTheme;
  total: number;
  glassStyle: React.CSSProperties;
}) {
  return (
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

      {/* Auto-scored: each answer with ✓/✗ and its points */}
      {progress.results ? (
        <ul className="mt-6 space-y-2 text-left">
          {questions.map((q, i) => {
            const result = progress.results?.[q.id];
            const picked = progress.answers[q.id];
            const outcome = result?.skipped ? 'skipped' : result?.correct ? 'correct' : 'wrong';
            const optionText = q.kind === 'mcq' ? q.options.find((o) => o.key === picked)?.text : undefined;
            return (
              <li
                key={q.id}
                className={[
                  'flex items-center gap-3 rounded-lg border px-4 py-3',
                  OUTCOME_STYLES[outcome].row,
                ].join(' ')}
              >
                <span
                  className={[
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                    OUTCOME_STYLES[outcome].badge,
                  ].join(' ')}
                  aria-label={OUTCOME_STYLES[outcome].label}
                >
                  {OUTCOME_STYLES[outcome].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Q{i + 1}
                    {q.kind === 'mcq' || q.kind === 'written' ? ` · ${q.title}` : ''}
                  </div>
                  <div className="mt-0.5 text-sm text-zinc-200 truncate">
                    {picked ? (
                      <span className="font-mono font-bold text-zinc-50">{picked.replace(/\n+/g, ' · ')}</span>
                    ) : (
                      <span className="italic text-zinc-500">Skipped</span>
                    )}
                    {optionText && (
                      <span className="text-zinc-400">
                        {' '}· <RichText text={optionText} />
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-base font-black tabular-nums ${OUTCOME_STYLES[outcome].points}`}
                >
                  {result && result.points > 0 ? `+${result.points}` : result?.points}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
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
  );
}

function HardResultsSection({
  progress,
  questions,
  teamName,
  theme,
  total,
  glassStyle,
  onUpdateProgress,
}: {
  progress: QuizProgress;
  questions: readonly QuizQuestion[];
  teamName: string;
  theme: QuizTheme;
  total: number;
  glassStyle: React.CSSProperties;
  onUpdateProgress?: (next: QuizProgress) => void;
}) {
  const currentProgress = progress;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Organizer mode state
  const [showOrganizerPanel, setShowOrganizerPanel] = useState(false);
  const [organizerKey, setOrganizerKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingKey, setIsCheckingKey] = useState(false);

  // Per-question point editing state
  const [editingPoints, setEditingPoints] = useState<Record<string, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ qid: string; ok: boolean; msg: string } | null>(null);

  const progressRef = React.useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const onUpdateProgressRef = React.useRef(onUpdateProgress);
  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  // Fetch latest authoritative results from server on mount / refresh
  useEffect(() => {
    let active = true;
    const fetchLatest = async () => {
      try {
        setIsRefreshing(true);
        const res = await fetch(`/api/quiz/hard/results?teamName=${encodeURIComponent(teamName)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && data) {
          const current = progressRef.current;
          const updated: QuizProgress = {
            ...current,
            answers: data.answers ?? current.answers,
            score: typeof data.score === 'number' ? data.score : current.score,
            maxScore: typeof data.maxScore === 'number' ? data.maxScore : current.maxScore,
            results: data.results ?? current.results,
            modelAnswers: data.modelAnswers ?? current.modelAnswers,
          };
          onUpdateProgressRef.current?.(updated);
        }
      } catch (err) {
        console.warn('Failed to fetch hard results from server:', err);
      } finally {
        if (active) setIsRefreshing(false);
      }
    };
    fetchLatest();
    return () => {
      active = false;
    };
  }, [teamName]);

  const handleVerifyOrganizerKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!organizerKey.trim()) {
      setAuthError('Please enter the organizer passphrase');
      return;
    }
    setIsCheckingKey(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/quiz/hard/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', organizerKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Invalid organizer key');
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
        setAuthError(null);
      }
    } catch {
      setAuthError('Connection error verifying organizer key');
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSaveCorrection = async (questionId: string) => {
    const rawVal = editingPoints[questionId];
    if (rawVal === undefined || rawVal.trim() === '') {
      setStatusMessage({ qid: questionId, ok: false, msg: 'Please enter points' });
      return;
    }
    const pointsNum = Number(rawVal);
    if (!Number.isFinite(pointsNum)) {
      setStatusMessage({ qid: questionId, ok: false, msg: 'Invalid number' });
      return;
    }

    setSavingQuestionId(questionId);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/quiz/hard/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          questionId,
          correctedPoints: pointsNum,
          organizerKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ qid: questionId, ok: false, msg: data.error || 'Failed to save' });
        if (res.status === 403) {
          setIsAuthorized(false);
          setAuthError('Organizer authorization failed. Please re-enter passphrase.');
        }
      } else {
        const prevResults = currentProgress.results ?? {};
        const updatedResults = {
          ...prevResults,
          [questionId]: {
            ...prevResults[questionId],
            points: pointsNum,
            correct: pointsNum > 0,
            skipped: false,
            needsReview: false,
          },
        };
        const updated: QuizProgress = {
          ...currentProgress,
          score: data.newScore,
          results: updatedResults,
        };
        onUpdateProgress?.(updated);
        setStatusMessage({
          qid: questionId,
          ok: true,
          msg: `Score updated: ${pointsNum >= 0 ? `+${pointsNum}` : pointsNum} pts (New total: ${data.newScore})`,
        });
      }
    } catch {
      setStatusMessage({ qid: questionId, ok: false, msg: 'Network error saving correction' });
    } finally {
      setSavingQuestionId(null);
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-rose-500/30 p-6 sm:p-10 text-center motion-safe:animate-[modal-in_260ms_ease-out_both]"
      style={glassStyle}
    >
      {/* Header icon */}
      <div className="mx-auto w-14 h-14 rounded-full border-2 border-rose-500/70 flex items-center justify-center text-rose-400 text-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
        ✓
      </div>
      <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-zinc-50 uppercase">
        Hard Trial Complete
      </h2>
      <p className="mt-2 text-sm text-zinc-300 leading-relaxed max-w-lg mx-auto">
        All {total} answers from <strong className="text-zinc-100">{teamName}</strong> have been evaluated by Kusal Sir&apos;s automatic scoring system.
      </p>

      {/* Score Box */}
      <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-rose-500/40 bg-zinc-950/80 px-10 py-5 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400">Total Score</span>
        <span
          className={`mt-1 text-5xl font-black tabular-nums ${(currentProgress.score ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}
        >
          {currentProgress.score ?? 0}
        </span>
        <span className="mt-1 font-mono text-xs text-zinc-500">out of {currentProgress.maxScore ?? 150}</span>
      </div>

      {/* Organizer Mode Toggle Button */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setShowOrganizerPanel((prev) => !prev)}
          className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 border flex items-center gap-2 ${
            isAuthorized
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-700/70 hover:border-zinc-500 hover:text-zinc-100'
          }`}
        >
          <span>{isAuthorized ? '🔓' : '🔒'}</span>
          <span>{isAuthorized ? 'Organizer Mode (Active)' : 'Organizer Controls'}</span>
        </button>
      </div>

      {/* Organizer Unlock Panel */}
      {showOrganizerPanel && (
        <div className="mt-4 p-5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-left max-w-xl mx-auto motion-safe:animate-[modal-in_180ms_ease-out_both]">
          <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span>{isAuthorized ? '🔓' : '🔒'}</span>
              <span>Organizer Score Correction</span>
            </h3>
            {isAuthorized && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthorized(false);
                  setOrganizerKey('');
                }}
                className="text-[11px] font-mono text-amber-400/80 hover:text-amber-200 underline"
              >
                Lock Controls
              </button>
            )}
          </div>

          {!isAuthorized ? (
            <form onSubmit={handleVerifyOrganizerKey} className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter the organizer passphrase to inspect and correct points for any question. All manual corrections are verified server-side and recorded in the audit log.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  placeholder="Organizer Passphrase"
                  value={organizerKey}
                  onChange={(e) => setOrganizerKey(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="submit"
                  disabled={isCheckingKey || !organizerKey.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {isCheckingKey ? 'Verifying…' : 'Unlock'}
                </button>
              </div>
              {authError && (
                <p role="alert" className="text-xs text-rose-400 font-mono mt-1">
                  ✗ {authError}
                </p>
              )}
            </form>
          ) : (
            <div className="text-xs text-amber-200/90 space-y-1">
              <p>✓ Authorized. Inline point adjustment controls are now active for each question below.</p>
              <p className="text-zinc-400 text-[11px]">
                Tip: Standard Hard scoring is +30 for correct and -20 for wrong (or 0 for skipped). You can assign any integer value.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Questions list with participant answer, model answer, and awarded points */}
      <div className="mt-8 text-left">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
          <h3 className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-400">
            Hard Round Breakdown ({total} Questions)
          </h3>
          <span className="font-mono text-[11px] text-zinc-500">
            {isRefreshing ? 'Syncing with server…' : 'Original Question Order'}
          </span>
        </div>

        <ol className="space-y-5">
          {questions.map((q, i) => {
            const result = currentProgress.results?.[q.id];
            const participantAnswer = currentProgress.answers[q.id];
            const modelAnswer = currentProgress.modelAnswers?.[q.id];
            const points = result?.points ?? 0;
            const outcome = result?.needsReview
              ? 'needs review'
              : result?.skipped
              ? 'skipped'
              : result?.correct
              ? 'correct'
              : 'wrong';

            return (
              <li
                key={q.id}
                className="rounded-xl border border-zinc-700/60 bg-zinc-950/80 overflow-hidden shadow-xl"
              >
                {/* Header: Question title & points badge */}
                <div className="px-5 py-3.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/40">
                  <div className="flex items-baseline gap-2.5">
                    <span className={`font-mono text-xs font-bold ${theme.text}`}>Q{i + 1}</span>
                    <span className="text-sm font-semibold text-zinc-100">{'title' in q ? q.title : `Question ${i + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        result?.needsReview
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : points > 0
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : points < 0
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {result?.needsReview ? 'Pending Review' : points > 0 ? `+${points} pts` : `${points} pts`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                        outcome === 'correct'
                          ? 'bg-emerald-400 text-zinc-950'
                          : outcome === 'wrong'
                          ? 'bg-rose-500 text-white'
                          : outcome === 'needs review'
                          ? 'bg-amber-400 text-zinc-950 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                          : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {outcome}
                    </span>
                  </div>
                </div>

                {/* Question context summary */}
                <div className="px-5 py-2.5 text-xs text-zinc-400 border-b border-zinc-800/60 bg-zinc-950/40">
                  <QuestionSummary question={q} />
                </div>

                {/* Review Reason banner if flagged for review */}
                {result?.needsReview && (
                  <div className="px-5 py-2.5 bg-amber-950/30 border-b border-amber-500/20 text-xs text-amber-300 font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{result.reviewReason || 'Flagged for organizer manual review'}</span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 uppercase tracking-wider hidden sm:inline">Use organizer controls below to adjust</span>
                  </div>
                )}

                {/* Comparison Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Participant Answer */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-2 flex items-center justify-between">
                        <span>Participant Answer</span>
                        <span className="text-zinc-500 text-[10px]">{teamName}</span>
                      </div>
                      {participantAnswer ? (
                        <div className="font-mono text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                          {participantAnswer}
                        </div>
                      ) : (
                        <div className="text-xs italic text-zinc-500 py-2">No answer submitted (skipped)</div>
                      )}
                    </div>
                  </div>

                  {/* Official Model Answer */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] tracking-widest uppercase text-emerald-400 mb-2 flex items-center justify-between">
                        <span>Official Model Answer</span>
                        <span className="text-emerald-500/80 text-[10px]">Kusal Sir</span>
                      </div>
                      <div className="font-mono text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {modelAnswer || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Correction Row if authorized */}
                {isAuthorized && (
                  <div className="px-5 py-3 border-t border-amber-500/25 bg-amber-950/15">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          Adjust Points:
                        </span>
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPoints((prev) => ({ ...prev, [q.id]: '30' }))
                            }
                            className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] hover:bg-emerald-900/60"
                          >
                            +30 (Full)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPoints((prev) => ({ ...prev, [q.id]: '0' }))
                            }
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[10px] hover:bg-zinc-800"
                          >
                            0 (Zero)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPoints((prev) => ({ ...prev, [q.id]: '-20' }))
                            }
                            className="px-2 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[10px] hover:bg-rose-900/60"
                          >
                            -20 (Wrong)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingPoints[q.id] ?? String(points)}
                          onChange={(e) =>
                            setEditingPoints((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-20 px-2.5 py-1 rounded bg-zinc-900 border border-amber-500/40 font-mono text-xs text-zinc-100 text-center focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          disabled={savingQuestionId === q.id}
                          onClick={() => handleSaveCorrection(q.id)}
                          className="px-3 py-1 rounded bg-amber-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-400 disabled:opacity-50 transition-colors"
                        >
                          {savingQuestionId === q.id ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {statusMessage && statusMessage.qid === q.id && (
                      <p
                        role="alert"
                        className={`mt-2 font-mono text-xs ${
                          statusMessage.ok ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {statusMessage.ok ? '✓ ' : '✗ '}
                        {statusMessage.msg}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const OUTCOME_STYLES = {
  correct: {
    label: 'Correct',
    icon: '✓',
    row: 'border-emerald-500/30 bg-emerald-950/20',
    badge: 'bg-emerald-400 text-zinc-950',
    points: 'text-emerald-400',
  },
  wrong: {
    label: 'Wrong',
    icon: '✗',
    row: 'border-rose-500/30 bg-rose-950/20',
    badge: 'bg-rose-500 text-white',
    points: 'text-rose-500',
  },
  skipped: {
    label: 'Skipped',
    icon: '–',
    row: 'border-zinc-700/50 bg-zinc-950/40',
    badge: 'bg-zinc-700 text-zinc-200',
    points: 'text-zinc-400',
  },
} as const;

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

      {question.interaction?.type === 'hard_emojis' ? (
        <HardEmojiInputs
          items={question.interaction.items}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          theme={theme}
        />
      ) : question.interaction?.type === 'hard_whoami' ? (
        <HardWhoAmIInputs
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          theme={theme}
        />
      ) : question.interaction?.type === 'hard_puzzle' ? (
        <HardPuzzleInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          theme={theme}
        />
      ) : question.interaction?.type === 'hard_binary_search' ? (
        <HardBinarySearchInputs
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          theme={theme}
        />
      ) : question.interaction?.type === 'hard_matching' ? (
        <HardMatchingMatrix
          licenses={question.interaction.licenses}
          features={question.interaction.features}
          value={value}
          onChange={onChange}
          theme={theme}
        />
      ) : (
        <AnswerBox
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          isLast={isLast}
          theme={theme}
          placeholder={question.placeholder ?? 'Type your answer…'}
        />
      )}
    </>
  );
}

// ── Hard Q1: Five Emojis → Languages ────────────────────────────
function HardEmojiInputs({
  items,
  value,
  onChange,
  onSubmit,
  theme,
}: {
  items: readonly { readonly id: string; readonly label: string; readonly emoji: string }[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  theme: QuizTheme;
}) {
  const parseLines = (val: string) => {
    const map: Record<string, string> = {};
    for (const line of val.split('\n')) {
      const match = line.match(/^\(([a-eA-E])\)\s*(.*)$/);
      if (match) {
        map[match[1].toLowerCase()] = match[2];
      }
    }
    return map;
  };

  const parsed = parseLines(value);

  const update = (id: string, text: string) => {
    const updated = { ...parsed, [id.toLowerCase()]: text };
    const serialized = items
      .map((it) => `${it.label} ${updated[it.id.toLowerCase()] || ''}`.trimEnd())
      .join('\n');
    onChange(serialized);
  };

  return (
    <div className="mt-5 space-y-2.5">
      <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-1">
        Identify the programming language for each emoji:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-3.5 flex flex-col justify-between transition-all"
          >
            <div className="flex items-center gap-2 mb-2 font-mono text-xs">
              <span className="text-2xl leading-none" role="img" aria-label={item.label}>
                {item.emoji}
              </span>
              <span className={`font-bold ${theme.text}`}>{item.label}</span>
            </div>
            <input
              type="text"
              autoFocus={idx === 0 && !value}
              value={parsed[item.id.toLowerCase()] || ''}
              onChange={(e) => update(item.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={`Language for ${item.label}…`}
              className={[
                'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2',
                'text-sm font-mono text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
                theme.input,
                theme.caret,
              ].join(' ')}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
        Press Ctrl / ⌘ + Enter to continue
      </p>
    </div>
  );
}

// ── Hard Q2: Who Am I? ──────────────────────────────────────────
function HardWhoAmIInputs({
  value,
  onChange,
  onSubmit,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  theme: QuizTheme;
}) {
  const parse = (val: string) => {
    let person = '';
    let creation1 = '';
    let creation2 = '';
    for (const line of val.split('\n')) {
      if (/^person:\s*/i.test(line)) person = line.replace(/^person:\s*/i, '');
      else if (/^creation 1:\s*/i.test(line)) creation1 = line.replace(/^creation 1:\s*/i, '');
      else if (/^creation 2:\s*/i.test(line)) creation2 = line.replace(/^creation 2:\s*/i, '');
    }
    if (!person && !creation1 && !creation2 && val.trim()) {
      const lines = val.split('\n');
      person = lines[0] || '';
      creation1 = lines[1] || '';
      creation2 = lines[2] || '';
    }
    return { person, creation1, creation2 };
  };

  const current = parse(value);

  const update = (field: 'person' | 'creation1' | 'creation2', text: string) => {
    const next = { ...current, [field]: text };
    const serialized = [
      `Person: ${next.person}`,
      `Creation 1: ${next.creation1}`,
      `Creation 2: ${next.creation2}`,
    ].join('\n');
    onChange(serialized);
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
        <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1.5 flex items-center gap-1.5">
          <span className={`font-bold ${theme.text}`}>1. Identity</span>
          <span className="text-zinc-500">— Who am I?</span>
        </label>
        <input
          type="text"
          autoFocus={!value}
          value={current.person}
          onChange={(e) => update('person', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Name of the person (creator)…"
          className={[
            'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5',
            'text-sm font-mono text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
            theme.input,
            theme.caret,
          ].join(' ')}
        />
      </div>

      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
        <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1.5 flex items-center gap-1.5">
          <span className={`font-bold ${theme.text}`}>2. Creation 1</span>
          <span className="text-zinc-500">— 1991 hobby project (servers & Android)</span>
        </label>
        <input
          type="text"
          value={current.creation1}
          onChange={(e) => update('creation1', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Name of the first creation / OS kernel…"
          className={[
            'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5',
            'text-sm font-mono text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
            theme.input,
            theme.caret,
          ].join(' ')}
        />
      </div>

      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
        <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1.5 flex items-center gap-1.5">
          <span className={`font-bold ${theme.text}`}>3. Creation 2</span>
          <span className="text-zinc-500">— Version control tool used on GitHub</span>
        </label>
        <input
          type="text"
          value={current.creation2}
          onChange={(e) => update('creation2', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Name of the version control tool…"
          className={[
            'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5',
            'text-sm font-mono text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
            theme.input,
            theme.caret,
          ].join(' ')}
        />
      </div>

      <p className="mt-2 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
        Press Ctrl / ⌘ + Enter to continue
      </p>
    </div>
  );
}

// ── Hard Q3: Switch Puzzle ──────────────────────────────────────
function HardPuzzleInput({
  value,
  onChange,
  onSubmit,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  theme: QuizTheme;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="puzzle-solution" className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
          Step-by-Step Procedure & Reasoning
        </label>
        <span className="font-mono text-[10px] text-zinc-500 uppercase">Single Entry Allowed</span>
      </div>
      <textarea
        id="puzzle-solution"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={7}
        autoFocus={!value}
        placeholder={`Describe your complete procedure:\n1. Which switch do you turn on first, and how long do you wait?\n2. What do you do before entering the room?\n3. When entering the room once, how do you identify which switch controls which bulb based on what you see and feel?`}
        className={[
          'w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-3.5',
          'text-sm leading-relaxed text-zinc-50 placeholder:text-zinc-600 outline-none min-h-[11rem] resize-y transition-[border-color,box-shadow]',
          theme.input,
          theme.caret,
        ].join(' ')}
      />
      <p className="mt-2 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
        Press Ctrl / ⌘ + Enter to continue
      </p>
    </div>
  );
}

// ── Hard Q4: Binary Search Bugs ─────────────────────────────────
function HardBinarySearchInputs({
  value,
  onChange,
  onSubmit,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  theme: QuizTheme;
}) {
  const parse = (val: string) => {
    let bug1 = '';
    let bug2 = '';
    let hangs = '';
    let wrong = '';
    for (const line of val.split('\n')) {
      if (/^bug 1:\s*/i.test(line)) bug1 = line.replace(/^bug 1:\s*/i, '');
      else if (/^bug 2:\s*/i.test(line)) bug2 = line.replace(/^bug 2:\s*/i, '');
      else if (/^input that hangs:\s*/i.test(line)) hangs = line.replace(/^input that hangs:\s*/i, '');
      else if (/^input with wrong answer:\s*/i.test(line)) wrong = line.replace(/^input with wrong answer:\s*/i, '');
    }
    return { bug1, bug2, hangs, wrong };
  };

  const current = parse(value);

  const update = (field: 'bug1' | 'bug2' | 'hangs' | 'wrong', text: string) => {
    const next = { ...current, [field]: text };
    const serialized = [
      `Bug 1: ${next.bug1}`,
      `Bug 2: ${next.bug2}`,
      `Input that hangs: ${next.hangs}`,
      `Input with wrong answer: ${next.wrong}`,
    ].join('\n');
    onChange(serialized);
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
        <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
          <span className={`font-bold ${theme.text}`}>Bug 1</span>
          <span className="text-zinc-500">— Search bounds & infinite loop</span>
        </label>
        <textarea
          rows={2}
          value={current.bug1}
          onChange={(e) => update('bug1', e.target.value)}
          placeholder="Describe Bug 1 (e.g. how low or high are updated, causing an infinite loop)…"
          className={[
            'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2',
            'text-sm text-zinc-50 placeholder:text-zinc-600 outline-none resize-none transition-[border-color,box-shadow]',
            theme.input,
            theme.caret,
          ].join(' ')}
        />
      </div>

      <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
        <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
          <span className={`font-bold ${theme.text}`}>Bug 2</span>
          <span className="text-zinc-500">— Loop termination & skipped case</span>
        </label>
        <textarea
          rows={2}
          value={current.bug2}
          onChange={(e) => update('bug2', e.target.value)}
          placeholder="Describe Bug 2 (e.g. while loop condition when 1 element remains)…"
          className={[
            'w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2',
            'text-sm text-zinc-50 placeholder:text-zinc-600 outline-none resize-none transition-[border-color,box-shadow]',
            theme.input,
            theme.caret,
          ].join(' ')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
          <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
            <span className={`font-bold ${theme.text}`}>Input That Hangs</span>
          </label>
          <input
            type="text"
            value={current.hangs}
            onChange={(e) => update('hangs', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="e.g. binary_search([1, 3, 5, 7], 7)"
            className={[
              'w-full font-mono rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2',
              'text-xs sm:text-sm text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
              theme.input,
              theme.caret,
            ].join(' ')}
          />
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
          <label className="block font-mono text-[11px] tracking-wider uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
            <span className={`font-bold ${theme.text}`}>Input With Wrong Answer</span>
          </label>
          <input
            type="text"
            value={current.wrong}
            onChange={(e) => update('wrong', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="e.g. binary_search([5], 5)"
            className={[
              'w-full font-mono rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2',
              'text-xs sm:text-sm text-zinc-50 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow]',
              theme.input,
              theme.caret,
            ].join(' ')}
          />
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
        Press Ctrl / ⌘ + Enter to continue
      </p>
    </div>
  );
}

// ── Hard Q5: License Matching Matrix ────────────────────────────
function HardMatchingMatrix({
  licenses,
  features,
  value,
  onChange,
  theme,
}: {
  licenses: readonly string[];
  features: readonly { readonly key: string; readonly text: string }[];
  value: string;
  onChange: (value: string) => void;
  theme: QuizTheme;
}) {
  const parse = (val: string) => {
    const map: Record<string, string> = {};
    for (const line of val.split('\n')) {
      const match = line.match(/^([A-Za-z0-9\.\s]+?)\s*[→:=–\-]\s*([A-Da-d])/);
      if (match) {
        map[match[1].trim()] = match[2].toUpperCase();
      }
    }
    return map;
  };

  const matches = parse(value);

  const updateMatch = (license: string, choiceKey: string) => {
    const next = { ...matches, [license]: choiceKey };
    const serialized = licenses
      .map((lic) => `${lic} → ${next[lic] || ''}`.trimEnd())
      .join('\n');
    onChange(serialized);
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-1">
        Select the matching feature (A, B, C, or D) for each license:
      </div>
      {licenses.map((license) => {
        const selectedKey = matches[license] || '';
        const matchedFeature = features.find((f) => f.key === selectedKey);
        return (
          <div
            key={license}
            className="rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono font-bold text-base text-zinc-100 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                {license}
              </div>
              <div className="flex items-center gap-2">
                {features.map((feat) => {
                  const isPicked = selectedKey === feat.key;
                  return (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => updateMatch(license, feat.key)}
                      className={[
                        'w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all duration-150 border cursor-pointer',
                        'focus:outline-none focus-visible:ring-2',
                        theme.ring,
                        isPicked
                          ? theme.badgeSelected
                          : 'border-zinc-700/70 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:text-zinc-50',
                      ].join(' ')}
                    >
                      {feat.key}
                    </button>
                  );
                })}
              </div>
            </div>
            {matchedFeature && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 font-mono text-xs text-rose-300/90 flex items-baseline gap-1.5">
                <span className="font-bold text-zinc-400">{matchedFeature.key}.</span>
                <span>{matchedFeature.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
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
export function QuestionSummary({ question }: { question: QuizQuestion }) {
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

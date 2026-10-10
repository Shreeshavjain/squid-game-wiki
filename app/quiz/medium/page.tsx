'use client';

import React, { useEffect, useState, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MEDIUM_QUIZ } from '../../data/mediumQuiz';
import { DEFAULT_TEAM_SESSION } from '../../data/difficultyTiers';
import { QuizOptionKey, QuizProgress } from '../../types/quiz';
import { ArenaBackground } from '../../components/ArenaBackground';
import { Header } from '../../components/Header';
import { RichText } from '../../components/RichText';
import { getLockedTier, getQuizProgress, saveQuizProgress } from '../../lib/trialStorage';

/**
 * MEDIUM TRIAL QUIZ
 * =================
 * One question at a time. A question must be answered and locked in before the
 * next one appears, and locked answers can't be revisited. The browser back
 * button is neutralised and progress is persisted, so neither going back nor
 * refreshing lets a team leave or restart the trial.
 */
const subscribeNoop = () => () => {};

function MediumQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamName = searchParams.get('teamName') || DEFAULT_TEAM_SESSION.teamName;

  // false during SSR + hydration, true afterwards — storage is only readable on the client
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const hasLockedMedium = isClient && getLockedTier(teamName) === 'medium';

  // Saved progress until the team answers something on this page view.
  // null = not yet readable, or this team hasn't locked Medium (redirected below).
  const [answeredProgress, setProgress] = useState<QuizProgress | null>(null);
  const progress = answeredProgress ?? (hasLockedMedium ? getQuizProgress(teamName, 'medium') : null);
  const [selected, setSelected] = useState<QuizOptionKey | null>(null);

  // Only teams that locked Medium may be here; for them, trap the browser back
  // button by re-pushing the current entry whenever it's popped
  useEffect(() => {
    if (getLockedTier(teamName) !== 'medium') {
      router.replace(`/dashboard?${new URLSearchParams({ teamName })}`);
      return;
    }
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [teamName, router]);

  const session = {
    teamId: DEFAULT_TEAM_SESSION.teamId,
    teamName,
    sessionCode: DEFAULT_TEAM_SESSION.sessionCode,
    arenaStatus: 'LOCKED' as const,
  };

  const total = MEDIUM_QUIZ.length;
  const question = progress && !progress.completed ? MEDIUM_QUIZ[progress.current] : null;
  const isLast = progress?.current === total - 1;

  const handleLockAnswer = () => {
    if (!progress || !question || !selected) return;
    const next: QuizProgress = {
      current: isLast ? progress.current : progress.current + 1,
      answers: { ...progress.answers, [question.id]: selected },
      completed: isLast,
    };
    saveQuizProgress(teamName, 'medium', next);
    setProgress(next);
    setSelected(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col text-zinc-100 overflow-x-hidden">
      <ArenaBackground />
      <Header session={session} isLocked />

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col">
        {/* ── Trial heading ── */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            Medium trial · Open Source &amp; Tech Challenge
          </div>
          <div className="mt-2 font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
            Correct <span className="font-bold text-emerald-400">+20</span>
            <span className="mx-2 text-zinc-600">·</span>
            Wrong <span className="font-bold text-rose-500">-10</span>
          </div>
        </div>

        {progress && (
          <>
            {/* ── Progress segments ── */}
            <div className="mb-4">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-zinc-400 mb-2">
                <span>
                  {progress.completed ? 'All questions answered' : `Question ${progress.current + 1} of ${total}`}
                </span>
                <span>{Object.keys(progress.answers).length} / {total} locked</span>
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
                {MEDIUM_QUIZ.map((q, i) => (
                  <div
                    key={q.id}
                    className={[
                      'h-1.5 rounded-full transition-colors duration-300',
                      progress.answers[q.id]
                        ? 'bg-amber-400'
                        : i === progress.current && !progress.completed
                        ? 'bg-amber-400/40'
                        : 'bg-zinc-800',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>

            {question ? (
              /* ── Question card ── */
              <section
                key={question.id}
                className="relative overflow-hidden rounded-2xl border border-amber-400/20 p-5 sm:p-7 motion-safe:animate-[modal-in_260ms_ease-out_both]"
                style={{
                  backgroundColor: 'rgba(12, 12, 18, 0.78)',
                  backdropFilter: 'blur(18px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
                }}
                aria-labelledby="quiz-question"
              >
                <div
                  className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0"
                  aria-hidden="true"
                />

                <div className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
                  {question.section}
                </div>
                <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-zinc-50">
                  <span className="text-amber-400">Q{progress.current + 1}.</span> {question.title}
                </h2>

                {question.context.length > 0 && (
                  <div className="mt-4 space-y-3 text-sm text-zinc-300 leading-relaxed">
                    {question.context.map((block, i) =>
                      block.type === 'code' ? (
                        <pre
                          key={i}
                          className="font-mono text-sm text-zinc-100 bg-zinc-950/70 border border-zinc-700/40 rounded-lg px-4 py-2.5 overflow-x-auto"
                        >
                          {block.value}
                        </pre>
                      ) : (
                        <p key={i}>
                          <RichText text={block.value} />
                        </p>
                      )
                    )}
                  </div>
                )}

                <p id="quiz-question" className="mt-5 text-base sm:text-lg font-bold text-zinc-50 leading-snug">
                  <RichText text={question.question} boldClassName="underline underline-offset-4 decoration-amber-400" />
                </p>

                {/* ── Options ── */}
                <div role="radiogroup" aria-labelledby="quiz-question" className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((option) => {
                    const isSelected = selected === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelected(option.key)}
                        className={[
                          'flex items-start gap-3 text-left rounded-xl border px-4 py-3 cursor-pointer',
                          'text-sm leading-snug transition-all duration-150',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-zinc-50 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                            : 'border-zinc-700/50 bg-zinc-950/50 text-zinc-300 hover:border-amber-400/50 hover:bg-zinc-900/60',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[11px] font-bold',
                            isSelected ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-zinc-600 text-zinc-400',
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

                {/* ── Lock in ── */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                    Locked answers cannot be changed
                  </p>
                  <button
                    type="button"
                    onClick={handleLockAnswer}
                    disabled={!selected}
                    className={[
                      'px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest font-bold transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      selected
                        ? 'cursor-pointer bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.4)]'
                        : 'cursor-not-allowed bg-zinc-900/60 text-zinc-600 border border-zinc-800',
                    ].join(' ')}
                  >
                    {isLast ? 'Lock answer & finish' : 'Lock answer & next →'}
                  </button>
                </div>
              </section>
            ) : (
              /* ── Completion ── */
              <section
                className="relative overflow-hidden rounded-2xl border border-emerald-400/25 p-8 sm:p-10 text-center motion-safe:animate-[modal-in_260ms_ease-out_both]"
                style={{
                  backgroundColor: 'rgba(12, 12, 18, 0.78)',
                  backdropFilter: 'blur(18px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
                }}
              >
                <div className="mx-auto w-14 h-14 rounded-full border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 text-2xl">
                  ✓
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-zinc-50 uppercase">
                  Trial complete
                </h2>
                <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
                  All {total} answers from <strong className="text-zinc-100">{teamName}</strong> have been
                  locked in. Results will be announced by the organisers.
                </p>

                <div className="mt-6 grid grid-cols-5 gap-2 max-w-sm mx-auto">
                  {MEDIUM_QUIZ.map((q, i) => (
                    <div key={q.id} className="rounded-lg border border-zinc-700/40 bg-zinc-950/60 py-2">
                      <div className="font-mono text-[10px] text-zinc-500">Q{i + 1}</div>
                      <div className="font-mono text-sm font-bold text-amber-400">{progress.answers[q.id] ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function MediumQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <MediumQuizContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { QuizQuestion, EvaluatorDecision } from '../types/quiz';
import { QuestionSummary } from './QuizRunner';

interface EvaluatorModeProps {
  teamName: string;
  questions: readonly QuizQuestion[];
  onScoreUpdated?: (newScore: number, questionId?: string, decision?: EvaluatorDecision) => void;
}

interface EvaluatorGradeItem {
  decision: EvaluatorDecision;
  points: number;
}

export function EvaluatorMode({ teamName, questions, onScoreUpdated }: EvaluatorModeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Evaluator data state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [teamAnswers, setTeamAnswers] = useState<Record<string, string>>({});
  const [modelAnswers, setModelAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, EvaluatorGradeItem>>({});
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Check existing session status on initial mount
  useEffect(() => {
    fetch('/api/evaluator/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  // Load team data whenever panel opens and evaluator is authenticated
  useEffect(() => {
    let ignore = false;
    if (isOpen && isAuthenticated && teamName) {
      const fetchTeamData = async () => {
        try {
          const res = await fetch(`/api/evaluator/team?teamName=${encodeURIComponent(teamName)}`);
          if (res.status === 401) {
            if (!ignore) setIsAuthenticated(false);
            return;
          }
          if (res.ok) {
            const data = await res.json();
            if (!ignore) {
              setTeamAnswers(data.answers || {});
              setModelAnswers(data.modelAnswers || {});
              setGrades(data.evaluatorGrades || {});
              setTotalScore(typeof data.score === 'number' ? data.score : null);
            }
          }
        } catch (err) {
          console.warn('Failed to load evaluator team data:', err);
        }
      };
      fetchTeamData();
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, isAuthenticated, teamName]);

  // Handle Passcode verification
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError('Please enter the evaluator passcode');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/evaluator/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || 'Access denied: Invalid passcode');
        return;
      }

      setIsAuthenticated(true);
      setPasscode('');
      setAuthError(null);
    } catch {
      setAuthError('Network error while authenticating');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle evaluator logout
  const handleLogout = async () => {
    try {
      await fetch('/api/evaluator/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setIsOpen(false);
    setGrades({});
  };

  // Save grade decision for current question
  const handleSelectDecision = async (decision: EvaluatorDecision) => {
    const q = questions[currentIdx];
    if (!q) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch('/api/evaluator/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          questionId: q.id,
          decision,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveStatus(data.error || 'Failed to save grade');
        return;
      }

      // Successfully updated on server
      setGrades(data.evaluatorGrades || {});
      setTotalScore(data.newScore);
      setSaveStatus(`Saved: ${decision.toUpperCase()} (${decision === 'correct' ? '+30' : decision === 'wrong' ? '-20' : '0'} pts)`);

      // Notify host page to refresh score badge/breakdown in real-time
      if (typeof data.newScore === 'number') {
        onScoreUpdated?.(data.newScore, q.id, decision);
      }
    } catch {
      setSaveStatus('Network error saving decision');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = questions[currentIdx];
  const currentGrade = currentQ ? grades[currentQ.id]?.decision ?? 'ungraded' : 'ungraded';
  const participantAnswer = currentQ ? teamAnswers[currentQ.id] : undefined;
  const modelAnswer = currentQ ? modelAnswers[currentQ.id] : undefined;

  // Count evaluated questions
  const evaluatedCount = Object.values(grades).filter(
    (g) => g && (g.decision === 'correct' || g.decision === 'wrong')
  ).length;

  return (
    <>
      {/* ── Discreet Evaluator Entry Point (Bottom Left) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-3 left-3 z-40 text-zinc-600/40 hover:text-amber-400 font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center gap-1.5 select-none cursor-pointer p-1.5 rounded"
        title="Arena Evaluator Mode"
      >
        <span>⚖</span>
        <span className="hidden sm:inline">EVALUATOR</span>
      </button>

      {/* ── Modal Dialog ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
        >
          {!isAuthenticated ? (
            /* ── Passcode Gate ── */
            <div
              className="w-full max-w-md p-6 rounded-2xl border border-amber-500/30 text-center motion-safe:animate-[modal-in_200ms_ease-out_both]"
              style={{
                backgroundColor: 'rgba(14, 14, 20, 0.95)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 24px rgba(245, 158, 11, 0.15)',
              }}
            >
              <div className="mx-auto w-12 h-12 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-400 text-xl mb-3 bg-amber-950/30">
                ⚖
              </div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-400 font-bold">
                ARENA SUPERVISOR
              </span>
              <h2 className="mt-1 text-xl font-black uppercase text-zinc-100 font-sans tracking-wide">
                Evaluator Mode
              </h2>
              <p className="mt-2 text-xs text-zinc-400 font-mono leading-relaxed">
                Enter authorized organizer passcode to grade Hard trial questions for{' '}
                <strong className="text-zinc-200">{teamName}</strong>.
              </p>

              <form onSubmit={handleAuthenticate} className="mt-5 space-y-4">
                <input
                  type="password"
                  autoFocus
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter passcode"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-center font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400"
                />

                {authError && (
                  <p role="alert" className="text-xs font-mono text-rose-400">
                    ⚠ {authError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 font-mono text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    {isAuthenticating ? 'Verifying…' : 'Access Mode'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ── Two-Column Evaluator Panel ── */
            <div
              className="w-full max-w-5xl h-[92vh] max-h-[820px] rounded-2xl border border-amber-500/30 flex flex-col overflow-hidden text-zinc-100 motion-safe:animate-[modal-in_200ms_ease-out_both]"
              style={{
                backgroundColor: 'rgba(10, 10, 16, 0.95)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
              }}
            >
              {/* Header Bar */}
              <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl text-amber-400">⚖</span>
                  <div>
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <span>Evaluator Mode</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-300 font-normal">{teamName}</span>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-400">
                      Graded: {evaluatedCount} / {questions.length} questions · Total Score:{' '}
                      <span
                        className={`font-bold ${
                          (totalScore ?? 0) > 0
                            ? 'text-emerald-400'
                            : (totalScore ?? 0) < 0
                            ? 'text-rose-400'
                            : 'text-zinc-300'
                        }`}
                      >
                        {totalScore !== null ? `${totalScore > 0 ? `+${totalScore}` : totalScore} pts` : '0 pts'}
                      </span>{' '}
                      / 150
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-2.5 py-1 rounded text-zinc-500 hover:text-zinc-300 font-mono text-[11px] uppercase tracking-wider border border-zinc-800"
                  >
                    Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Navigation Pills (Q1–Q5) */}
              <div className="px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto">
                {questions.map((q, idx) => {
                  const qGrade = grades[q.id]?.decision ?? 'ungraded';
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border border-amber-400 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'border border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span>Q{idx + 1}</span>
                      {qGrade === 'correct' ? (
                        <span className="text-emerald-400">✓ (+30)</span>
                      ) : qGrade === 'wrong' ? (
                        <span className="text-rose-400">✗ (-20)</span>
                      ) : (
                        <span className="text-zinc-600">— (0)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Two-Column Body */}
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* ── Left Column: Question, Participant Answer & Model Answer (8 cols) ── */}
                <div className="md:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1">
                  {/* Question Prompt */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2 mb-1.5 font-mono text-xs">
                      <span className="text-amber-400 font-bold">Q{currentIdx + 1}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-300 font-semibold">
                        {currentQ && 'title' in currentQ ? currentQ.title : `Question ${currentIdx + 1}`}
                      </span>
                    </div>
                    {currentQ && (
                      <div className="text-xs text-zinc-400 font-mono mb-2">
                        <QuestionSummary question={currentQ} />
                      </div>
                    )}
                    {currentQ && 'question' in currentQ && (
                      <p className="text-sm font-semibold text-zinc-100 mt-2">
                        {currentQ.question}
                      </p>
                    )}
                  </div>

                  {/* Participant's Answer */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex-1">
                    <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-2 flex items-center justify-between">
                      <span>Candidate Submission</span>
                      <span className="text-zinc-500 font-mono text-[10px]">{teamName}</span>
                    </div>
                    {participantAnswer ? (
                      <div className="font-mono text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
                        {participantAnswer}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-xs italic text-zinc-500 font-mono">
                        (No answer submitted / skipped)
                      </div>
                    )}
                  </div>

                  {/* Official Model Answer */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <div className="font-mono text-[10px] tracking-widest uppercase text-emerald-400 mb-1.5 flex items-center justify-between">
                      <span>Official Model Answer (Reference)</span>
                      <span className="text-emerald-500 text-[10px]">Kusal Sir</span>
                    </div>
                    <div className="font-mono text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                      {modelAnswer || '—'}
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Grading Decision Controls (4 cols) ── */}
                <div className="md:col-span-4 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 mb-1">
                        Grading Decision
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">
                        Select evaluation outcome for Question {currentIdx + 1}:
                      </div>
                    </div>

                    {/* Active Status Badge */}
                    <div className="p-3 rounded-xl border text-center font-mono">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                        Active Grade
                      </div>
                      <div
                        className={`text-sm font-black uppercase tracking-wider ${
                          currentGrade === 'correct'
                            ? 'text-emerald-400'
                            : currentGrade === 'wrong'
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {currentGrade === 'correct'
                          ? '✓ CORRECT (+30 PTS)'
                          : currentGrade === 'wrong'
                          ? '✗ WRONG (-20 PTS)'
                          : '— UNGRADED (0 PTS)'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      {/* Correct (+30) */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSelectDecision('correct')}
                        className={`w-full py-3.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                          currentGrade === 'correct'
                            ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400'
                            : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">✓</span> Correct
                        </span>
                        <span>+30 pts</span>
                      </button>

                      {/* Wrong (-20) */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSelectDecision('wrong')}
                        className={`w-full py-3.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                          currentGrade === 'wrong'
                            ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-2 ring-rose-400'
                            : 'bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">✗</span> Wrong
                        </span>
                        <span>-20 pts</span>
                      </button>

                      {/* Ungraded / Clear (0) */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSelectDecision('ungraded')}
                        className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                          currentGrade === 'ungraded'
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                            : 'bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span>Clear / Ungraded</span>
                        <span>0 pts</span>
                      </button>
                    </div>

                    {/* Status feedback */}
                    {saveStatus && (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-center text-amber-300">
                        {isSaving ? 'Saving decision…' : saveStatus}
                      </div>
                    )}
                  </div>

                  {/* Navigation controls (Prev / Next) */}
                  <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      className="flex-1 py-2 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 font-mono text-xs text-zinc-300 disabled:opacity-40 uppercase"
                    >
                      ← Prev (Q{currentIdx})
                    </button>
                    <button
                      type="button"
                      disabled={currentIdx === questions.length - 1}
                      onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                      className="flex-1 py-2 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 font-mono text-xs text-zinc-300 disabled:opacity-40 uppercase"
                    >
                      Next (Q{currentIdx + 2}) →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

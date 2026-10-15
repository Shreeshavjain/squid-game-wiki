'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '../lib/server/db';
import { ArenaBackground } from '../components/ArenaBackground';

const STORAGE_KEY = 'squid_admin_passcode';
const POLL_INTERVAL_MS = 8000;

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Submitted' | 'Still Attempting'>('all');

  // Verify stored session on initial mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: saved }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.ok) {
            setPasscode(saved);
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handle Passcode Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passcode.trim();
    if (!trimmed) {
      setAuthError('Please enter the supervisor passcode');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || 'Access denied: Invalid passcode');
        return;
      }

      // Success
      sessionStorage.setItem(STORAGE_KEY, trimmed);
      setIsAuthenticated(true);
    } catch {
      setAuthError('Failed to verify passcode. Check network connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setPasscode('');
    setLeaderboard([]);
  };

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    if (!passcode) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/leaderboard', {
        headers: { 'x-admin-passcode': passcode },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
        setAuthError('Session expired. Please log in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
          setLastUpdated(new Date());
          setFetchError(null);
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Live telemetry polling (every 4 seconds)
  useEffect(() => {
    if (!isAuthenticated || !passcode) return;

    let isMounted = true;
    const poll = async () => {
      try {
        const res = await fetch('/api/admin/leaderboard', {
          headers: { 'x-admin-passcode': passcode },
        });

        if (!isMounted) return;

        if (res.status === 401) {
          sessionStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
          setAuthError('Session expired. Please log in again.');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ok && Array.isArray(data.leaderboard)) {
            setLeaderboard(data.leaderboard);
            setLastUpdated(new Date());
            setFetchError(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err instanceof Error ? err.message : 'Network error');
        }
      }
    };

    // Immediate initial poll
    poll();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      poll();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, passcode]);

  // Filtered leaderboard list
  const filteredTeams = useMemo(() => {
    return leaderboard.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!item.teamName.toLowerCase().includes(query)) return false;
      }
      if (selectedDifficulty !== 'all') {
        if (item.difficulty !== selectedDifficulty) return false;
      }
      if (selectedStatus !== 'all') {
        if (item.status !== selectedStatus) return false;
      }
      return true;
    });
  }, [leaderboard, searchQuery, selectedDifficulty, selectedStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const total = leaderboard.length;
    const submitted = leaderboard.filter((t) => t.status === 'Submitted').length;
    const attempting = leaderboard.filter((t) => t.status === 'Still Attempting').length;
    const scores = leaderboard
      .filter((t) => t.status === 'Submitted' && typeof t.score === 'number')
      .map((t) => t.score as number);
    const topScore = scores.length > 0 ? Math.max(...scores) : null;

    return { total, submitted, attempting, topScore };
  }, [leaderboard]);

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-zinc-100 overflow-x-hidden bg-[#07070a]">
      {/* Cinematic Animated Arena Background */}
      <ArenaBackground />

      {/* Top Header */}
      <header
        className="relative z-30 w-full"
        style={{
          backgroundColor: 'rgba(7, 7, 12, 0.75)',
          backdropFilter: 'blur(16px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Emblem */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm text-rose-500"
              style={{
                backgroundColor: 'rgba(12, 12, 18, 0.7)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                boxShadow: '0 0 12px rgba(225, 29, 72, 0.15)',
              }}
            >
              <span className="text-sm font-black tracking-tighter">○</span>
              <span className="text-sm font-black tracking-tighter">△</span>
              <span className="text-sm font-black tracking-tighter">□</span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold tracking-[0.25em] text-rose-500 uppercase">
                  SUPERVISOR PORTAL
                </span>
                <span className="text-zinc-600 text-xs font-mono">•</span>
                <span className="text-xs font-mono tracking-wider text-zinc-400 uppercase hidden sm:inline-block">
                  LIVE TELEMETRY
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-zinc-100 uppercase font-sans">
                ARENA LEADERBOARD
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-colors"
            >
              ← Arena Home
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Lock Terminal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {!isAuthenticated ? (
          /* ── PASSCODE ENTRY SCREEN ── */
          <div className="flex-1 flex items-center justify-center py-12">
            <div
              className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-rose-500/30 text-center motion-safe:animate-[modal-in_260ms_ease-out_both]"
              style={{
                backgroundColor: 'rgba(12, 12, 18, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(225, 29, 72, 0.15)',
              }}
            >
              {/* Geometric Header Emblem */}
              <div className="mx-auto w-12 h-12 rounded-full border border-rose-500/50 flex items-center justify-center text-rose-500 text-lg mb-4 bg-rose-950/20 shadow-[0_0_16px_rgba(225,29,72,0.2)]">
                🔒
              </div>

              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-500 font-bold">
                RESTRICTED ARENA PROTOCOL
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-black uppercase text-zinc-100 tracking-wide font-sans">
                Supervisor Access
              </h2>
              <p className="mt-2 text-xs text-zinc-400 font-mono leading-relaxed">
                Enter the authorized administrative passphrase to observe live candidate telemetry and event scoring.
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <input
                    type="password"
                    autoFocus
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Enter admin passcode"
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-center font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>

                {authError && (
                  <p role="alert" className="text-xs font-mono text-rose-400 tracking-wide">
                    ⚠ {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase tracking-widest font-bold py-3 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? 'Authenticating…' : 'Unlock Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ── LIVE LEADERBOARD DASHBOARD ── */
          <div className="space-y-6">
            {/* Telemetry Status Bar & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Telemetry Radar
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    Auto-polling every {POLL_INTERVAL_MS / 1000}s
                    {lastUpdated && ` · Last sync: ${lastUpdated.toLocaleTimeString()}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className={isLoading ? 'animate-spin' : ''}>↻</span>
                  <span>{isLoading ? 'Syncing…' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs font-mono text-rose-300 flex items-center gap-2">
                <span>⚠</span>
                <span>{fetchError}</span>
              </div>
            )}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md">
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Total Squads
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black font-mono text-zinc-100">
                  {metrics.total}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 backdrop-blur-md">
                <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  Submitted
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {metrics.submitted}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/15 backdrop-blur-md">
                <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                  Still Attempting
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {metrics.attempting}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/15 backdrop-blur-md">
                <div className="font-mono text-[10px] uppercase tracking-widest text-rose-400">
                  High Score
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black font-mono text-rose-400">
                  {metrics.topScore !== null ? `${metrics.topScore > 0 ? `+${metrics.topScore}` : metrics.topScore} pts` : '—'}
                </div>
              </div>
            </div>

            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-950/60 backdrop-blur-md">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by team name…"
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Difficulty Selector */}
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5 text-[11px] font-mono">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedDifficulty(tier)}
                      className={`px-2.5 py-1 rounded-md uppercase tracking-wider transition-colors ${
                        selectedDifficulty === tier
                          ? 'bg-zinc-800 text-zinc-100 font-bold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                {/* Status Selector */}
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5 text-[11px] font-mono">
                  {(['all', 'Submitted', 'Still Attempting'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-md uppercase tracking-wider transition-colors ${
                        selectedStatus === st
                          ? 'bg-zinc-800 text-zinc-100 font-bold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {st === 'all' ? 'All Status' : st === 'Submitted' ? 'Submitted' : 'In Progress'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard Table Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Rank</th>
                      <th className="py-3.5 px-4 sm:px-6">Squad Name</th>
                      <th className="py-3.5 px-4 sm:px-6">Selected Tier</th>
                      <th className="py-3.5 px-4 sm:px-6">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Score</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right hidden md:table-cell">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono text-xs">
                          {leaderboard.length === 0
                            ? 'No teams enrolled in the arena yet.'
                            : 'No squads match the selected filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((entry, index) => {
                        const rank = index + 1;
                        const isTop3 = entry.status === 'Submitted' && rank <= 3;
                        return (
                          <tr
                            key={entry.teamName}
                            className={`transition-colors hover:bg-zinc-900/40 ${
                              isTop3 ? 'bg-zinc-900/20' : ''
                            }`}
                          >
                            {/* Rank Column */}
                            <td className="py-3.5 px-4 sm:px-6 text-center">
                              {entry.status === 'Submitted' ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-black ${
                                    rank === 1
                                      ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                                      : rank === 2
                                      ? 'bg-zinc-300 text-zinc-950 shadow-[0_0_10px_rgba(212,212,216,0.3)]'
                                      : rank === 3
                                      ? 'bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.3)]'
                                      : 'text-zinc-500'
                                  }`}
                                >
                                  {rank}
                                </span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>

                            {/* Team Name */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <span className="font-bold text-zinc-100 text-sm tracking-wide">
                                {entry.teamName}
                              </span>
                            </td>

                            {/* Difficulty */}
                            <td className="py-3.5 px-4 sm:px-6">
                              {entry.difficulty === 'easy' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span>○</span> Easy
                                </span>
                              ) : entry.difficulty === 'medium' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <span>△</span> Medium
                                </span>
                              ) : entry.difficulty === 'hard' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                  <span>□</span> Hard
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider text-zinc-500 border border-zinc-800">
                                  Selecting…
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 sm:px-6">
                              {entry.status === 'Submitted' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                                  <span>✓</span> Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950/40 text-amber-300 border border-amber-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  Still Attempting
                                </span>
                              )}
                            </td>

                            {/* Score */}
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              {entry.status === 'Submitted' && entry.score !== null ? (
                                <div className="inline-flex flex-col items-end">
                                  <span
                                    className={`text-base font-black tabular-nums ${
                                      entry.score > 0
                                        ? 'text-emerald-400'
                                        : entry.score < 0
                                        ? 'text-rose-400'
                                        : 'text-zinc-400'
                                    }`}
                                  >
                                    {entry.score > 0 ? `+${entry.score}` : entry.score}
                                  </span>
                                  {entry.maxScore && (
                                    <span className="text-[10px] text-zinc-500">
                                      out of {entry.maxScore}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-zinc-600 font-bold tracking-wider" title="Score hidden until submitted">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Submitted At */}
                            <td className="py-3.5 px-4 sm:px-6 text-right text-zinc-500 text-[11px] hidden md:table-cell">
                              {entry.submittedAt ? (
                                new Date(entry.submittedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              ) : (
                                <span className="italic text-zinc-600">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Telemetry Footer */}
      <footer
        className="relative z-10 w-full py-4 px-4 sm:px-8 text-center text-zinc-500 font-mono text-[11px] tracking-wider uppercase"
        style={{
          backgroundColor: 'rgba(6, 6, 10, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SQUID GAME ARENA // ADMIN RADAR</span>
          <span>LIVE LEADERBOARD SYSTEM</span>
          <span>UNIV-TECH-CLUB EVENT 2026</span>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DIFFICULTY_TIERS, DEFAULT_TEAM_SESSION } from '../data/difficultyTiers';
import { DifficultyTier, TeamSessionInfo } from '../types/difficulty';
import { Header } from '../components/Header';
import { ArenaBackground } from '../components/ArenaBackground';
import { DifficultyCard } from '../components/DifficultyCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { LockedBanner } from '../components/LockedBanner';
import { getLockedTier, setLockedTier as persistLockedTier } from '../lib/trialStorage';

// Tiers that are played as a quiz on their own page
const QUIZ_TIERS: readonly DifficultyTier['id'][] = ['easy', 'medium', 'hard'];
const quizUrl = (tierId: DifficultyTier['id'], teamName: string) =>
  `/quiz/${tierId}?${new URLSearchParams({ teamName })}`;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Configurable team & session state
  const [session, setSession] = useState<TeamSessionInfo>(() => {
    return {
      teamId: searchParams.get('teamId') || DEFAULT_TEAM_SESSION.teamId,
      teamName: searchParams.get('teamName') || DEFAULT_TEAM_SESSION.teamName,
      sessionCode: searchParams.get('sessionCode') || DEFAULT_TEAM_SESSION.sessionCode,
      arenaStatus: DEFAULT_TEAM_SESSION.arenaStatus,
    };
  });

  // Modal selection state (tier being confirmed, or null if modal closed)
  const [selectedTierForModal, setSelectedTierForModal] =
    useState<DifficultyTier | null>(null);

  // Local prototype locked state (tier irrevocably locked in current session)
  const [lockedTier, setLockedTier] = useState<DifficultyTier | null>(null);

  // A team that already locked a quiz tier can't come back here to pick again;
  // replace() keeps the dashboard out of history
  useEffect(() => {
    const locked = getLockedTier(session.teamName);
    if (locked && QUIZ_TIERS.includes(locked)) router.replace(quizUrl(locked, session.teamName));
  }, [session.teamName, router]);

  // Card selection clicked -> opens confirmation modal (DOES NOT LOCK DIRECTLY)
  const handleInitiateSelection = (tier: DifficultyTier) => {
    setSelectedTierForModal(tier);
  };

  // Close / Abort confirmation modal
  const handleCancelModal = () => {
    setSelectedTierForModal(null);
  };

  // Explicit confirmation from modal -> Locks choice
  const handleConfirmLock = (tier: DifficultyTier) => {
    if (QUIZ_TIERS.includes(tier.id)) {
      persistLockedTier(session.teamName, tier.id);
      // Record the choice in the database; the final quiz submit records it too if this fails
      fetch('/api/teams/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: session.teamName, difficulty: tier.id }),
        keepalive: true,
      }).catch(() => {});
      router.replace(quizUrl(tier.id, session.teamName));
      return;
    }
    setLockedTier(tier);
    setSelectedTierForModal(null);
    setSession((prev) => ({
      ...prev,
      arenaStatus: 'LOCKED',
    }));
  };

  // Reset lock state for demo testing
  const handleResetLock = () => {
    setLockedTier(null);
    setSession((prev) => ({
      ...prev,
      arenaStatus: 'ACTIVE_SELECTION',
    }));
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-zinc-100 overflow-x-hidden">
      {/* 1. Cinematic Architectural Background */}
      <ArenaBackground />

      {/* 2. Top Glass Header */}
      <Header
        session={session}
        onUpdateSession={setSession}
        isLocked={lockedTier !== null}
      />

      {/* 3. Main Dashboard Workspace */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col items-center">
        {/* If locked, display top confirmation status banner */}
        {lockedTier && (
          <LockedBanner
            lockedTier={lockedTier}
            session={session}
            onResetLock={handleResetLock}
          />
        )}

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-5">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase font-sans text-zinc-50 leading-none" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)' }}>
            CHOOSE YOUR{' '}<span className="text-rose-500">GAME</span>
          </h2>

          <p className="mt-3 text-sm leading-relaxed max-w-2xl mx-auto font-medium" style={{ color: '#F5F2F3', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            Review the three trial sectors. Each tier carries distinct algorithmic constraints,
            strict time caps, and escalating penalty multipliers. Once your squad captain
            confirms, the assignment is locked.
          </p>
        </section>

        <section
          aria-label="Difficulty Selection Cards"
          className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 items-stretch"
        >
          {DIFFICULTY_TIERS.map((tier) => (
            <DifficultyCard
              key={tier.id}
              tier={tier}
              isLocked={lockedTier !== null}
              isCurrentLockedTier={lockedTier?.id === tier.id}
              onInitiateSelection={handleInitiateSelection}
            />
          ))}
        </section>

        {/* Tactical Event Notice Footer Strip */}
        <section className="mt-16 w-full max-w-4xl border-t border-zinc-700/30 pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-400 font-mono text-xs gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-rose-500 font-bold">⚠</span>
            <span>EACH TEAM IS PERMITTED EXACTLY ONE SECTOR ASSIGNMENT</span>
          </div>
          <div className="text-center sm:text-right text-zinc-500">
            RULES VERSION 1.0 // HOSTED BY TECH-CLUB ADVISORY
          </div>
        </section>
      </main>

      {/* 5. Irreversible Choice Confirmation Modal */}
      <ConfirmationModal
        tier={selectedTierForModal}
        session={session}
        isOpen={selectedTierForModal !== null}
        onCancel={handleCancelModal}
        onConfirmLock={handleConfirmLock}
      />

      {/* Bottom Telemetry Bar */}
      <footer
        className="relative z-10 w-full py-4 px-4 sm:px-8 text-center text-zinc-500 font-mono text-[11px] tracking-wider uppercase"
        style={{
          backgroundColor: 'rgba(6, 6, 10, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>THE ARENA SYSTEM // ALL RIGHTS RESERVED</span>
          <span>
            PRESS <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px]">TAB</kbd> TO NAVIGATE // <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px]">ENTER</kbd> TO SELECT
          </span>
          <span>UNIV-TECH-CLUB EVENT 2026</span>
        </div>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <DashboardContent />
    </Suspense>
  );
}

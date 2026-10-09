'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DIFFICULTY_TIERS, DEFAULT_TEAM_SESSION } from '../data/difficultyTiers';
import { DifficultyTier, TeamSessionInfo } from '../types/difficulty';
import { Header } from '../components/Header';
import { ArenaBackground } from '../components/ArenaBackground';
import { DifficultyCard } from '../components/DifficultyCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { LockedBanner } from '../components/LockedBanner';

function DashboardContent() {
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

  // Explicit tracking for mobile tap-to-expand to allow one or multiple cards expanded
  const [tapExpandedTierId, setTapExpandedTierId] = useState<string | null>(null);

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

  // Toggle mobile expansion
  const handleToggleExpand = (tierId: string) => {
    setTapExpandedTierId((prev) => (prev === tierId ? null : tierId));
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
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col items-center">
        {/* If locked, display top confirmation status banner */}
        {lockedTier && (
          <LockedBanner
            lockedTier={lockedTier}
            session={session}
            onResetLock={handleResetLock}
          />
        )}

        {/* Hero Section */}
        <section 
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 p-6 sm:p-8 rounded-2xl"
          style={{
            backgroundColor: 'rgba(10, 10, 14, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-700/50 text-[11px] font-mono tracking-widest text-zinc-300 uppercase mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
            <span>PHASE 01 // SECTOR ALLOCATION PROTOCOL</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase font-sans text-zinc-50 leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            CHOOSE YOUR{' '}<span className="text-rose-500">GAME</span>
          </h2>

          <p className="mt-4 text-sm text-zinc-200 leading-relaxed max-w-2xl mx-auto font-medium">
            Review the three trial sectors. Each tier carries distinct algorithmic constraints,
            strict time caps, and escalating penalty multipliers. Once your squad captain
            confirms, the assignment is locked.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-mono text-zinc-300 uppercase tracking-widest">
            <span className="bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700/30">[○] TIER 1: WORKER</span>
            <span className="bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700/30">[△] TIER 2: SOLDIER</span>
            <span className="bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700/30">[□] TIER 3: SUPERVISOR</span>
          </div>
        </section>

        <section
          aria-label="Difficulty Selection Cards"
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 items-start"
        >
          {DIFFICULTY_TIERS.map((tier) => (
            <DifficultyCard
              key={tier.id}
              tier={tier}
              isLocked={lockedTier !== null}
              isCurrentLockedTier={lockedTier?.id === tier.id}
              onInitiateSelection={handleInitiateSelection}
              isForceExpanded={tapExpandedTierId === tier.id}
              onToggleExpand={() => handleToggleExpand(tier.id)}
            />
          ))}
        </section>

        {/* Tactical Event Notice Footer Strip */}
        <section className="mt-16 w-full max-w-4xl border-t border-zinc-700/30 pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 font-mono text-xs gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-rose-500 font-bold">⚠</span>
            <span>EACH TEAM IS PERMITTED EXACTLY ONE SECTOR ASSIGNMENT</span>
          </div>
          <div className="text-center sm:text-right text-zinc-600">
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

'use client';

import React, { useState } from 'react';
import { DIFFICULTY_TIERS, DEFAULT_TEAM_SESSION } from './data/difficultyTiers';
import { DifficultyTier, TeamSessionInfo } from './types/difficulty';
import { Header } from './components/Header';
import { ArenaBackground } from './components/ArenaBackground';
import { DifficultyCard } from './components/DifficultyCard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LockedBanner } from './components/LockedBanner';

export default function Home() {
  // Configurable team & session state
  const [session, setSession] = useState<TeamSessionInfo>(DEFAULT_TEAM_SESSION);

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

      {/* 2. Top Minimalist Header */}
      <Header
        session={session}
        onUpdateSession={setSession}
        isLocked={lockedTier !== null}
      />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col items-center">
        {/* If locked, display top confirmation status banner */}
        {lockedTier && (
          <LockedBanner
            lockedTier={lockedTier}
            session={session}
            onResetLock={handleResetLock}
          />
        )}

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono tracking-widest text-zinc-400 uppercase mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
            <span>PHASE 01 // SECTOR ALLOCATION PROTOCOL</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase font-sans text-zinc-100 leading-none">
            CHOOSE YOUR{' '}<span className="text-rose-500">GAME</span>
          </h2>

          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Review the three trial sectors. Each tier carries distinct algorithmic constraints,
            strict time caps, and escalating penalty multipliers. Once your squad captain
            confirms, the assignment is locked.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>[○] TIER 1: WORKER</span>
            <span className="text-zinc-700" aria-hidden="true">•</span>
            <span>[△] TIER 2: SOLDIER</span>
            <span className="text-zinc-700" aria-hidden="true">•</span>
            <span>[□] TIER 3: SUPERVISOR</span>
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
        <section className="mt-16 w-full max-w-4xl border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 font-mono text-xs gap-4">
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
      <footer className="w-full border-t border-zinc-900 bg-[#060608]/90 py-4 px-4 sm:px-8 text-center text-zinc-600 font-mono text-[11px] tracking-wider uppercase">
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

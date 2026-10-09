'use client';

import React from 'react';
import { DifficultyTier, TeamSessionInfo } from '../types/difficulty';
import { GeometricIcon } from './GeometricIcon';

interface LockedBannerProps {
  lockedTier: DifficultyTier;
  session: TeamSessionInfo;
  onResetLock: () => void;
}

export function LockedBanner({
  lockedTier,
  session,
  onResetLock,
}: LockedBannerProps) {
  return (
    <div
      role="region"
      aria-label="Locked Sector Status Banner"
      className="w-full max-w-5xl mx-auto mb-8 p-4 sm:p-5 rounded-xl bg-zinc-950/90 border-2 border-rose-600/80 shadow-[0_0_40px_rgba(225,29,72,0.25)] relative overflow-hidden"
    >
      {/* Background ambient crimson wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.15),transparent_70%)] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Icon & Locked Status */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-rose-500/80 flex items-center justify-center text-rose-500 shrink-0 shadow-[0_0_15px_rgba(225,29,72,0.3)]">
            <GeometricIcon symbol={lockedTier.symbol} size={32} glow />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[11px] font-bold tracking-widest text-rose-500 uppercase flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
                CHOICE LOCKED // SQUAD COMMITTED
              </span>
              <span className="text-zinc-600 text-xs font-mono">•</span>
              <span className="font-mono text-xs text-zinc-400">
                {session.teamId}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase font-sans tracking-tight">
              {lockedTier.title} PROTOCOL ACTIVATED ({lockedTier.code})
            </h2>

            <div className="font-mono text-xs text-zinc-400 mt-0.5">
              Target Bounty: <span className="text-rose-400 font-bold">{lockedTier.bountyMultiplier}</span> | Time Cap:{' '}
              <span className="text-zinc-200">{lockedTier.timeLimit}</span>
            </div>
          </div>
        </div>

        {/* Right: Technical Prototype Note & Reset Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="text-left md:text-right">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-900/60">
              PROTOTYPE STATE
            </span>
            <p className="font-mono text-[10px] text-zinc-500 max-w-xs mt-1">
              Local React state simulated. Production locks via backend authenticated session.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetLock}
            className="w-full sm:w-auto px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded transition cursor-pointer"
            title="Reset the local selection state to test other difficulty options"
          >
            ↻ RESET SELECTION (DEMO)
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { TeamSessionInfo } from '../types/difficulty';

interface HeaderProps {
  session: TeamSessionInfo;
  onUpdateSession?: (updated: TeamSessionInfo) => void;
  isLocked: boolean;
}

export function Header({ session, isLocked }: HeaderProps) {
  return (
    <header
      className="relative z-30 w-full transition-colors"
      style={{
        /* Translucent charcoal glass with restrained blur */
        backgroundColor: 'rgba(7, 7, 12, 0.55)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
        /* Subtle bottom border: thin crimson/white line */
        borderBottom: '1px solid rgba(225, 29, 72, 0.15)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Event Branding & Geometric Symbols */}
        <div className="flex items-center space-x-4">
          {/* Geometric Emblem (○ △ □) */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm text-rose-500"
            style={{
              backgroundColor: 'rgba(12, 12, 18, 0.6)',
              border: '1px solid rgba(225, 29, 72, 0.2)',
              boxShadow: '0 0 12px rgba(225, 29, 72, 0.1)',
            }}
            title="The Arena Triad: Circle, Triangle, Square"
          >
            <span className="text-sm font-black tracking-tighter">○</span>
            <span className="text-sm font-black tracking-tighter">△</span>
            <span className="text-sm font-black tracking-tighter">□</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-rose-500 uppercase">
                THE ARENA
              </span>
              <span className="text-zinc-600 text-xs font-mono">•</span>
              <span className="text-xs font-mono tracking-wider text-zinc-400 uppercase hidden sm:inline-block">
                TECH TRIALS 2026
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-wider text-zinc-100 uppercase font-sans">
              WIKI SQUID GAME
            </h1>
          </div>
        </div>

        {/* Right: Team / Session Badge */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Status Capsule */}
          <div
            className="hidden md:flex items-center space-x-2 px-3 py-1 rounded"
            style={{
              backgroundColor: 'rgba(12, 12, 18, 0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isLocked
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
              }`}
            />
            <span className="font-mono text-xs tracking-wider text-zinc-300 uppercase">
              {isLocked ? 'PROTOCOL LOCKED' : 'AWAITING SELECTION'}
            </span>
          </div>

          {/* Squad Session Tag */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="font-mono text-xs font-bold text-zinc-200 tracking-wider">
                  {session.teamId}
                </span>
                <span className="text-zinc-600 text-[10px] font-mono">/</span>
                <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[120px] sm:max-w-[160px]">
                  {session.teamName}
                </span>
              </div>
              <div className="font-mono text-[10px] text-zinc-500 tracking-wider">
                {session.sessionCode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

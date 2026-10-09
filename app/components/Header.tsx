'use client';

import React, { useState } from 'react';
import { TeamSessionInfo } from '../types/difficulty';

interface HeaderProps {
  session: TeamSessionInfo;
  onUpdateSession: (updated: TeamSessionInfo) => void;
  isLocked: boolean;
}

export function Header({ session, onUpdateSession, isLocked }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTeamId, setTempTeamId] = useState(session.teamId);
  const [tempTeamName, setTempTeamName] = useState(session.teamName);
  const [tempSessionCode, setTempSessionCode] = useState(session.sessionCode);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSession({
      ...session,
      teamId: tempTeamId.trim() || 'TEAM-456',
      teamName: tempTeamName.trim() || 'UNREGISTERED SQUAD',
      sessionCode: tempSessionCode.trim() || 'SESSION 01',
    });
    setIsEditing(false);
  };

  return (
    <header className="relative w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Event Branding & Geometric Symbols */}
        <div className="flex items-center space-x-4">
          {/* Geometric Emblem (○ △ □) */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm bg-zinc-900/90 border border-zinc-800 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.15)]"
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
              UNIVERSITY SQUID HACKATHON
            </h1>
          </div>
        </div>

        {/* Right: Configurable Team / Session Badge */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Status Capsule */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded border border-zinc-800 bg-zinc-900/50">
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

          {/* Configurable Squad Session Tag */}
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

            {/* Quick Edit Config Button */}
            <button
              onClick={() => {
                setTempTeamId(session.teamId);
                setTempTeamName(session.teamName);
                setTempSessionCode(session.sessionCode);
                setIsEditing(true);
              }}
              title="Configure Team & Session identifiers"
              className="px-2 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              aria-label="Edit team details"
            >
              CONFIG
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modal to configure session label */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="config-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-rose-500 text-xs font-mono font-bold">●</span>
                <h2
                  id="config-modal-title"
                  className="font-mono text-sm tracking-widest text-zinc-100 uppercase"
                >
                  CONFIGURE SQUAD TELEMETRY
                </h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-zinc-500 hover:text-zinc-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1">
                  Team Identifier Code
                </label>
                <input
                  type="text"
                  value={tempTeamId}
                  onChange={(e) => setTempTeamId(e.target.value)}
                  placeholder="e.g. TEAM-456"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1">
                  Squad Display Name
                </label>
                <input
                  type="text"
                  value={tempTeamName}
                  onChange={(e) => setTempTeamName(e.target.value)}
                  placeholder="e.g. SANG-WOO CONSORTIUM"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1">
                  Session / Bracket Code
                </label>
                <input
                  type="text"
                  value={tempSessionCode}
                  onChange={(e) => setTempSessionCode(e.target.value)}
                  placeholder="e.g. SESSION 01 // BRACKET A"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-[0_0_15px_rgba(225,29,72,0.4)] transition"
                >
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

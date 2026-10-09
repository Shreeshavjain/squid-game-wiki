'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArenaBackground } from './components/ArenaBackground';
import { DEFAULT_TEAM_SESSION } from './data/difficultyTiers';

export default function EntryPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState(DEFAULT_TEAM_SESSION.teamId);
  const [teamName, setTeamName] = useState(DEFAULT_TEAM_SESSION.teamName);
  const [sessionCode, setSessionCode] = useState(DEFAULT_TEAM_SESSION.sessionCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pass session information to dashboard via query parameters
    // since we do not have a backend or global state management yet.
    const params = new URLSearchParams();
    params.set('teamId', teamId.trim() || 'TEAM-456');
    params.set('teamName', teamName.trim() || 'UNREGISTERED SQUAD');
    params.set('sessionCode', sessionCode.trim() || 'SESSION 01');
    
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center text-zinc-100 overflow-x-hidden p-4">
      <ArenaBackground />
      
      <div 
        className="relative z-10 w-full max-w-md rounded-xl shadow-2xl p-6 sm:p-8"
        style={{
          backgroundColor: 'rgba(10, 10, 14, 0.82)',
          backdropFilter: 'blur(12px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-rose-500 text-xs font-mono font-bold">●</span>
            <h1 className="font-mono text-sm tracking-widest text-zinc-100 uppercase">
              SQUAD REGISTRATION
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
              Team Identifier Code
            </label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. TEAM-456"
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-700/50 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
              Squad Display Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. SANG-WOO CONSORTIUM"
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-700/50 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
              Session / Bracket Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              placeholder="e.g. SESSION 01 // BRACKET A"
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-700/50 rounded font-mono text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 font-mono text-xs uppercase tracking-widest bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b10]"
            >
              ENTER THE ARENA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

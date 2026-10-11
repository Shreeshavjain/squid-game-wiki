'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntryPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setError('Team name is required to enter.');
      return;
    }
    
    // Enroll the team in the database; keepalive lets it finish across the navigation
    fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: trimmedName }),
      keepalive: true,
    }).catch(() => {});

    const params = new URLSearchParams();
    params.set('teamName', trimmedName);
    
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden px-4 py-6 sm:py-8">
      {/* Full-screen background with carefully chosen position and dark overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/squid.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      </div>

      {/* Main Content Group: input pinned to the exact vertical center, logo stacked above it */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex justify-center px-4">
        <div className="relative w-full max-w-lg px-2 sm:px-6">

        {/* Squid Game Logo (Standalone, no background card) — the source PNG is square with
            transparent padding above/below the artwork, so crop to 2:1 to keep it tight to the input */}
        <img
          src="/images/squid-game-logo.png"
          alt="Squid Game"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:mb-6 w-[min(92vw,380px)] sm:w-[540px] lg:w-[640px] max-w-none aspect-[2/1] object-cover object-center drop-shadow-2xl"
        />

        {/* Middle: Single Cohesive UI Component */}
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center w-full rounded-full p-1.5 transition-all"
          style={{
            backgroundColor: 'rgba(20, 20, 26, 0.55)',
            backdropFilter: 'blur(16px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <input
            type="text"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter your team name"
            className="flex-1 bg-transparent border-none text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-0 px-5 font-mono text-sm sm:text-base tracking-wide"
            aria-label="Team name"
            aria-invalid={!!error}
            aria-describedby={error ? "team-name-error" : undefined}
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-widest px-6 sm:px-8 py-3 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
          >
            Enter
          </button>
        </form>
        {error && (
          <p id="team-name-error" className="absolute top-full inset-x-0 mt-4 text-center text-xs font-mono text-rose-400 tracking-wide" role="alert">
            {error}
          </p>
        )}
        </div>
      </div>

      {/* Bottom: Partner Branding in a single glass panel matching the search bar */}
      <div className="relative z-10 w-full flex flex-col items-center mt-auto pt-8 pb-safe mb-6 sm:mb-10">
        <p className="mb-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-400">
          Presented by
        </p>
        <div
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl px-6 py-4 sm:px-8"
          style={{
            backgroundColor: 'rgba(20, 20, 26, 0.55)',
            backdropFilter: 'blur(16px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <img
            src="/images/wikiclub-logo-light.png"
            alt="WikiClub Tech India"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <span className="h-px w-16 sm:h-8 sm:w-px bg-white/15" aria-hidden="true" />
          <img
            src="/images/nmamit-logo-light.png"
            alt="NMAM Institute of Technology"
            className="h-5 sm:h-6 w-auto object-contain"
          />
        </div>
      </div>
    </main>
  );
}

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

      {/* Main Content Group (Logo + Input positioned together) */}
      <div className="relative z-10 w-full flex flex-col items-center mt-2 sm:mt-6">
        
        {/* Squid Game Logo (Standalone, no background card) */}
        <img 
          src="/images/squid-game-logo.png" 
          alt="Squid Game" 
          className="w-[280px] sm:w-[440px] h-auto object-contain drop-shadow-2xl"
        />

        {/* Middle: Single Cohesive UI Component */}
        <div className="w-full max-w-lg px-2 sm:px-6 mt-6 sm:mt-8">
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
          <p id="team-name-error" className="mt-4 text-center text-xs font-mono text-rose-400 tracking-wide" role="alert">
            {error}
          </p>
        )}
        </div>
      </div>

      {/* Bottom: Partner Branding with Light Cards */}
      <div className="relative z-10 w-full flex items-center justify-center gap-4 sm:gap-6 mt-auto pt-8 pb-safe mb-6 sm:mb-10">
        <div className="bg-zinc-50 rounded-xl p-2.5 sm:p-3 border border-zinc-200/80 shadow-lg flex items-center justify-center">
          <img 
            src="/images/wikiclub-logo.png" 
            alt="WikiClub" 
            className="w-20 sm:w-[88px] h-auto object-contain"
          />
        </div>
        <div className="bg-zinc-50 rounded-xl p-2.5 sm:p-3 border border-zinc-200/80 shadow-lg flex items-center justify-center">
          <img 
            src="/images/nmamit-logo.png" 
            alt="NMAMIT" 
            className="w-28 sm:w-[124px] h-auto object-contain"
          />
        </div>
      </div>
    </main>
  );
}

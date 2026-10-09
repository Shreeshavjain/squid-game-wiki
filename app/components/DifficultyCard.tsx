'use client';

import React, { useState, useReducer, useRef, useEffect } from 'react';
import { DifficultyTier } from '../types/difficulty';
import { GeometricIcon } from './GeometricIcon';

interface DifficultyCardProps {
  tier: DifficultyTier;
  isLocked: boolean;
  isCurrentLockedTier: boolean;
  onInitiateSelection: (tier: DifficultyTier) => void;
  /** Parent-controlled expanded state (mobile/touch toggle via page.tsx) */
  isForceExpanded?: boolean;
  onToggleExpand?: () => void;
}

/** Per-tier accent palette – kept together so it's easy to update */
const TIER_ACCENTS = {
  easy: {
    topBar: 'bg-blue-400',
    topBarOpacity: 'opacity-55',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-400',
    badgeBg: 'bg-blue-950/20',
    iconActiveColor: 'text-blue-300',
    glowColor: 'rgba(59,130,246,0.28)',
    borderActive: 'border-blue-500/50 shadow-[0_0_28px_rgba(59,130,246,0.18)]',
  },
  medium: {
    topBar: 'bg-amber-400',
    topBarOpacity: 'opacity-65',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
    badgeBg: 'bg-amber-950/20',
    iconActiveColor: 'text-amber-300',
    glowColor: 'rgba(245,158,11,0.28)',
    borderActive: 'border-amber-500/50 shadow-[0_0_28px_rgba(245,158,11,0.14)]',
  },
  hard: {
    topBar: 'bg-rose-500',
    topBarOpacity: 'opacity-90',
    badgeBorder: 'border-rose-500/50',
    badgeText: 'text-rose-400',
    badgeBg: 'bg-rose-950/20',
    iconActiveColor: 'text-rose-400',
    glowColor: 'rgba(225,29,72,0.35)',
    borderActive:
      'border-rose-500/70 shadow-[0_0_32px_rgba(225,29,72,0.28)] ring-1 ring-rose-500/30',
  },
} as const;

export function DifficultyCard({
  tier,
  isLocked,
  isCurrentLockedTier,
  onInitiateSelection,
  isForceExpanded = false,
  onToggleExpand,
}: DifficultyCardProps) {
  const accents = TIER_ACCENTS[tier.id];

  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localOpen, toggleLocal] = useReducer((s: boolean) => !s, false);
  
  // Rules drawer expands if forced, toggled, hovered, or focused
  const isRulesOpen = isForceExpanded || localOpen || isHovered || isFocused;

  // Respect prefers-reduced-motion for the drawer transition
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      toggleLocal();
    }
  };

  // ── Border state ──────────────────────────────────────────────
  const borderClass = isCurrentLockedTier
    ? 'border-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.38)] ring-1 ring-rose-500/50'
    : isLocked
    ? 'border-zinc-800/30 opacity-45 grayscale'
    : `border-zinc-800/70 hover:${accents.borderActive}`;

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        // Only clear focus if focus moved outside the card
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
      className={[
        // Layout: flex-col for natural height growth
        'relative flex flex-col rounded-xl',
        'bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-[#09090d]',
        'border p-6 sm:p-7',
        // Transition border & shadow
        'transition-[border-color,box-shadow,opacity,filter] duration-300',
        borderClass,
      ].join(' ')}
      aria-label={`${tier.title} difficulty card`}
    >
      {/* ── Thin top accent bar (colour-coded per tier) ── */}
      <div
        className={`absolute top-0 left-6 right-6 h-[2px] rounded-b-sm ${accents.topBar} ${accents.topBarOpacity}`}
        aria-hidden="true"
      />

      {/* ════════════════════════════════
          UPPER CONTENT  (grows to fill)
          ════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Telemetry row: code + guard role | risk badge */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
            <span className="font-semibold text-zinc-300">[{tier.code}]</span>
            <span className="text-zinc-700">•</span>
            <span>{tier.guardRole}</span>
          </div>
          <span
            className={`font-mono text-[10px] tracking-widest font-semibold px-2 py-0.5 rounded border
              ${accents.badgeBorder} ${accents.badgeText} ${accents.badgeBg}`}
          >
            {tier.riskLevel}
          </span>
        </div>

        {/* ── Geometric insignia ── */}
        <div className="py-6 flex flex-col items-center justify-center relative">
          {/* Per-tier ambient glow spot (purely decorative, aria-hidden) */}
          <div
            className="absolute w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: accents.glowColor, opacity: 0.55 }}
            aria-hidden="true"
          />

          <div
            className={[
              'w-[72px] h-[72px] rounded-full border bg-zinc-900/70 flex items-center justify-center',
              'transition-[border-color,transform] duration-300',
              `border-zinc-800 hover:border-zinc-600 hover:scale-105`,
            ].join(' ')}
          >
            <GeometricIcon
              symbol={tier.symbol}
              size={44}
              strokeWidth={3}
              className={`text-zinc-200 hover:${accents.iconActiveColor} transition-colors duration-300`}
              glow={tier.id === 'hard'}
            />
          </div>

          <div className="mt-2.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            INSIGNIA: {tier.symbol.toUpperCase()}
          </div>
        </div>

        {/* ── Title block ── */}
        <div className="mb-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-100 uppercase font-sans">
            {tier.title}
          </h2>
          <div className="font-mono text-[11px] text-rose-500/80 tracking-wider uppercase mt-1 leading-snug">
            {tier.subtitle}
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400 tracking-wide bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-1.5 rounded inline-block">
            {tier.riskDescriptor}
          </div>
        </div>

        {/* ── Stats grid (ALWAYS VISIBLE – no interaction required) ── */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 bg-zinc-950/80 rounded-lg border border-zinc-800/80 text-center mb-4 overflow-hidden">
          <div className="px-2 py-2.5">
            <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">TIME</div>
            <div className="font-mono text-[11px] font-bold text-zinc-200 mt-0.5">{tier.timeLimit}</div>
          </div>
          <div className="px-2 py-2.5">
            <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">BOUNTY</div>
            <div className={`font-mono text-[11px] font-bold mt-0.5 ${accents.badgeText}`}>
              {tier.bountyMultiplier}
            </div>
          </div>
          <div className="px-2 py-2.5">
            <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">SURVIVAL</div>
            <div className="font-mono text-[11px] font-bold text-zinc-200 mt-0.5">
              {tier.survivalRate.replace('EST. SURVIVAL ', '')}
            </div>
          </div>
        </div>

        {/* ── Overview text ── */}
        <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
          {tier.overview}
        </p>

        {/* ── Expandable rules drawer ── */}
        <div className="border-t border-zinc-800/60 pt-3">
          {/* Toggle button – the single expansion trigger (click + keyboard) */}
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isRulesOpen}
            aria-controls={`rules-${tier.id}`}
            className={[
              'w-full flex items-center justify-between py-1.5 text-left cursor-pointer',
              'font-mono text-[11px] tracking-wider uppercase',
              'text-zinc-300 hover:text-zinc-100 transition-colors duration-150',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 rounded-sm',
            ].join(' ')}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-rose-500 text-xs" aria-hidden="true">§</span>
              <span>PROTOCOL RULES &amp; PENALTIES</span>
            </span>
            <span
              className="text-zinc-500 text-[10px] font-mono ml-2 shrink-0 select-none"
              aria-hidden="true"
            >
              {isRulesOpen ? '▲ HIDE' : '▼ EXPAND'}
            </span>
          </button>

          {/*
            CSS-grid height animation: grid-template-rows 0fr → 1fr
            Completely layout-stable: the card height changes only within
            its own column; neighbouring cards are unaffected because the
            grid uses `items-stretch` (set in page.tsx).
            With prefers-reduced-motion the transition is instant (duration-0).
          */}
          <div
            id={`rules-${tier.id}`}
            className={[
              'grid',
              prefersReducedMotion.current
                ? 'transition-none'
                : 'transition-[grid-template-rows,opacity] duration-300 ease-out',
              isRulesOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0',
            ].join(' ')}
          >
            <div className="overflow-hidden space-y-2.5">
              {/* Rules list */}
              <div className="space-y-2 bg-zinc-950/70 p-3 rounded border border-zinc-800/80">
                {tier.rules.map((rule, idx) => (
                  <div key={rule.id}>
                    <div className="flex items-baseline gap-1.5 font-mono text-[11px] text-zinc-200 font-semibold">
                      <span className="text-rose-500 text-[10px]">[{idx + 1}]</span>
                      <span>{rule.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug pl-[18px]">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Penalty notice */}
              <div className="px-3 py-2 rounded bg-rose-950/20 border border-rose-900/40 font-mono text-[11px] text-rose-300 leading-snug">
                <span className="font-bold text-rose-400 mr-1.5">PENALTY:</span>
                {tier.penaltyNotice}
              </div>

              {/* Target audience */}
              <div className="font-mono text-[10px] text-zinc-500 tracking-wide uppercase">
                {tier.targetAudience}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          ACTION BUTTON  (pinned to bottom)
          ════════════════════════════════ */}
      <div className="mt-5 pt-4 border-t border-zinc-800/70">
        {isCurrentLockedTier ? (
          <div
            className="w-full py-3 px-4 rounded font-mono text-xs uppercase tracking-widest font-bold text-center
              bg-rose-950/60 border border-rose-500 text-rose-200 shadow-[0_0_16px_rgba(225,29,72,0.3)]"
          >
            ✓ SQUAD REGISTERED HERE
          </div>
        ) : isLocked ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full py-3 px-4 rounded font-mono text-xs uppercase tracking-widest
              text-zinc-600 bg-zinc-900/40 border border-zinc-800/40 cursor-not-allowed"
          >
            SECTOR LOCKED
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onInitiateSelection(tier)}
            aria-label={`Select ${tier.title} difficulty — opens confirmation dialog`}
            className={[
              'w-full py-3 px-4 rounded font-mono text-xs uppercase tracking-widest font-bold cursor-pointer',
              'text-zinc-200 bg-zinc-900 border border-zinc-700',
              'hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_22px_rgba(225,29,72,0.42)]',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
            ].join(' ')}
          >
            SELECT {tier.title}
          </button>
        )}
      </div>
    </article>
  );
}

'use client';

import React from 'react';
import { DifficultyTier } from '../types/difficulty';
import { GeometricIcon } from './GeometricIcon';

interface DifficultyCardProps {
  tier: DifficultyTier;
  isLocked: boolean;
  isCurrentLockedTier: boolean;
  onInitiateSelection: (tier: DifficultyTier) => void;
}

/**
 * Per-tier accent palette – kept together so it's easy to update.
 * Every class is written out in full so Tailwind can detect it at build time
 * (template-built class names like `hover:${x}` are never generated).
 */
const TIER_ACCENTS = {
  easy: {
    topBar: 'from-emerald-400/0 via-emerald-400 to-emerald-400/0',
    text: 'text-emerald-400',
    badge: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
    iconRing: 'border-emerald-400/30 group-hover:border-emerald-400/70',
    iconHover: 'group-hover:text-emerald-300',
    glow: 'rgba(16,185,129,0.35)',
    meter: 'bg-emerald-400',
    card: 'border-emerald-400/15 hover:border-emerald-400/50 hover:shadow-[0_0_44px_rgba(16,185,129,0.18)]',
  },
  medium: {
    topBar: 'from-amber-400/0 via-amber-400 to-amber-400/0',
    text: 'text-amber-400',
    badge: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
    iconRing: 'border-amber-400/30 group-hover:border-amber-400/70',
    iconHover: 'group-hover:text-amber-300',
    glow: 'rgba(245,158,11,0.35)',
    meter: 'bg-amber-400',
    card: 'border-amber-400/15 hover:border-amber-400/50 hover:shadow-[0_0_44px_rgba(245,158,11,0.16)]',
  },
  hard: {
    topBar: 'from-rose-500/0 via-rose-500 to-rose-500/0',
    text: 'text-rose-400',
    badge: 'border-rose-500/50 text-rose-300 bg-rose-950/40',
    iconRing: 'border-rose-500/40 group-hover:border-rose-500/80',
    iconHover: 'group-hover:text-rose-400',
    glow: 'rgba(225,29,72,0.45)',
    meter: 'bg-rose-500',
    card: 'border-rose-500/25 hover:border-rose-500/60 hover:shadow-[0_0_48px_rgba(225,29,72,0.26)]',
  },
} as const;

export function DifficultyCard({
  tier,
  isLocked,
  isCurrentLockedTier,
  onInitiateSelection,
}: DifficultyCardProps) {
  const accents = TIER_ACCENTS[tier.id];

  // "1.75× BASE POOL" -> value "1.75×", caption "BASE POOL"
  const [bountyValue, ...bountyCaption] = tier.bountyMultiplier.split(' ');
  // "EST. SURVIVAL 49%" -> 49
  const survivalPercent = Number(tier.survivalRate.match(/(\d+)%/)?.[1] ?? 0);

  // ── Card state ────────────────────────────────────────────────
  const stateClass = isCurrentLockedTier
    ? 'border-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.38)] ring-1 ring-rose-500/50'
    : isLocked
    ? 'border-zinc-800/40 opacity-45 grayscale'
    : `${accents.card} hover:-translate-y-1`;

  return (
    <article
      className={[
        'group relative flex flex-col h-full overflow-hidden rounded-2xl',
        'border p-5 sm:p-6',
        'transition-[border-color,box-shadow,opacity,filter,transform] duration-300',
        stateClass,
      ].join(' ')}
      style={{
        /* Smoked glass: translucent charcoal with backdrop blur */
        backgroundColor: 'rgba(12, 12, 18, 0.72)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
      }}
      aria-label={`${tier.title} difficulty card`}
    >
      {/* ── Top accent bar (colour-coded per tier) ── */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${accents.topBar}`}
        aria-hidden="true"
      />

      {/* ── Oversized insignia watermark ── */}
      <div
        className="absolute -top-10 -right-10 text-zinc-100 opacity-[0.04] pointer-events-none"
        aria-hidden="true"
      >
        <GeometricIcon symbol={tier.symbol} size={190} strokeWidth={2} className="" />
      </div>

      {/* Telemetry row: game code | risk badge */}
      <div className="relative flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold tracking-widest text-zinc-300 whitespace-nowrap">
          {tier.code}
        </span>
        <span
          className={`font-mono text-[10px] tracking-widest font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${accents.badge}`}
        >
          {tier.riskLevel}
        </span>
      </div>

      {/* ── Geometric insignia ── */}
      <div className="relative py-4 flex flex-col items-center">
        <div
          className="absolute top-4 w-16 h-16 rounded-full blur-2xl pointer-events-none"
          style={{ background: accents.glow }}
          aria-hidden="true"
        />
        <div
          className={[
            'relative w-16 h-16 rounded-full border-2 bg-zinc-950/60 flex items-center justify-center',
            'transition-[border-color,transform] duration-300 group-hover:scale-105',
            accents.iconRing,
          ].join(' ')}
        >
          <GeometricIcon
            symbol={tier.symbol}
            size={34}
            strokeWidth={3}
            className={`text-zinc-100 transition-colors duration-300 ${accents.iconHover}`}
            glow={tier.id === 'hard'}
          />
        </div>
        <div className="mt-2 font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
          {tier.guardRole}
        </div>
      </div>

      {/* ── Title block ── */}
      <div className="relative text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-50 uppercase leading-none">
          {tier.title}
        </h2>
        <div className={`mt-1.5 font-mono text-[11px] tracking-widest uppercase ${accents.text}`}>
          {tier.subtitle}
        </div>
        <div className="mt-1.5 inline-block font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
          {tier.riskDescriptor}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="relative mt-4 rounded-xl border border-zinc-700/30 bg-zinc-950/50 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-zinc-700/30 text-center">
          {tier.scoring ? (
            <>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Correct answer</div>
                <div className="mt-1 text-lg font-bold text-emerald-400 tabular-nums">+{tier.scoring.correct}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Wrong answer</div>
                {/* Always shown as a deduction, so a zero penalty reads "-0" */}
                <div className="mt-1 text-lg font-bold text-rose-500 tabular-nums">-{Math.abs(tier.scoring.wrong)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Time</div>
                <div className="mt-1 text-lg font-bold text-zinc-100 tabular-nums">{tier.timeLimit}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Bounty</div>
                <div className={`mt-1 text-lg font-bold tabular-nums ${accents.text}`}>
                  {bountyValue}
                  <span className="ml-1.5 font-mono text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    {bountyCaption.join(' ')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="border-t border-zinc-700/30 px-4 py-2.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
            <span className="text-zinc-500">Est. survival</span>
            <span className="font-bold text-zinc-200 tabular-nums">{survivalPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className={`h-full rounded-full ${accents.meter}`}
              style={{ width: `${survivalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Overview text ── */}
      <p className="relative mt-4 text-[13px] text-zinc-400 leading-relaxed">
        {tier.overview}
      </p>

      {/* ── Action button (pinned to bottom so buttons align across cards) ── */}
      <div className="relative mt-auto pt-4">
        <div className="border-t border-zinc-800/80 pt-4">
          {isCurrentLockedTier ? (
            <div
              className="w-full py-3 px-4 rounded-full font-mono text-xs uppercase tracking-widest font-bold text-center
                bg-rose-950/60 border border-rose-500 text-rose-200 shadow-[0_0_16px_rgba(225,29,72,0.3)]"
            >
              ✓ Squad registered here
            </div>
          ) : isLocked ? (
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 rounded-full font-mono text-xs uppercase tracking-widest
                text-zinc-600 bg-zinc-900/40 border border-zinc-800/40 cursor-not-allowed"
            >
              Sector locked
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onInitiateSelection(tier)}
              aria-label={`Select ${tier.title} difficulty — opens confirmation dialog`}
              className={[
                'w-full py-3 px-4 rounded-full font-mono text-xs uppercase tracking-widest font-bold cursor-pointer',
                'text-zinc-100 bg-zinc-900/60 border border-zinc-600/40',
                'group-hover:border-rose-500/60',
                'hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_22px_rgba(225,29,72,0.45)]',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              ].join(' ')}
            >
              Select {tier.title}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

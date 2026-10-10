'use client';

import React, { useEffect, useRef } from 'react';
import { DifficultyTier, TeamSessionInfo } from '../types/difficulty';
import { GeometricIcon } from './GeometricIcon';

interface ConfirmationModalProps {
  tier: DifficultyTier | null;
  session: TeamSessionInfo;
  isOpen: boolean;
  onCancel: () => void;
  onConfirmLock: (tier: DifficultyTier) => void;
}

/**
 * ConfirmationModal
 * ─────────────────
 * Opens when a difficulty card is clicked. The choice is NOT locked until
 * the participant explicitly presses "Lock My Choice".
 *
 * Accessibility:
 *   • role="dialog" + aria-modal="true"
 *   • Focus is trapped inside while open (Tab / Shift-Tab cycle)
 *   • Focus lands on the cancel button (safer default for irreversible actions)
 *   • Escape key closes the modal and restores prior focus
 *   • Overlay click also cancels
 *
 * Prototype note:
 *   Lock is persisted in local React state only. Wire onConfirmLock to a
 *   server action / API mutation before production to enforce persistence.
 */
export function ConfirmationModal({
  tier,
  session,
  isOpen,
  onCancel,
  onConfirmLock,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ── Focus management & keyboard trap ────────────────────────────
  useEffect(() => {
    if (!isOpen || !tier) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    // Give the DOM one frame to mount, then focus the cancel button
    // (safer UX for irreversible actions – user must navigate to confirm)
    const raf = requestAnimationFrame(() => {
      cancelBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.closest('[aria-hidden="true"]'));

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, tier, onCancel]);

  if (!isOpen || !tier) return null;

  const accentLabel = {
    easy: 'text-emerald-400',
    medium: 'text-amber-400',
    hard: 'text-rose-400',
  }[tier.id];

  return (
    /*
      Outer wrapper – provides the scrim.
      Separate from the scrollable content wrapper so the scrim
      covers the whole viewport regardless of scroll position.
    */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      {/* Scrim – click to cancel */}
      <div
        className="absolute inset-0 bg-black/88 backdrop-blur-[6px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* ── Modal panel ── */}
      <div
        ref={modalRef}
        className={[
          'relative z-10 w-full max-w-[540px] max-h-[90dvh] overflow-y-auto',
          'rounded-xl bg-[#0b0b10] border-2 border-zinc-700/60',
          'shadow-[0_0_60px_rgba(0,0,0,0.7),0_0_40px_rgba(225,29,72,0.18)]',
          'p-6 sm:p-8',
          // Entrance animation (disabled for prefers-reduced-motion via CSS)
          'motion-safe:animate-[modal-in_220ms_ease-out_both]',
        ].join(' ')}
        // Prevent scroll-through on iOS
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Hazard stripe – top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
          style={{
            background:
              'linear-gradient(90deg, rgba(225,29,72,0.9) 0%, rgba(251,191,36,0.7) 50%, rgba(225,29,72,0.9) 100%)',
          }}
          aria-hidden="true"
        />

        {/* ── Header row ── */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"
              aria-hidden="true"
            />
            <span className="font-mono text-xs tracking-widest text-rose-500 uppercase font-bold">
              SECURITY CONFIRMATION REQUIRED
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className={[
              'font-mono text-[11px] px-2.5 py-1 rounded border border-zinc-700',
              'text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition cursor-pointer',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500',
            ].join(' ')}
            aria-label="Close confirmation dialog"
          >
            [ESC]
          </button>
        </div>

        {/* ── Selected tier summary ── */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800/90 mb-5">
          <div
            className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-rose-500 shrink-0"
            style={{ boxShadow: '0 0 14px rgba(225,29,72,0.22)' }}
          >
            <GeometricIcon symbol={tier.symbol} size={38} strokeWidth={3} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs text-zinc-400">{tier.code}</span>
              <span className="text-zinc-700 text-xs">•</span>
              <span className={`font-mono text-xs font-bold uppercase ${accentLabel}`}>
                {tier.riskLevel}
              </span>
            </div>
            <h3
              id="confirm-modal-title"
              className="text-2xl font-black text-zinc-100 uppercase tracking-tight font-sans leading-none"
            >
              {tier.title} PROTOCOL
            </h3>
            {tier.scoring && (
              <div className="font-mono text-[11px] text-zinc-400 mt-1">
                Correct:{' '}
                <span className="font-bold text-emerald-400">+{tier.scoring.correct}</span>
                &nbsp;·&nbsp;Wrong:{' '}
                <span className="font-bold text-rose-500">-{Math.abs(tier.scoring.wrong)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Squad context ── */}
        <div className="font-mono text-xs bg-zinc-900/60 p-3 rounded border border-zinc-800 mb-4 space-y-0.5">
          <div className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1.5">
            SQUAD ASSIGNMENT CONTEXT
          </div>
          <div className="text-zinc-400">
            Squad:{' '}
            <span className="text-zinc-100 font-bold">
              {session.teamId} — {session.teamName}
            </span>
          </div>
          <div className="text-zinc-400">
            Bracket: <span className="text-zinc-100">{session.sessionCode}</span>
          </div>
        </div>

        {/* ── Tier-specific confirmation message ── */}
        <div
          id="confirm-modal-desc"
          className="rounded-lg bg-rose-950/25 border border-rose-900/50 p-4 mb-5"
        >
          <div className="flex items-start gap-3">
            <span className="text-rose-500 text-base shrink-0 mt-px" aria-hidden="true">⚠</span>
            <div>
              <p className="text-sm text-zinc-300 leading-relaxed">{tier.confirmMessage}</p>
              <p className={`mt-3 text-sm font-bold ${accentLabel}`}>{tier.confirmQuestion}</p>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className={[
              'w-full sm:w-auto px-5 py-2.5 rounded cursor-pointer',
              'font-mono text-xs uppercase tracking-widest text-zinc-300',
              'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
            ].join(' ')}
          >
            ← GO BACK / RECONSIDER
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onConfirmLock(tier)}
            className={[
              'w-full sm:w-auto px-6 py-2.5 rounded cursor-pointer',
              'font-mono text-xs uppercase tracking-widest font-black text-white',
              'bg-rose-600 hover:bg-rose-500 border border-rose-500 hover:border-rose-400',
              'shadow-[0_0_22px_rgba(225,29,72,0.45)]',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b10]',
            ].join(' ')}
          >
            LOCK MY CHOICE 🔒
          </button>
        </div>

        {/* ── Prototype footnote ── */}
        <div className="mt-4 pt-3 border-t border-zinc-900 text-center">
          <p className="font-mono text-[9px] text-zinc-600 tracking-wider">
            [PROTOTYPE] Lock is local React state. Production requires an authenticated
            server-side API call to persist and enforce this choice.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { GeometricIcon } from './GeometricIcon';
import { GeometricSymbol } from '../types/difficulty';

/**
 * ARENA BACKGROUND
 * ================
 * Fixed full-viewport animated scene built from Squid Game's visual language.
 *
 * Layers (bottom-to-top):
 *   1. Obsidian base with drifting guard-pink and tracksuit-teal glows
 *   2. Business-card ○ △ □ tile pattern, faded towards the edges
 *   3. Giant outlined "456" player number watermark
 *   4. Floating ○ △ □ guard insignia rising through the frame
 *   5. "Red Light, Green Light" motion-scanner beam sweeping top to bottom
 *   6. Vignette + film grain
 *   7. Corner telemetry labels
 *
 * All motion is CSS keyframes (see globals.css) and is disabled by the
 * global prefers-reduced-motion rule.
 */

type FloatingShape = {
  symbol: GeometricSymbol;
  left: string;
  size: number;
  duration: number;
  delay: number;
  tone: 'pink' | 'teal';
};

// Fixed values (no Math.random) so server and client render identically
const FLOATING_SHAPES: readonly FloatingShape[] = [
  { symbol: 'circle',   left: '4%',  size: 46, duration: 26, delay: -2,  tone: 'pink' },
  { symbol: 'triangle', left: '12%', size: 30, duration: 32, delay: -18, tone: 'teal' },
  { symbol: 'square',   left: '21%', size: 58, duration: 38, delay: -9,  tone: 'pink' },
  { symbol: 'circle',   left: '29%', size: 24, duration: 24, delay: -14, tone: 'teal' },
  { symbol: 'triangle', left: '38%', size: 40, duration: 34, delay: -27, tone: 'pink' },
  { symbol: 'square',   left: '47%', size: 28, duration: 28, delay: -5,  tone: 'teal' },
  { symbol: 'circle',   left: '55%', size: 64, duration: 40, delay: -21, tone: 'pink' },
  { symbol: 'triangle', left: '63%', size: 26, duration: 25, delay: -11, tone: 'teal' },
  { symbol: 'square',   left: '71%', size: 44, duration: 33, delay: -30, tone: 'pink' },
  { symbol: 'circle',   left: '79%', size: 32, duration: 29, delay: -7,  tone: 'teal' },
  { symbol: 'triangle', left: '87%', size: 54, duration: 37, delay: -16, tone: 'pink' },
  { symbol: 'square',   left: '94%', size: 22, duration: 23, delay: -3,  tone: 'teal' },
];

const TONE_CLASS = {
  pink: 'text-[#ff2e88]',
  teal: 'text-[#1fb8a6]',
} as const;

export function ArenaBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{ backgroundColor: '#07070a' }}
    >
      {/* ── 1. Drifting colour glows (guard pink + tracksuit teal) ── */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl animate-[arena-drift_22s_ease-in-out_infinite_alternate]"
        style={{ background: 'radial-gradient(circle, rgba(255,46,136,0.22) 0%, transparent 65%)' }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl animate-[arena-drift_26s_ease-in-out_infinite_alternate-reverse]"
        style={{ background: 'radial-gradient(circle, rgba(31,184,166,0.18) 0%, transparent 65%)' }}
      />

      {/* ── 2. Business-card ○ △ □ tile pattern ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: 0.035,
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 20%, transparent 80%)',
        }}
      >
        <defs>
          <pattern id="arena-tiles" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#f4f4f5" strokeWidth="1.5">
              <circle cx="20" cy="20" r="9" />
              <polygon points="60,11 70,29 50,29" />
              <rect x="91" y="11" width="18" height="18" />
              <circle cx="80" cy="80" r="9" />
              <polygon points="20,71 30,89 10,89" />
              <rect x="51" y="71" width="18" height="18" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arena-tiles)" />
      </svg>

      {/* ── 3. Player 456 watermark ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black leading-none tracking-tighter"
        style={{
          fontSize: 'min(48vw, 640px)',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(255,46,136,0.13)',
        }}
      >
        456
      </div>

      {/* ── 4. Floating guard insignia ── */}
      {FLOATING_SHAPES.map((shape, i) => (
        <div
          key={i}
          className="absolute top-0 animate-[arena-rise_linear_infinite]"
          style={{
            left: shape.left,
            animationDuration: `${shape.duration}s`,
            animationDelay: `${shape.delay}s`,
            opacity: 0.22,
          }}
        >
          <GeometricIcon
            symbol={shape.symbol}
            size={shape.size}
            strokeWidth={1.4}
            className={TONE_CLASS[shape.tone]}
          />
        </div>
      ))}

      {/* ── 5. Motion-scanner beam ("Red Light, Green Light") ── */}
      <div className="absolute inset-x-0 top-0 h-40 animate-[arena-scan_11s_ease-in-out_infinite]">
        <div
          className="absolute inset-x-0 bottom-0 h-full"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,46,136,0.07))' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255,46,136,0.55) 30%, rgba(255,46,136,0.55) 70%, transparent)',
            boxShadow: '0 0 18px 2px rgba(255,46,136,0.35)',
          }}
        />
      </div>

      {/* ── 6. Vignette + film grain ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 90% at 50% 40%, transparent 45%, rgba(4,4,6,0.85) 100%)',
        }}
      />
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035, mixBlendMode: 'overlay' }}>
        <filter id="arena-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#arena-grain)" />
      </svg>

      {/* ── 7. Corner telemetry labels ── */}
      <div className="hidden sm:block absolute bottom-16 left-5 font-mono text-[9px] tracking-widest text-zinc-600 uppercase leading-tight">
        <span className="text-rose-500/70 mr-1.5 animate-pulse">●</span>
        CAM-01 // REC
      </div>
      <div className="hidden sm:block absolute bottom-16 right-5 font-mono text-[9px] tracking-widest text-zinc-600 uppercase text-right leading-tight">
        PLAYERS REMAINING: 456
      </div>
    </div>
  );
}

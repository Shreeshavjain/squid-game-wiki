import React from 'react';

/**
 * ARENA BACKGROUND
 * ================
 * Uses a fixed full-viewport image of the Squid Game staircase architecture.
 *
 * Layers (bottom-to-top):
 *   1. Photographic Background Layer: The staircase image with cover sizing and a slight blur.
 *   2. Cinematic Black Gradient Overlay: Dims the bright pastel colors to maintain text readability.
 *   3. Film-grain noise overlay: Preserves the gritty cinematic feel.
 *   4. Corner tactical telemetry labels.
 */
export function ArenaBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{ backgroundColor: '#07070a' }}
    >
      {/* ── 1. The Photographic Background Layer ── */}
      {/* 
        We use a separate div for the background image so we can apply the blur filter 
        to it without blurring the overlays or text. 
      */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/images/squid-staircase.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // 2px blur softens the background; scale 1.02 prevents blurred transparent edges from showing
          filter: 'blur(2px)',
          transform: 'scale(1.02)',
        }}
      />

      {/* ── 2. Cinematic Black Gradient Overlay ── */}
      {/* 
        Starts at ~65% opacity at the top to reduce overall brightness,
        and darkens towards the bottom to ensure the cards and footer remain highly readable.
      */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.75) 50%, rgba(7,7,10,0.95) 100%)',
        }}
      />

      {/* ── 3. Film-grain noise overlay ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.032, mixBlendMode: 'overlay' }}
        aria-hidden="true"
      >
        <filter id="arena-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#arena-grain)" />
      </svg>

      {/* ── 4. Corner telemetry labels ── */}
      <div className="absolute top-5 left-5 font-mono text-[9px] tracking-widest text-zinc-600 uppercase leading-tight">
        <span className="text-rose-500/70 mr-1.5">●</span>
        CAM-01 // COMPLEX 07
      </div>
      <div className="absolute top-5 right-5 font-mono text-[9px] tracking-widest text-zinc-600 uppercase text-right leading-tight">
        SECTOR PROTOCOL // VER 2.40
      </div>
      <div className="absolute bottom-5 left-5 font-mono text-[9px] tracking-widest text-zinc-700 uppercase leading-tight">
        SYS.LATENCY: 12ms // STABLE
      </div>
      <div className="absolute bottom-5 right-5 font-mono text-[9px] tracking-widest text-zinc-700 uppercase text-right leading-tight">
        COORD: 37°33&#x27;N 126°58&#x27;E
      </div>
    </div>
  );
}

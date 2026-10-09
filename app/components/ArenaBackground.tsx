import React from 'react';

/**
 * ARENA BACKGROUND
 * ================
 * Fixed full-viewport staircase photograph with a restrained cinematic overlay.
 *
 * Layers (bottom-to-top):
 *   1. Base obsidian fill (#07070a) – fallback while image loads
 *   2. Photographic staircase image – sharp, cover-sized, fixed
 *   3. Restrained dark gradient overlay – preserves image colour while
 *      protecting text contrast, darkening edges and bottom
 *   4. Film-grain noise overlay – subtle cinematic texture
 *   5. Corner tactical telemetry labels
 *
 * Design intent: The staircase's natural pastel colours (pink, teal, yellow)
 * should remain clearly recognizable. The overlay reduces brightness enough
 * for white text readability without burying the architecture in black.
 */
export function ArenaBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{ backgroundColor: '#07070a' }}
    >
      {/* ── 1. Photographic Background Layer ── */}
      {/*
        Sharp image with minimal processing.
        - 0px blur: keeps the architecture crisp and recognizable.
        - scale(1.01): tiny overscale prevents sub-pixel edge seams.
        - Slight brightness/saturation reduction via filter keeps pastel tones
          visible without competing with foreground UI.
      */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/images/squid-staircase.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.95) saturate(0.90)',
          transform: 'scale(1.01)',
        }}
      />

      {/* ── 2. Restrained Dark Gradient Overlay ── */}
      {/*
        Multi-stop gradient designed for readability without burying the image:
        - Top: light veil (0.35) so the staircase apex is visible
        - Middle: moderate (0.45) where the card area lives
        - Bottom: darker (0.72) to fade into the footer area
        
        TUNING: Increase the rgba alpha values to darken, decrease to reveal more image.
      */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: [
            'linear-gradient(to bottom,',
            'rgba(7,7,10,0.15) 0%,',
            'rgba(7,7,10,0.20) 25%,',
            'rgba(7,7,10,0.25) 50%,',
            'rgba(7,7,10,0.35) 75%,',
            'rgba(7,7,10,0.50) 100%)',
          ].join(' '),
        }}
      />

      {/* ── 3. Subtle edge contrast ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 60%, rgba(7,7,10,0.3) 100%)',
        }}
      />

      {/* ── 4. Film-grain noise overlay ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.028, mixBlendMode: 'overlay' }}
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

      {/* ── 5. Corner telemetry labels ── */}
      <div className="absolute top-5 left-5 font-mono text-[9px] tracking-widest text-zinc-500/80 uppercase leading-tight">
        <span className="text-rose-500/60 mr-1.5">●</span>
        CAM-01 // COMPLEX 07
      </div>
      <div className="absolute top-5 right-5 font-mono text-[9px] tracking-widest text-zinc-500/80 uppercase text-right leading-tight">
        SECTOR PROTOCOL // VER 2.40
      </div>
      <div className="absolute bottom-5 left-5 font-mono text-[9px] tracking-widest text-zinc-600/70 uppercase leading-tight">
        SYS.LATENCY: 12ms // STABLE
      </div>
      <div className="absolute bottom-5 right-5 font-mono text-[9px] tracking-widest text-zinc-600/70 uppercase text-right leading-tight">
        COORD: 37°33&#x27;N 126°58&#x27;E
      </div>
    </div>
  );
}

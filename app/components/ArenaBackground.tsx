import React from 'react';

/**
 * ARENA BACKGROUND
 * ================
 * Fully local, zero-network, GPU-composited background.
 *
 * Layers (bottom-to-top):
 *   1. Base obsidian fill (#07070a)
 *   2. Crimson overhead spotlight – radial from top-centre
 *   3. Two flanking crimson sconces – left and right edges
 *   4. Bottom-glow vignette – wraps the card area in warmth
 *   5. SVG architectural scene:
 *      – Perspective vanishing-point floor grid (isometric feel)
 *      – Escher-inspired ascending/descending staircase pair
 *      – Cantilever bridge silhouette
 *      – Wireframe series insignia (○ △ □) in extreme periphery
 *      – Vertical structural pillars
 *   6. Overall top-to-bottom darkness gradient (preserves text contrast)
 *   7. Fine film-grain noise overlay
 *   8. Corner tactical telemetry labels
 *
 * Reduced-motion: All layers are purely static CSS / SVG – zero JavaScript
 * animation, zero GIF, zero Lottie.  Safe for prefers-reduced-motion.
 */
export function ArenaBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
      style={{ backgroundColor: '#07070a' }}
    >
      {/* ── 2. Overhead crimson spotlight ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(225,29,72,0.22) 0%, transparent 72%)',
        }}
      />

      {/* ── 3a. Left-edge sconce ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 30% 60% at 0% 45%, rgba(225,29,72,0.09) 0%, transparent 70%)',
        }}
      />

      {/* ── 3b. Right-edge sconce ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 30% 60% at 100% 45%, rgba(225,29,72,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── 4. Bottom ambient warm wash (lifts card zone slightly) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 35% at 50% 100%, rgba(180,20,50,0.06) 0%, transparent 65%)',
        }}
      />

      {/* ── 5. Architectural SVG scene ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.38, mixBlendMode: 'screen' }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── Perspective floor grid ── */}
          <pattern
            id="floor-tile"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1,0.45) rotate(0)"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(255,255,255,0.025)"
              strokeWidth="1"
            />
          </pattern>

          {/* ── Thin ambient surveillance grid (full scene) ── */}
          <pattern
            id="surv-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.018)"
              strokeWidth="0.8"
            />
          </pattern>

          {/* ── Crimson to transparent staircase gradient ── */}
          <linearGradient id="stair-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(225,29,72,0.55)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.09)" />
            <stop offset="100%" stopColor="rgba(7,7,10,0.02)" />
          </linearGradient>

          {/* ── Bridge fill gradient ── */}
          <linearGradient id="bridge-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(225,29,72,0.05)" />
            <stop offset="100%" stopColor="rgba(7,7,10,0.5)" />
          </linearGradient>

          {/* ── Vertical pillar gradient ── */}
          <linearGradient id="pillar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(225,29,72,0.25)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(7,7,10,0)" />
          </linearGradient>

          {/* ── Radial crimson under the staircase apex ── */}
          <radialGradient id="apex-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(225,29,72,0.35)" />
            <stop offset="100%" stopColor="rgba(225,29,72,0)" />
          </radialGradient>
        </defs>

        {/* Global surveillance grid */}
        <rect width="100%" height="100%" fill="url(#surv-grid)" />

        {/* Perspective floor plane (lower third) */}
        <rect
          x="0"
          y="600"
          width="1600"
          height="300"
          fill="url(#floor-tile)"
          opacity="0.6"
        />

        {/* Apex glow – crimson halo behind staircase convergence point */}
        <ellipse
          cx="800"
          cy="115"
          rx="110"
          ry="60"
          fill="url(#apex-glow)"
          opacity="0.6"
        />

        {/* ── Staircase: ascending right arm ── */}
        <g stroke="url(#stair-grad)" strokeWidth="1.4" fill="none">
          {/* Main spine */}
          <path d="M 800 110 L 940 185 L 940 240 L 1080 315 L 1080 370 L 1210 440 L 1210 510" />
          {/* Individual step treads */}
          <path
            d="M 800 110
               L 830 126 L 830 138
               L 860 154 L 860 166
               L 890 182 L 890 194
               L 940 222"
            stroke="rgba(255,255,255,0.07)"
          />
          <path
            d="M 940 240
               L 970 256 L 970 268
               L 1000 284 L 1000 296
               L 1030 312 L 1030 324
               L 1080 352"
            stroke="rgba(255,255,255,0.07)"
          />
          <path
            d="M 1080 370
               L 1110 386 L 1110 398
               L 1140 414 L 1140 426
               L 1175 445 L 1175 457
               L 1210 475"
            stroke="rgba(255,255,255,0.07)"
          />
        </g>

        {/* ── Staircase: descending left arm ── */}
        <g stroke="url(#stair-grad)" strokeWidth="1.4" fill="none">
          <path d="M 800 110 L 660 185 L 660 240 L 520 315 L 520 370 L 390 440 L 390 510" />
          <path
            d="M 800 110
               L 770 126 L 770 138
               L 740 154 L 740 166
               L 710 182 L 710 194
               L 660 222"
            stroke="rgba(255,255,255,0.07)"
          />
          <path
            d="M 660 240
               L 630 256 L 630 268
               L 600 284 L 600 296
               L 570 312 L 570 324
               L 520 352"
            stroke="rgba(255,255,255,0.07)"
          />
          <path
            d="M 520 370
               L 490 386 L 490 398
               L 460 414 L 460 426
               L 425 445 L 425 457
               L 390 475"
            stroke="rgba(255,255,255,0.07)"
          />
        </g>

        {/* ── Cantilever bridge connecting the two arms ── */}
        <path
          d="M 390 510 L 580 595 L 800 530 L 1020 595 L 1210 510"
          stroke="rgba(225,29,72,0.28)"
          strokeWidth="1.2"
          fill="url(#bridge-grad)"
        />
        {/* Bridge shadow underside */}
        <path
          d="M 390 525 L 580 610 L 800 545 L 1020 610 L 1210 525"
          stroke="rgba(225,29,72,0.12)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* ── Vertical structural pillars ── */}
        <line x1="800" y1="110" x2="800" y2="900" stroke="url(#pillar-grad)" strokeWidth="1" />
        <line x1="390" y1="510" x2="390" y2="900" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
        <line x1="1210" y1="510" x2="1210" y2="900" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
        <line x1="660" y1="240" x2="660" y2="750" stroke="rgba(255,255,255,0.02)" strokeWidth="0.7" />
        <line x1="940" y1="240" x2="940" y2="750" stroke="rgba(255,255,255,0.02)" strokeWidth="0.7" />

        {/* ── Archway portal at the apex ── */}
        <rect
          x="762"
          y="178"
          width="76"
          height="50"
          rx="2"
          stroke="rgba(225,29,72,0.32)"
          strokeWidth="1"
          fill="none"
        />

        {/* ── Extreme-periphery insignia wireframes ── */}
        {/* Circle – upper left sky */}
        <circle cx="160" cy="130" r="52" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        {/* Triangle – lower right floor */}
        <polygon points="1400,750 1480,870 1320,870" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        {/* Square – lower left */}
        <rect x="80" y="720" width="90" height="90" stroke="rgba(255,255,255,0.022)" strokeWidth="1" />

        {/* ── Arena floor boundary dashed line ── */}
        <line
          x1="80"
          y1="860"
          x2="1520"
          y2="860"
          stroke="rgba(225,29,72,0.18)"
          strokeDasharray="10 14"
          strokeWidth="1"
        />
      </svg>

      {/* ── 6. Content-contrast gradient (text layer protection) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(7,7,10,0.30) 0%, rgba(7,7,10,0.65) 55%, rgba(7,7,10,0.92) 92%, #07070a 100%)',
        }}
      />

      {/* ── 7. Film-grain noise overlay ── */}
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

      {/* ── 8. Corner telemetry labels ── */}
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

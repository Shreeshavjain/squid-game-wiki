import React from 'react';
import { GeometricSymbol } from '../types/difficulty';

interface GeometricIconProps {
  symbol: GeometricSymbol;
  className?: string;
  size?: number;
  strokeWidth?: number;
  glow?: boolean;
}

export function GeometricIcon({
  symbol,
  className = 'w-12 h-12',
  size = 48,
  strokeWidth = 3,
  glow = false,
}: GeometricIconProps) {
  const glowFilter = glow ? 'drop-shadow-[0_0_12px_rgba(225,29,72,0.6)]' : '';

  switch (symbol) {
    case 'circle':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${glowFilter} ${className}`}
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="currentColor"
            strokeWidth={strokeWidth * 2.5}
            strokeLinecap="round"
          />
        </svg>
      );

    case 'triangle':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${glowFilter} ${className}`}
          aria-hidden="true"
        >
          <polygon
            points="50,15 88,82 12,82"
            stroke="currentColor"
            strokeWidth={strokeWidth * 2.5}
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'square':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${glowFilter} ${className}`}
          aria-hidden="true"
        >
          <rect
            x="15"
            y="15"
            width="70"
            height="70"
            rx="2"
            stroke="currentColor"
            strokeWidth={strokeWidth * 2.5}
          />
        </svg>
      );

    default:
      return null;
  }
}

'use client';

import React from 'react';

interface CertificateSealProps {
  verified: boolean;
  size?: number;
}

export const CertificateSeal: React.FC<CertificateSealProps> = ({ verified, size = 110 }) => {
  const goldColor = verified ? '#f59e0b' : '#ef4444';
  const glowColor = verified ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  const cyanColor = verified ? '#38bdf8' : '#fb7185';
  const emeraldColor = verified ? '#10b981' : '#f43f5e';

  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: `drop-shadow(0 0 16px ${glowColor})`,
      transition: 'all 0.4s ease',
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Radial Gradients */}
          <radialGradient id={`sealGlow-${verified ? 'v' : 't'}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={goldColor} stopOpacity="0.25" />
            <stop offset="70%" stopColor={emeraldColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <linearGradient id={`goldBorder-${verified ? 'v' : 't'}`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor={goldColor} />
            <stop offset="50%" stopColor={cyanColor} />
            <stop offset="100%" stopColor={emeraldColor} />
          </linearGradient>

          {/* Text Path Circle */}
          <path
            id={`textPathCircle-${verified ? 'v' : 't'}`}
            d="M 100, 100 m -72, 0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0"
          />
        </defs>

        {/* Outer Radiant Glow */}
        <circle cx="100" cy="100" r="92" fill={`url(#sealGlow-${verified ? 'v' : 't'})`} />

        {/* Outer Scalloped Gear / Sunburst */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke={`url(#goldBorder-${verified ? 'v' : 't'})`}
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />

        {/* Circular Ribbons / Rings */}
        <circle
          cx="100"
          cy="100"
          r="76"
          stroke={goldColor}
          strokeWidth="1.5"
          opacity="0.8"
        />
        <circle
          cx="100"
          cy="100"
          r="66"
          stroke={cyanColor}
          strokeWidth="1.2"
          opacity="0.7"
        />

        {/* Circular Text */}
        <text
          fill={verified ? '#fde68a' : '#fca5a5'}
          fontSize="9.5"
          fontWeight="800"
          letterSpacing="2.8"
          style={{ textTransform: 'uppercase' }}
        >
          <textPath
            href={`#textPathCircle-${verified ? 'v' : 't'}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {verified
              ? '• BRANDLEDGER • CERTIFIED AUTHENTIC •'
              : '• INTEGRITY BREACH • TAMPER DETECTED •'}
          </textPath>
        </text>

        {/* Inner Solid Badge */}
        <circle
          cx="100"
          cy="100"
          r="54"
          fill="#0a0f1d"
          stroke={`url(#goldBorder-${verified ? 'v' : 't'})`}
          strokeWidth="2"
        />

        {/* Shield Icon and Verification Mark */}
        {verified ? (
          <g transform="translate(76, 74)">
            {/* Shield Outline */}
            <path
              d="M24 4 L42 10 V24 C42 35 24 44 24 44 C24 44 6 35 6 24 V10 Z"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Checkmark */}
            <path
              d="M16 23 L22 29 L32 17"
              stroke="#fde68a"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          <g transform="translate(76, 74)">
            {/* Warning Shield */}
            <path
              d="M24 4 L42 10 V24 C42 35 24 44 24 44 C24 44 6 35 6 24 V10 Z"
              fill="rgba(244, 63, 94, 0.25)"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Exclamation */}
            <path
              d="M24 16 V27 M24 33 H24.02"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Security Stamp Subtext */}
        <text
          x="100"
          y="142"
          textAnchor="middle"
          fill={verified ? '#34d399' : '#f87171'}
          fontSize="7"
          fontWeight="800"
          letterSpacing="1"
        >
          {verified ? 'SHA-256 OK' : 'MISMATCH'}
        </text>
      </svg>
    </div>
  );
};

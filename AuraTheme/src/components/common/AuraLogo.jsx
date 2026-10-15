import React from 'react';

/**
 * Aura "AS" Interlocking Monogram Logo
 * Premium high-fidelity geometric brand mark:
 * - Geometric "A" apex in radiant sunset orange gradient (#ff6b00 -> #f97316 -> #ea580c)
 * - Interlocking dynamic "S" ribbon in electric sapphire & cyan (#38bdf8 -> #3b82f6 -> #1d4ed8)
 * - Ambient specular glow & balanced micro-geometry for crisp display at all resolutions.
 */
export default function AuraLogo({
  size = 36,
  showText = true,
  textColor = 'inherit',
  subtitle = 'SUPPLY',
  className = '',
  style = {},
}) {
  const height = size;
  const width = size;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', ...style }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 3px 10px rgba(249, 115, 22, 0.28))' }}
      >
        <defs>
          {/* Sunset Radiant Orange */}
          <linearGradient id="auraOrangeGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ff7a00" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Electric Sapphire & Cyan for High Contrast in both Dark & Light UI */}
          <linearGradient id="auraBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Interlocking Ribbon Blend */}
          <linearGradient id="auraBlendGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="55%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          {/* Subtle Inner Glow Filter */}
          <radialGradient id="auraAuraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow Backdrop */}
        <circle cx="60" cy="60" r="54" fill="url(#auraAuraGlow)" />

        {/* Left Strut / Foundation of "A" in Sapphire Blue with Geometric Chamfer */}
        <path
          d="M22 96 L48 28 C51 20 57 16 64 16 L70 16 L56 46 L44 72 L70 72 L64 85 L32 85 L22 96 Z"
          fill="url(#auraBlueGrad)"
        />

        {/* Apex & Right Descending Arm of "A" in Radiant Sunset Orange */}
        <path
          d="M58 20 C61 15 67 15 70 20 L96 74 C98 78 96 84 91 86 L80 90 L60 42 L58 20 Z"
          fill="url(#auraOrangeGrad)"
        />

        {/* Dynamic Interlocking "S" Ribbon - Upper Sweep */}
        <path
          d="M62 36 C74 26 90 28 98 38 C105 47 104 58 95 65 C88 70 78 72 68 74 C75 68 85 66 90 60 C94 54 93 46 87 41 C80 35 70 35 64 42 L62 36 Z"
          fill="url(#auraOrangeGrad)"
        />

        {/* Dynamic Interlocking "S" Ribbon - Lower Loop (Sapphire Blend) */}
        <path
          d="M68 74 C56 76 46 83 47 94 C48 104 59 110 74 110 C88 110 99 103 102 91 L90 85 C87 93 80 97 73 97 C66 97 61 94 61 88 C61 83 67 79 76 76 L68 74 Z"
          fill="url(#auraBlendGrad)"
        />

        {/* Modern Accent Flare Core */}
        <circle cx="98" cy="94" r="3.5" fill="#f97316" />
        <circle cx="98" cy="94" r="1.5" fill="#ffffff" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: size * 0.52,
              letterSpacing: '-0.03em',
              color: textColor === 'inherit' ? '#0f172a' : textColor,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span>AURA</span>
            <span style={{ color: '#f97316' }}>.</span>
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: Math.max(9, size * 0.24),
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#f97316',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

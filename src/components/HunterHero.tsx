import React from "react";

// Original, license-safe "awakened hunter" hero illustration (pure SVG).
// Evokes the Solo Leveling tone (hooded figure, glowing eyes, purple aura)
// without copying any copyrighted artwork.
export function HunterHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 460" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="hhAura" cx="50%" cy="34%" r="55%">
          <stop offset="0%" stopColor="#9F7CE0" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#6E4FB0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1B1528" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hhBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2140" />
          <stop offset="100%" stopColor="#120D1F" />
        </linearGradient>
        <linearGradient id="hhHood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A2F58" />
          <stop offset="100%" stopColor="#1C1530" />
        </linearGradient>
        <radialGradient id="hhEye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#D9C9FF" />
          <stop offset="100%" stopColor="#8A5CF0" />
        </radialGradient>
        <filter id="hhBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="hhBlurSm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Aura */}
      <rect x="0" y="0" width="400" height="460" fill="url(#hhAura)" />

      {/* Faint summoning circle behind the figure */}
      <g opacity="0.18" stroke="#C9B8F0" fill="none" strokeWidth="1">
        <circle cx="200" cy="170" r="120" strokeDasharray="3 7" />
        <circle cx="200" cy="170" r="92" />
        <circle cx="200" cy="170" r="120">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 170"
            to="360 200 170"
            dur="40s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Body / cloak */}
      <path
        d="M70 460 C70 360 110 300 200 290 C290 300 330 360 330 460 Z"
        fill="url(#hhBody)"
      />
      {/* Shoulder cloak edges */}
      <path d="M120 460 C120 380 150 330 200 322 C250 330 280 380 280 460 Z" fill="#171022" opacity="0.7" />

      {/* Hood */}
      <path
        d="M200 70 C150 70 122 112 122 165 C122 205 140 235 160 250 C150 220 158 168 200 158 C242 168 250 220 240 250 C260 235 278 205 278 165 C278 112 250 70 200 70 Z"
        fill="url(#hhHood)"
      />
      {/* Hood inner shadow / face void */}
      <path
        d="M165 150 C165 120 180 104 200 104 C220 104 235 120 235 150 C235 188 220 214 200 214 C180 214 165 188 165 150 Z"
        fill="#0C0814"
      />

      {/* Glowing eyes */}
      <g>
        <ellipse cx="184" cy="158" rx="13" ry="6" fill="#8A5CF0" filter="url(#hhBlur)" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="216" cy="158" rx="13" ry="6" fill="#8A5CF0" filter="url(#hhBlur)" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.2s" repeatCount="indefinite" />
        </ellipse>
        <path d="M176 160 L192 154 L194 160 L178 164 Z" fill="url(#hhEye)" filter="url(#hhBlurSm)" />
        <path d="M224 160 L208 154 L206 160 L222 164 Z" fill="url(#hhEye)" filter="url(#hhBlurSm)" />
      </g>

      {/* Rising ember / mana particles */}
      <g fill="#C9B8F0">
        <circle cx="120" cy="320" r="2">
          <animate attributeName="cy" values="340;180" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="285" cy="300" r="1.6">
          <animate attributeName="cy" values="330;170" dur="5.2s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="5.2s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="300" r="1.3">
          <animate attributeName="cy" values="320;160" dur="6s" begin="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="6s" begin="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="330" r="1.8">
          <animate attributeName="cy" values="345;185" dur="5.6s" begin="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="5.6s" begin="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

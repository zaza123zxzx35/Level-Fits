import React from "react";
import { HunterRank } from "../utils/rankUtils";

interface RankBadgeProps {
  rank: HunterRank;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, className = "", size = "md" }: RankBadgeProps) {
  let strokeColor = "#9A8FB8";
  let glowColor = "rgba(154, 143, 184, 0.35)";
  let textColor = "#9A8FB8";
  let badgeTitle = "E-Rank";

  if (rank === "E") {
    strokeColor = "#9A8FB8";
    glowColor = "rgba(154, 143, 184, 0.3)";
    textColor = "#C7BBE2";
    badgeTitle = "E-Rank";
  } else if (rank === "D") {
    strokeColor = "#8A5CF0";
    glowColor = "rgba(138, 92, 240, 0.4)";
    textColor = "#C9B8F0";
    badgeTitle = "D-Rank";
  } else if (rank === "C") {
    strokeColor = "#8A5CF0";
    glowColor = "rgba(138, 92, 240, 0.45)";
    textColor = "#C9B8F0";
    badgeTitle = "C-Rank";
  } else if (rank === "B") {
    strokeColor = "#8A5CF0";
    glowColor = "rgba(138, 92, 240, 0.5)";
    textColor = "#C9B8F0";
    badgeTitle = "B-Rank";
  } else if (rank === "A") {
    strokeColor = "#C9B8F0";
    glowColor = "rgba(201, 184, 240, 0.55)";
    textColor = "#E3D8FA";
    badgeTitle = "A-Rank";
  } else if (rank === "S") {
    strokeColor = "#C9B8F0";
    glowColor = "rgba(201, 184, 240, 0.8)";
    textColor = "#E3D8FA";
    badgeTitle = "S-Rank";
  }

  const dimensions = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-14 h-14";

  return (
    <div className={`relative flex flex-col items-center justify-center ${dimensions} ${className}`}>
      {/* Radiant Glow Sphere behind SVG */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-80 pointer-events-none transition-all duration-300"
        style={{ 
          boxShadow: `0 0 16px 2px ${glowColor}`,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
      />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
        <defs>
          <linearGradient id={`grad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="50%" stopColor="#0B0E17" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020308" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Outer Hexagon Shield Ring */}
        <path 
          d="M50 4 L92 25 L92 75 L50 96 L8 75 L8 25 Z" 
          fill={`url(#grad-${rank})`} 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinejoin="round"
        />

        {/* Hexagon Inner Laser Guideline */}
        <path 
          d="M50 11 L84 28 L84 72 L50 89 L16 72 L16 28 Z" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="1.2" 
          strokeOpacity="0.55" 
          strokeDasharray={rank === "S" || rank === "A" ? "4,2" : "none"}
          strokeLinejoin="round"
        />

        {/* Display Rank Letter Text */}
        <text 
          x="50" 
          y="64" 
          fontSize="48" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={textColor} 
          textAnchor="middle"
          style={{ 
            textShadow: `0 0 10px ${strokeColor}, 0 0 2px #fff`,
            fontWeight: 900
          }}
        >
          {rank}
        </text>
      </svg>
    </div>
  );
}

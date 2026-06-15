import React from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { CharacterClass } from "../types";
import { getHunterRank, RANK_METADATA } from "../utils/rankUtils";
import { RankBadge } from "./RankBadge";

interface AnimatedAvatarProps {
  characterClass: CharacterClass;
  level: number;
}

export function AnimatedAvatar({ characterClass, level }: AnimatedAvatarProps) {
  const tier = Math.min(Math.floor(level / 10) + 1, 10);

  const getTierData = () => {
    switch (tier) {
      case 1:
        return { title: "Novice", borderColor: "border-white/10", bgGlow: "bg-[#9A8FB8]/20" };
      case 2:
        return { title: "Squire", borderColor: "border-[#8A5CF0]/40", bgGlow: "bg-[#8A5CF0]/20" };
      case 3:
        return { title: "Vanguard", borderColor: "border-[#8A5CF0]/50", bgGlow: "bg-[#8A5CF0]/20" };
      case 4:
        return { title: "Acolyte", borderColor: "border-[#8A5CF0]/60", bgGlow: "bg-[#8A5CF0]/20" };
      case 5:
        return { title: "Elite Knight", borderColor: "border-[#C9B8F0]/50", bgGlow: "bg-[#C9B8F0]/25" };
      case 6:
        return { title: "Gladiator", borderColor: "border-[#C9B8F0]/60", bgGlow: "bg-[#C9B8F0]/25" };
      case 7:
        return { title: "Master", borderColor: "border-[#C9B8F0]/70", bgGlow: "bg-[#C9B8F0]/30" };
      case 8:
        return { title: "Legend", borderColor: "border-[#C9B8F0]/80", bgGlow: "bg-[#C9B8F0]/30" };
      case 9:
        return { title: "Ascended Hero", borderColor: "border-[#E3D8FA]/70", bgGlow: "bg-[#E3D8FA]/40" };
      case 10:
      default:
        return { title: "Immortal God", borderColor: "border-[#E3D8FA]", bgGlow: "bg-[#E3D8FA]/50" };
    }
  };

  const currentTier = getTierData();
  const rank = getHunterRank(level);
  const rankStyle = RANK_METADATA[rank];

  return (
    <div className="flex flex-col items-center">
      <div className="relative p-2.5 flex justify-center items-center">
        {/* Dynamic Glowing Aura Rings with rotation and breathing speeds */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.55, 0.85, 0.55],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-44 h-44 rounded-full blur-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${rankStyle.avatarFrameGlow} 0%, transparent 70%)`
          }}
        />

        {/* Dynamic Class Specific Portrait Silhouette */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`relative z-10 w-36 h-36 rounded-full border-4 ${currentTier.borderColor} ${rankStyle.glowClass} bg-gradient-to-b from-[#1B1430] via-[#15101F] to-[#100B1A] flex items-center justify-center overflow-hidden`}
        >
          {/* Subtle system coordinate grids inside portrait for RPG authenticity */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: "radial-gradient(#8A5CF0 1px, transparent 1px), radial-gradient(#C9B8F0 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 4px 4px"
          }} />

          {/* Premium custom path SVG warrior silhouette */}
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
            <defs>
              <radialGradient id="warriorAura" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#8A5CF0" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#C9B8F0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#15101F" stopOpacity="0" />
              </radialGradient>
              <filter id="laserCyan">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="voidGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Backlight color */}
            <circle cx="50" cy="55" r="32" fill="url(#warriorAura)" />

            {/* Fine futuristic overlay markings */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#8A5CF0" strokeWidth="0.5" strokeOpacity="0.15" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#C9B8F0" strokeWidth="0.5" strokeOpacity="0.08" />

            {/* Sharp armor shoulder plates / spiky dark warrior neckguard */}
            <path 
              d="M8,100 Q15,70 30,60 L35,62 L42,54 Q50,56 58,54 L65,62 L70,60 Q85,70 92,100 Z"
              fill="#100B1A"
              stroke="#8A5CF0"
              strokeWidth="2.2" 
              strokeLinejoin="round" 
              filter="url(#voidGlow)"
            />
            {/* Shimmer highlights on neck armor lines */}
            <path 
              d="M16,100 Q21,76 34,66 L50,60 L66,66 Q79,76 84,100 Z"
              fill="#0C0816"
              stroke="#C9B8F0"
              strokeWidth="1" 
              strokeOpacity="0.6"
            />

            {/* Hood / Shadow Assassin Mask styling */}
            {characterClass === "Assassin" || characterClass === "Warrior" ? (
              <path 
                d="M35,53 Q31,39 41,23 Q50,21 59,23 Q69,39 65,53 Q50,57 35,53 Z"
                fill="#0C0816"
                stroke="#8A5CF0"
                strokeWidth="1.6"
              />
            ) : (
              // Magical High wizard distinct pointed hood shape
              <path 
                d="M33,53 Q29,37 39,15 L50,11 L61,15 Q71,37 67,53 Q50,57 33,53 Z"
                fill="#0C0816"
                stroke="#C9B8F0"
                strokeWidth="1.6"
              />
            )}

            {/* Faceless inner hollow shadow */}
            <path 
              d="M40,39 L50,29 L60,39 L56,47 L44,47 Z" 
              fill="#020306" 
            />

            {/* Dual glowing laser eyes - classic Monarch power emission */}
            <path
              d="M41.5,38.5 L46.5,39"
              stroke="#C9B8F0"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#laserCyan)"
            />
            <path
              d="M58.5,38.5 L53.5,39"
              stroke="#C9B8F0"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#laserCyan)"
            />

            {/* Energy trails bursting from glowing pupils */}
            <path
              d="M41,38.5 Q32,36 26,44"
              fill="none"
              stroke="#C9B8F0"
              strokeWidth="1"
              strokeOpacity="0.85"
              strokeLinecap="round"
              filter="url(#laserCyan)"
            />
            <path
              d="M59,38.5 Q68,36 74,44"
              fill="none"
              stroke="#C9B8F0"
              strokeWidth="1"
              strokeOpacity="0.85"
              strokeLinecap="round"
              filter="url(#laserCyan)"
            />
          </svg>

          {/* Inner concentric ring layer */}
          <div className="absolute inset-2 border border-white/10 pointer-events-none rounded-full" />
        </motion.div>

        {/* Embedded modular rank badge floating at bottom left */}
        <div className="absolute -bottom-2 -left-2.5 z-30">
          <RankBadge rank={rank} size="sm" />
        </div>

        {/* Floating Crown above high tiers */}
        {tier >= 6 && (
          <div className="absolute -top-3 z-20 p-1 bg-gradient-to-r from-[#C9B8F0] via-[#E3D8FA] to-[#C9B8F0] border border-white/20 rounded-full shadow-lg shadow-black animate-bounce">
            <Crown className="w-4 h-4 text-[#241B3A]" />
          </div>
        )}
      </div>

      {/* Label and statistics */}
      <div className="mt-3.5 text-center">
        <span className="text-[#C9B8F0] text-xs font-display font-semibold tracking-wider block">
          Tier {tier}: {currentTier.title}
        </span>
        <span className="text-[#9A8FB8] text-[10px] block uppercase tracking-[0.3em] mt-0.5 font-monument">
          Evolving at Lv. {Math.ceil((level + 0.1) / 10) * 10}
        </span>
      </div>
    </div>
  );
}

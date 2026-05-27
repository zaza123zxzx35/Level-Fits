export type HunterRank = "E" | "D" | "C" | "B" | "A" | "S";

export function getHunterRank(level: number): HunterRank {
  if (level < 10) return "E";
  if (level < 20) return "D";
  if (level < 30) return "C";
  if (level < 40) return "B";
  if (level < 50) return "A";
  return "S";
}

export interface RankStyle {
  rankName: string;
  badgeBg: string; // Tailwind bg color
  textColor: string; // text color
  borderColor: string; // border color
  glowClass: string; // neon glow CSS shadows
  skinClass: string; // background card gradient skin
  exclusiveTrial: string;
  avatarFrameGlow: string;
}

export const RANK_METADATA: Record<HunterRank, RankStyle> = {
  E: {
    rankName: "E-Rank (Assoc. Novice)",
    badgeBg: "bg-slate-800 text-gray-300 border-gray-600",
    textColor: "text-gray-400",
    borderColor: "border-slate-800",
    glowClass: "shadow-[0_0_10px_rgba(100,116,139,0.3)]",
    skinClass: "from-slate-950 to-slate-900",
    exclusiveTrial: "D-Rank Gate Keys",
    avatarFrameGlow: "rgba(148, 163, 184, 0.2)",
  },
  D: {
    rankName: "D-Rank (Awakened Hunter)",
    badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-800",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-800/30",
    glowClass: "shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    skinClass: "from-[#0A101C] to-[#0D1B2A]",
    exclusiveTrial: "Red Gate Reconnaissance",
    avatarFrameGlow: "rgba(6, 182, 212, 0.35)",
  },
  C: {
    rankName: "C-Rank (Veteran Striker)",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-800/30",
    glowClass: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
    skinClass: "from-[#070D1A] to-[#0A261E]",
    exclusiveTrial: "Sovereign Dungeon Clearance",
    avatarFrameGlow: "rgba(16, 185, 129, 0.4)",
  },
  B: {
    rankName: "B-Rank (High-Tier Magus)",
    badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800",
    textColor: "text-purple-400",
    borderColor: "border-purple-800/30",
    glowClass: "shadow-[0_0_25px_rgba(139,92,246,0.6)] animate-pulse",
    skinClass: "from-[#0E0B1E] to-[#1E0B30]",
    exclusiveTrial: "Jeju Island Scout Probe",
    avatarFrameGlow: "rgba(139, 92, 246, 0.55)",
  },
  A: {
    rankName: "A-Rank (Elite Guildmaster)",
    badgeBg: "bg-rose-950/80 text-rose-300 border-rose-800",
    textColor: "text-rose-400",
    borderColor: "border-rose-800/30",
    glowClass: "shadow-[0_0_35px_rgba(244,63,94,0.7)] animate-pulse",
    skinClass: "from-[#150A19] to-[#2E0B19]",
    exclusiveTrial: "Monarch Vanguard Retaliation",
    avatarFrameGlow: "rgba(244, 63, 94, 0.7)",
  },
  S: {
    rankName: "S-Rank (National Level Hunter)",
    badgeBg: "bg-[#003B5C] text-[#00C8FF] border-[#00C8FF] font-black animate-pulse",
    textColor: "text-[#00C8FF]",
    borderColor: "border-[#00C8FF]/50",
    glowClass: "shadow-[0_0_45px_rgba(0,200,255,0.85)] border-[#00C8FF] border shadow-[#00C8FF]/55",
    skinClass: "from-[#020512] via-[#0D0D1A] to-[#1A0142]",
    exclusiveTrial: "Solo Imperial Monarch Defiance",
    avatarFrameGlow: "rgba(0, 200, 255, 0.9)",
  },
};

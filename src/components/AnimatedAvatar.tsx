import { motion } from "motion/react";
import { Shield, Sparkles, Wand2, Sword, Skull, Flame, Zap, Trophy, Crown, Gem, Compass } from "lucide-react";
import { CharacterClass } from "../types";
import { getHunterRank, RANK_METADATA } from "../utils/rankUtils";

interface AnimatedAvatarProps {
  characterClass: CharacterClass;
  level: number;
}


export function AnimatedAvatar({ characterClass, level }: AnimatedAvatarProps) {
  // Determine Tier number (1 to 10)
  const tier = Math.min(Math.floor(level / 10) + 1, 10);

  // Get tier styling and title
  const getTierData = () => {
    switch (tier) {
      case 1:
        return {
          title: "Novice",
          borderColor: "border-slate-500",
          shadowColor: "shadow-slate-500/30",
          glowColor: "bg-slate-500/20",
          icon: Shield,
          frameTheme: "from-slate-600 via-slate-700 to-slate-800"
        };
      case 2:
        return {
          title: "Squire",
          borderColor: "border-cyan-600",
          shadowColor: "shadow-cyan-500/40",
          glowColor: "bg-cyan-500/25",
          icon: Shield,
          frameTheme: "from-cyan-700 via-slate-800 to-cyan-900"
        };
      case 3:
        return {
          title: "Vanguard",
          borderColor: "border-emerald-500",
          shadowColor: "shadow-emerald-500/50",
          glowColor: "bg-emerald-500/30",
          icon: Compass,
          frameTheme: "from-emerald-700 via-slate-800 to-emerald-900"
        };
      case 4:
        return {
          title: "Acolyte",
          borderColor: "border-purple-500",
          shadowColor: "shadow-purple-550/50",
          glowColor: "bg-purple-500/30",
          icon: Wand2,
          frameTheme: "from-purple-700 via-slate-800 to-purple-900"
        };
      case 5:
        return {
          title: "Elite Knight",
          borderColor: "border-rose-500",
          shadowColor: "shadow-rose-500/60",
          glowColor: "bg-rose-500/35",
          icon: Sword,
          frameTheme: "from-rose-600 via-slate-800 to-slate-900"
        };
      case 6:
        return {
          title: "Gladiator",
          borderColor: "border-orange-500",
          shadowColor: "shadow-orange-500/65",
          glowColor: "bg-orange-500/40",
          icon: Flame,
          frameTheme: "from-orange-600 via-slate-800 to-amber-950"
        };
      case 7:
        return {
          title: "Master",
          borderColor: "border-teal-400",
          shadowColor: "shadow-teal-400/70",
          glowColor: "bg-teal-400/40",
          icon: Sparkles,
          frameTheme: "from-teal-600 via-slate-800 to-slate-950"
        };
      case 8:
        return {
          title: "Legend",
          borderColor: "border-indigo-500",
          shadowColor: "shadow-indigo-500/80",
          glowColor: "bg-indigo-500/45",
          icon: Trophy,
          frameTheme: "from-indigo-600 via-slate-800 to-fuchsia-950"
        };
      case 9:
        return {
          title: "Ascended Hero",
          borderColor: "border-pink-500",
          shadowColor: "shadow-pink-500/90",
          glowColor: "bg-pink-500/50",
          icon: Gem,
          frameTheme: "from-pink-600 via-purple-900 to-slate-950"
        };
      case 10:
      default:
        return {
          title: "Immortal God",
          borderColor: "border-yellow-400",
          shadowColor: "shadow-yellow-400/100",
          glowColor: "bg-yellow-400/60",
          icon: Crown,
          frameTheme: "from-amber-500 via-yellow-400 to-slate-950"
        };
    }
  };

  const currentTier = getTierData();
  const HeroClassIcon = characterClass === "Warrior" ? Sword : characterClass === "Mage" ? Wand2 : Skull;

  // Determine Class Gradient
  const getClassGradient = () => {
    switch (characterClass) {
      case "Warrior": // Crimson strength
        return "from-rose-900 via-red-800 to-slate-950 border-rose-500";
      case "Mage": // Magical amethyst
        return "from-purple-900 via-violet-800 to-slate-950 border-purple-500";
      case "Assassin": // Emerald shadow
        return "from-emerald-950 via-teal-900 to-slate-950 border-emerald-500";
    }
  };

  const rank = getHunterRank(level);
  const rankStyle = RANK_METADATA[rank];

  return (
    <div className="flex flex-col items-center">
      {/* Container with relative tier levels glow */}
      <div className="relative p-2.5">
        {/* Glowing Aura Rings representing evolve tier */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 3 - (tier * 0.2), // Tiers rotate/breathe faster as they level!
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 rounded-full blur-xl pointer-events-none`}
          style={{ backgroundColor: rankStyle.avatarFrameGlow }}
        />

        {/* Dynamic Class Specific Portrait */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`relative z-10 w-32 h-32 rounded-full border-4 ${currentTier.borderColor} ${rankStyle.glowClass} shadow-lg bg-gradient-to-b ${getClassGradient()} flex flex-col items-center justify-center overflow-hidden`}
        >
          {/* Glowing particle sparkles inside portrait for high tiers */}
          {tier >= 4 && (
            <div className="absolute inset-0 pointer-events-none opacity-40 animate-pulse">
              <Sparkles className="absolute w-4 h-4 text-white top-4 left-6 animate-bounce" />
              <Zap className="absolute w-3 h-3 text-yellow-300 bottom-6 right-6 animate-ping" />
            </div>
          )}

          {/* Central Class Glyph */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center justify-center"
          >
            <HeroClassIcon className="w-16 h-16 text-yellow-400 filter drop-shadow-[0_2px_4px_rgba(255,215,0,0.5)]" />
          </motion.div>

          {/* Subtitle RPG label inside portrait */}
          <div className="absolute bottom-2 text-[10px] font-bold tracking-widest text-[#FFD700] uppercase font-mono px-2 py-0.5 bg-slate-950/80 rounded border border-yellow-550/30">
            {characterClass}
          </div>
        </motion.div>

        {/* Hunter Rank Badge floating */}
        <div style={{ minHeight: "26px" }} className={`absolute -bottom-1.5 -left-1 z-30 px-2.5 py-0.5 text-xs font-mono font-black border uppercase rounded-lg shadow-xl cursor-default ${rankStyle.badgeBg} ${rankStyle.glowClass}`}>
          {rank}-RANK
        </div>

        {/* Outer Top Tier Crown Icon Badge */}
        {tier >= 6 && (
          <div className="absolute -top-1 -right-1 z-20 p-1 bg-gradient-to-r from-amber-500 to-yellow-400 border border-yellow-200 rounded-full shadow-lg shadow-black">
            <Crown className="w-5 h-5 text-slate-900" />
          </div>
        )}
      </div>


      {/* Tier Label */}
      <div className="mt-3 text-center">
        <span className="text-yellow-400 text-xs font-mono font-black uppercase tracking-wider block">
          Tier {tier}: {currentTier.title}
        </span>
        <span className="text-gray-400 text-[10px] block uppercase tracking-widest mt-0.5">
          Evolving at next Lv. {Math.ceil((level + 0.1) / 10) * 10}
        </span>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { UserProfile, WorkoutLog } from "../types";
import { 
  Award, 
  Skull, 
  Sword, 
  Sparkles, 
  Zap, 
  Trophy, 
  Gem, 
  Lock, 
  CheckCircle2, 
  Volume2, 
  Flame, 
  Search,
  ShieldAlert,
  Crown
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface AchievementsViewProps {
  currentUser: UserProfile;
  workoutHistory: WorkoutLog[];
  onRefreshProfile: () => Promise<void>;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  badgeId: string;
  badgeTitle: string;
  badgeDesc: string;
  icon: any;
  category: "Strength" | "Cardio" | "General" | "Level";
  targetValue: number;
  getCurrentValue: (workouts: WorkoutLog[], user: UserProfile) => number;
  color: string; // Tailwind color classes
  glow: string; // Shadow glow classes
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: "milestone_first",
    title: "The Awakening Hour",
    desc: "Log your first fitness log to wake up the internal system link.",
    badgeId: "first_log_badge",
    badgeTitle: "Awakened Initiate",
    badgeDesc: "Cosmetic Badge: Acknowledge the core system interface overlay.",
    icon: Gem,
    category: "General",
    targetValue: 1,
    getCurrentValue: (workouts) => workouts.length,
    color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    glow: "shadow-cyan-500/20"
  },
  {
    id: "milestone_strength",
    title: "Demonic Castle Conqueror",
    desc: "Log at least 3 Strength workouts focused on muscle hypertrophy.",
    badgeId: "strength_badge",
    badgeTitle: "C-Rank Ironfist",
    badgeDesc: "Cosmetic Badge: Physical armor attributes elevated.",
    icon: Sword,
    category: "Strength",
    targetValue: 3,
    getCurrentValue: (workouts) => workouts.filter(w => w.category === "Strength").length,
    color: "text-rose-400 bg-rose-950/40 border-rose-500/30",
    glow: "shadow-rose-500/20"
  },
  {
    id: "milestone_duration",
    title: "Double Dungeon Survivor",
    desc: "Amass a total of 100 logged minutes across all workouts.",
    badgeId: "duration_badge",
    badgeTitle: "Undead Survivor",
    badgeDesc: "Cosmetic Badge: Commemorates surviving double-gate system logic.",
    icon: Trophy,
    category: "General",
    targetValue: 100,
    getCurrentValue: (workouts) => workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
    color: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    glow: "shadow-amber-500/20"
  },
  {
    id: "milestone_cardio",
    title: "Shadow Sovereign Dash",
    desc: "Amass a total of 60 logged minutes specifically in Cardio mode.",
    badgeId: "cardio_badge",
    badgeTitle: "Sprint Monarch",
    badgeDesc: "Cosmetic Badge: Overclocked nervous system response times.",
    icon: Zap,
    category: "Cardio",
    targetValue: 60,
    getCurrentValue: (workouts) => workouts.filter(w => w.category === "Cardio").reduce((sum, w) => sum + (w.duration || 0), 0),
    color: "text-orange-400 bg-orange-950/40 border-orange-500/30",
    glow: "shadow-orange-500/20"
  },
  {
    id: "milestone_limit",
    title: "Absolute Limit Breaker",
    desc: "Shatter individual physical boundaries by logging any intensity 5 workout.",
    badgeId: "limit_badge",
    badgeTitle: "Shadow Berserker",
    badgeDesc: "Cosmetic Badge: Unlocks wild dark physical emission visualizers.",
    icon: Skull,
    category: "General",
    targetValue: 1,
    getCurrentValue: (workouts) => workouts.some(w => w.intensity === 5) ? 1 : 0,
    color: "text-purple-400 bg-purple-950/40 border-purple-500/30",
    glow: "shadow-purple-500/20"
  },
  {
    id: "milestone_level",
    title: "Crown of Shadows",
    desc: "Rise to system Level 5 or higher to establish command leadership.",
    badgeId: "level_badge",
    badgeTitle: "Shadow Sovereign",
    badgeDesc: "Cosmetic Badge: Full command of extracted soldiers.",
    icon: Crown,
    category: "Level",
    targetValue: 5,
    getCurrentValue: (_, user) => user.level,
    color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/30",
    glow: "shadow-yellow-500/20"
  }
];

export function AchievementsView({ currentUser, workoutHistory, onRefreshProfile }: AchievementsViewProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"All" | "Strength" | "Cardio" | "General" | "Level">("All");

  const ownedBadges = currentUser.badges || [];

  const handleClaimBadge = async (ach: Achievement) => {
    if (ownedBadges.includes(ach.badgeId)) return;
    setClaimingId(ach.id);

    try {
      const updatedBadges = [...ownedBadges, ach.badgeId];

      if (currentUser.uid.startsWith("guest_")) {
        const updatedProfile = { ...currentUser, badges: updatedBadges };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        await onRefreshProfile();
      } else {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          badges: updatedBadges
        });
        await onRefreshProfile();
      }

      // Voice synthesiser alert
      try {
        const synthMsg = new SpeechSynthesisUtterance(`New title unlocked: ${ach.badgeTitle}.`);
        synthMsg.pitch = 0.5;
        synthMsg.rate = 0.85;
        window.speechSynthesis.speak(synthMsg);
      } catch (e) {}

    } catch (e) {
      console.error("Failed to unlock achievement badge", e);
    } finally {
      setClaimingId(null);
    }
  };

  const handleEquipTitle = async (badgeId: string, badgeTitle: string) => {
    setEquippingId(badgeId);
    try {
      const currentEquipped = currentUser.equippedTitle === badgeId ? "" : badgeId;

      if (currentUser.uid.startsWith("guest_")) {
        const updatedProfile = { ...currentUser, equippedTitle: currentEquipped };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        await onRefreshProfile();
      } else {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          equippedTitle: currentEquipped
        });
        await onRefreshProfile();
      }

      // Voice synthesizer
      try {
        const phrase = currentEquipped 
          ? `Sovereign title ${badgeTitle} equipped.`
          : "Sovereign title un-equipped.";
        const synthMsg = new SpeechSynthesisUtterance(phrase);
        synthMsg.pitch = 0.45;
        synthMsg.rate = 0.8;
        window.speechSynthesis.speak(synthMsg);
      } catch (e) {}

    } catch (e) {
      console.error("Failed to toggle equipped tile", e);
    } finally {
      setEquippingId(null);
    }
  };

  const filteredAchievements = ACHIEVEMENTS_LIST.filter(ach => {
    if (filterCategory === "All") return true;
    return ach.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Title Panel */}
      <div className="p-5 bg-gradient-to-br from-slate-950 to-[#0F051D] border-2 border-purple-500/20 rounded-2xl relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B2FBE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-2 top-2 px-1 rounded bg-[#00C8FF]/15 text-[#00C8FF] text-[8px] font-mono tracking-widest uppercase">
          ACHIEVEMENTS_MATRIX_SECURE
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 bg-purple-950/60 border border-purple-500/40 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-sans tracking-wide uppercase">
              Monarch Achievements
            </h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider mt-0.5">
              ACHIEVE LIFETIME MILESTONES TO REAP COSMETIC TITLES
            </p>
          </div>
        </div>

        {/* Status report */}
        <div className="mt-4 grid grid-cols-2 gap-4 pt-3.5 border-t border-purple-550/10 text-center font-mono">
          <div className="bg-slate-950/40 p-2 border border-slate-900 rounded-lg">
            <span className="block text-[9px] text-[#00C8FF] font-black uppercase">Trials Cleared</span>
            <span className="text-xl font-black text-white">
              {ACHIEVEMENTS_LIST.filter(a => a.getCurrentValue(workoutHistory, currentUser) >= a.targetValue).length} / {ACHIEVEMENTS_LIST.length}
            </span>
          </div>
          <div className="bg-slate-950/40 p-2 border border-slate-900 rounded-lg">
            <span className="block text-[9px] text-purple-400 font-black uppercase">Titles Earned</span>
            <span className="text-xl font-black text-white">
              {ACHIEVEMENTS_LIST.filter(a => ownedBadges.includes(a.badgeId)).length} / {ACHIEVEMENTS_LIST.length}
            </span>
          </div>
        </div>
      </div>

      {/* Equipped Title Showcase */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-left relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest block">Active Equipped Title</span>
          {currentUser.equippedTitle ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-yellow-400 bg-yellow-950/50 border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.25)] uppercase tracking-widest animate-pulse">
                Title: {ACHIEVEMENTS_LIST.find(a => a.badgeId === currentUser.equippedTitle)?.badgeTitle || currentUser.equippedTitle}
              </span>
            </div>
          ) : (
            <span className="text-xs font-sans text-gray-400 italic">No Title Equipped. Unlock milestones below.</span>
          )}
        </div>
        
        {currentUser.equippedTitle && (
          <button
            onClick={() => handleEquipTitle(currentUser.equippedTitle!, "")}
            disabled={equippingId !== null}
            className="px-2.5 py-1 text-[9px] font-mono font-black border border-red-500/40 text-red-400 rounded hover:bg-red-950/20 transition-colors"
          >
            Unequip
          </button>
        )}
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["All", "Strength", "Cardio", "General", "Level"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg border transition-all shrink-0 cursor-pointer ${
              filterCategory === cat
                ? "bg-[#07243B] border-[#00C8FF]/50 text-[#00C8FF]"
                : "bg-slate-950 border-slate-800 text-gray-400 hover:text-white"
            }`}
            style={{ minHeight: "34px" }}
          >
            {cat === "All" ? "All Gigs" : cat}
          </button>
        ))}
      </div>

      {/* List layout */}
      <div className="space-y-4">
        {filteredAchievements.map((ach) => {
          const val = ach.getCurrentValue(workoutHistory, currentUser);
          const percent = Math.min((val / ach.targetValue) * 100, 100);
          const isUnlocked = val >= ach.targetValue;
          const isClaimed = ownedBadges.includes(ach.badgeId);
          const isEquipped = currentUser.equippedTitle === ach.badgeId;

          const AchIcon = ach.icon;

          return (
            <div 
              key={ach.id}
              className={`p-5 rounded-xl border transition-all ${
                isUnlocked 
                  ? "bg-[#0A0D18] border-purple-500/30" 
                  : "bg-[#050710]/90 border-slate-900 opacity-60"
              }`}
            >
              
              {/* Top info and status icon */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${ach.color} ${isUnlocked ? ach.glow : ""}`}>
                    <AchIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      {ach.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed font-sans max-w-[210px]">
                      {ach.desc}
                    </p>
                  </div>
                </div>

                {/* Badge showcase overlay */}
                <div className="text-right">
                  {isUnlocked ? (
                    <span className="text-[8px] font-mono font-black text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      [CLEARED]
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono font-black text-slate-500 uppercase bg-slate-900 px-1.5 py-0.5 rounded">
                      [LOCKED]
                    </span>
                  )}
                </div>
              </div>

              {/* Progress slider bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono text-gray-500">
                  <span>Progress Metrics</span>
                  <span className={isUnlocked ? "text-[#00C8FF] font-black" : ""}>
                    {val.toFixed(0)} / {ach.targetValue}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className={`h-full transition-all duration-500 ${isUnlocked ? "bg-gradient-to-r from-[#00C8FF] to-[#7B2FBE]" : "bg-purple-800"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reward Reveal &Claim/Equip button action */}
              <div className="mt-4 pt-3 border-t border-slate-900/40 flex flex-col items-stretch md:flex-row md:items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-1.5 text-left">
                  <Award className="w-3.5 h-3.5 text-yellow-500" />
                  <div className="text-[9px]">
                    <span className="text-yellow-400 font-bold block uppercase">REWARD COSMETIC BADGE:</span>
                    <span className="text-white font-black uppercase font-mono">{ach.badgeTitle}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {!isUnlocked ? (
                    <button
                      disabled
                      className="px-3 h-8 text-[9px] font-mono font-black uppercase text-gray-500 bg-slate-950 border border-slate-900 rounded-lg flex items-center gap-1 cursor-not-allowed"
                      style={{ minHeight: "34px" }}
                    >
                      <Lock className="w-3 h-3" /> Locked
                    </button>
                  ) : !isClaimed ? (
                    <button
                      onClick={() => handleClaimBadge(ach)}
                      disabled={claimingId !== null}
                      className="px-3.5 h-8 text-[9px] font-mono font-black uppercase text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-lg animate-pulse"
                      style={{ minHeight: "34px" }}
                    >
                      Claim Badge
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquipTitle(ach.badgeId, ach.badgeTitle)}
                      disabled={equippingId !== null}
                      className={`px-3.5 h-8 text-[9px] font-mono font-black uppercase rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isEquipped
                          ? "bg-amber-950/60 border-amber-500 text-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.30)]"
                          : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                      style={{ minHeight: "34px" }}
                    >
                      {isEquipped ? "Title Active" : "Equip Title"}
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

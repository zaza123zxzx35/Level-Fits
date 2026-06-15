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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
    color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
      <div className="p-5 frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute left-2 top-2 px-1 rounded font-monument text-[#C9B8F0]/60 text-[8px] tracking-[0.3em] uppercase">
          ACHIEVEMENTS_MATRIX_SECURE
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 frost border border-[#C9B8F0]/40 rounded-2xl">
            <Trophy className="w-6 h-6 text-[#C9B8F0]" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-[#EDE6FA] tracking-wide">
              Monarch Achievements
            </h3>
            <p className="text-[10px] text-[#9A8FB8] font-monument tracking-[0.2em] uppercase mt-0.5">
              ACHIEVE LIFETIME MILESTONES TO REAP COSMETIC TITLES
            </p>
          </div>
        </div>

        {/* Status report */}
        <div className="mt-4 grid grid-cols-2 gap-4 pt-3.5 border-t border-white/10 text-center">
          <div className="bg-[#15101F] p-2 border border-white/10 rounded-2xl">
            <span className="block text-[9px] text-[#C9B8F0] font-monument tracking-[0.15em] uppercase">Trials Cleared</span>
            <span className="text-xl font-display font-semibold text-[#EDE6FA]">
              {ACHIEVEMENTS_LIST.filter(a => a.getCurrentValue(workoutHistory, currentUser) >= a.targetValue).length} / {ACHIEVEMENTS_LIST.length}
            </span>
          </div>
          <div className="bg-[#15101F] p-2 border border-white/10 rounded-2xl">
            <span className="block text-[9px] text-[#C9B8F0] font-monument tracking-[0.15em] uppercase">Titles Earned</span>
            <span className="text-xl font-display font-semibold text-[#EDE6FA]">
              {ACHIEVEMENTS_LIST.filter(a => ownedBadges.includes(a.badgeId)).length} / {ACHIEVEMENTS_LIST.length}
            </span>
          </div>
        </div>
      </div>

      {/* Equipped Title Showcase */}
      <div className="p-4 frost rounded-2xl flex items-center justify-between text-left relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[9px] font-monument text-[#9A8FB8] uppercase tracking-[0.3em] block">Active Equipped Title</span>
          {currentUser.equippedTitle ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-monument text-[#C9B8F0] frost border border-[#C9B8F0]/40 uppercase tracking-[0.2em]">
                Title: {ACHIEVEMENTS_LIST.find(a => a.badgeId === currentUser.equippedTitle)?.badgeTitle || currentUser.equippedTitle}
              </span>
            </div>
          ) : (
            <span className="text-xs font-sans text-[#9A8FB8] italic">No Title Equipped. Unlock milestones below.</span>
          )}
        </div>

        {currentUser.equippedTitle && (
          <button
            onClick={() => handleEquipTitle(currentUser.equippedTitle!, "")}
            disabled={equippingId !== null}
            className="px-2.5 py-1 text-[9px] font-monument frost border border-white/10 text-[#C7BBE2] rounded-full hover:text-[#EDE6FA] transition-colors"
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
            className={`px-3 py-1.5 text-[10px] font-monument uppercase tracking-[0.15em] rounded-full transition-all shrink-0 cursor-pointer ${
              filterCategory === cat
                ? "frost border border-[#C9B8F0]/40 text-[#C9B8F0]"
                : "frost text-[#C7BBE2] hover:text-[#EDE6FA]"
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
              className={`p-5 rounded-2xl transition-all ${
                isUnlocked
                  ? "frost border border-[#C9B8F0]/40"
                  : "bg-[#15101F] border border-white/10 opacity-60"
              }`}
            >

              {/* Top info and status icon */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-2xl border ${ach.color} ${isUnlocked ? ach.glow : ""}`}>
                    <AchIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold text-[#EDE6FA] tracking-wide">
                      {ach.title}
                    </h4>
                    <p className="text-[10px] text-[#9A8FB8] mt-0.5 leading-relaxed font-sans max-w-[210px]">
                      {ach.desc}
                    </p>
                  </div>
                </div>

                {/* Badge showcase overlay */}
                <div className="text-right">
                  {isUnlocked ? (
                    <span className="text-[8px] font-monument tracking-[0.1em] text-[#C9B8F0] uppercase frost border border-[#C9B8F0]/40 px-1.5 py-0.5 rounded-full">
                      [CLEARED]
                    </span>
                  ) : (
                    <span className="text-[8px] font-monument tracking-[0.1em] text-[#5A5270] uppercase bg-[#15101F] border border-white/10 px-1.5 py-0.5 rounded-full">
                      [LOCKED]
                    </span>
                  )}
                </div>
              </div>

              {/* Progress slider bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[9px] text-[#9A8FB8]">
                  <span>Progress Metrics</span>
                  <span className={isUnlocked ? "text-[#C9B8F0] font-semibold" : ""}>
                    {val.toFixed(0)} / {ach.targetValue}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#15101F] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full transition-all duration-500 bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reward Reveal &Claim/Equip button action */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-stretch md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-left">
                  <Award className="w-3.5 h-3.5 text-[#C9B8F0]" />
                  <div className="text-[9px]">
                    <span className="text-[#C9B8F0] font-monument tracking-[0.1em] block uppercase">REWARD COSMETIC BADGE:</span>
                    <span className="text-[#EDE6FA] font-display font-semibold uppercase">{ach.badgeTitle}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {!isUnlocked ? (
                    <button
                      disabled
                      className="px-3 h-8 text-[9px] font-monument tracking-[0.1em] uppercase text-[#5A5270] bg-[#15101F] border border-white/10 rounded-full flex items-center gap-1 cursor-not-allowed"
                      style={{ minHeight: "34px" }}
                    >
                      <Lock className="w-3 h-3" /> Locked
                    </button>
                  ) : !isClaimed ? (
                    <button
                      onClick={() => handleClaimBadge(ach)}
                      disabled={claimingId !== null}
                      className="px-3.5 h-8 text-[9px] font-monument tracking-[0.1em] uppercase text-[#241B3A] bg-[#B9A3E3] hover:bg-[#C7B5EC] rounded-full flex items-center justify-center gap-1 transition-all cursor-pointer"
                      style={{ minHeight: "34px" }}
                    >
                      Claim Badge
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquipTitle(ach.badgeId, ach.badgeTitle)}
                      disabled={equippingId !== null}
                      className={`px-3.5 h-8 text-[9px] font-monument tracking-[0.1em] uppercase rounded-full border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isEquipped
                          ? "frost border-[#C9B8F0]/40 text-[#C9B8F0]"
                          : "frost border-white/10 text-[#C7BBE2] hover:text-[#EDE6FA]"
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

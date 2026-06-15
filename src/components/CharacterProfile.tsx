import React, { useState, useEffect, useRef } from "react";
import { UserProfile, WorkoutLog } from "../types";
import { AnimatedAvatar } from "./AnimatedAvatar";
import { 
  Sword, 
  Wand2, 
  Shield, 
  Flame, 
  Gem, 
  Compass, 
  Award, 
  Heart, 
  Trophy, 
  Skull, 
  Volume2, 
  Sparkles, 
  ShieldAlert, 
  Zap,
  Info
} from "lucide-react";
import { getHunterRank, RANK_METADATA } from "../utils/rankUtils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface CharacterProfileProps {
  currentUser: UserProfile;
  workoutHistory: WorkoutLog[];
  onRefreshProfile?: () => Promise<void>;
  onAllocateStat?: (stat: "STR" | "AGI" | "END" | "VIT") => void;
}

interface ShadowSoldier {
  id: string;
  name: string;
  title: string;
  rank: string;
  desc: string;
  quote: string;
  color: string;
}

const SHADOWS_DECK: ShadowSoldier[] = [
  {
    id: "shadow_infantry",
    name: "Shadow Patrol",
    title: "Vanguard Infantry",
    rank: "D-Rank",
    desc: "A reanimated fighter of the dark abyss, standing guard with a shadowy spear.",
    quote: "🛡️ (Stands at attention, shadows swirling around its metal helmet)",
    color: "from-[#15101F] to-[#1B1428] border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "tank",
    name: "Tank",
    title: "Shadow Ice Bear",
    rank: "B-Rank",
    desc: "A colossal beast reanimated from the cold. Tremendous physical charging power.",
    quote: "🐻 ROOOAARRRR! (Shakes the entire system screen with frosty, shadow claws!)",
    color: "from-[#15101F] to-[#1B1428] border-[#C9B8F0]/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "iron",
    name: "Iron",
    title: "Heavy Shield Knight",
    rank: "A-Rank",
    desc: "Enthusiastic heavy heavy-lifter. Taunts foes with shield beats. Reanimated from a fallen guild member.",
    quote: "💥 HAHAHA! (Beats his massive steel shield while roaring at the top of his lungs!)",
    color: "from-[#15101F] to-[#1B1428] border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "igris",
    name: "Igris blood-red",
    title: "Commander Knight",
    rank: "A-Rank",
    desc: "The legendary red-knighted warrior. Wields a colossal zweihander sword with master precision.",
    quote: "⚔️ (Silently kneels, resting his sword point on the iron floor in total obedience)",
    color: "from-[#15101F] to-[#1B1428] border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "tusk",
    name: "Tusk",
    title: "High Orc Shaman",
    rank: "S-Rank",
    desc: "A spellcaster wielding gravity manipulation and colossal high-tier shadow fireballs.",
    quote: "🔥 Pyromancy Ritual! (Swings his dragon-head staff, lighting up the screen in dark purple fire!)",
    color: "from-[#15101F] to-[#1B1428] border-[#C9B8F0]/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "beru",
    name: "Beru",
    title: "Ant King General",
    rank: "S-Rank",
    desc: "The absolute pinnacle of speed and raw hunger. Unmatched absolute loyalty to the Monarch.",
    quote: "👑 MY KIINNGGG! WOULD YOU LIKE ME TO DEVOUR AND SLAUGHTER ALL WHO STAND BEFORE YOU?",
    color: "from-[#15101F] to-[#1B1428] border-[#C9B8F0]/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  },
  {
    id: "bellion",
    name: "Bellion",
    title: "Grand Marshal",
    rank: "S-Rank",
    desc: "The ultimate commander of the shadow host. Wields a giant snake-like segmented iron blade.",
    quote: "🌀 (Stands tall as a tower, wings of deep purple shade folding with heavy armor resonance)",
    color: "from-[#15101F] to-[#1B1428] border-[#C9B8F0]/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
  }
];

export function CharacterProfile({ currentUser, workoutHistory, onRefreshProfile, onAllocateStat }: CharacterProfileProps) {
  const [subTab, setSubTab] = useState<"attributes" | "shadows">("attributes");
  const [speakerText, setSpeakerText] = useState<string | null>(null);
  const [ariseSimulating, setAriseSimulating] = useState(false);
  const [extractedShadow, setExtractedShadow] = useState<string | null>(null);

  const prevStats = useRef(currentUser.stats);
  const [increasedStats, setIncreasedStats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const diffs: Record<string, boolean> = {};
    let changed = false;
    (["STR", "AGI", "END", "VIT"] as const).forEach(key => {
      if (currentUser.stats[key] > prevStats.current[key]) {
        diffs[key] = true;
        changed = true;
      }
    });

    if (changed) {
      setIncreasedStats(prev => ({ ...prev, ...diffs }));
      const timer = setTimeout(() => {
        setIncreasedStats({});
      }, 3500);
      prevStats.current = currentUser.stats;
      return () => clearTimeout(timer);
    }
    prevStats.current = currentUser.stats;
  }, [currentUser.stats]);

  const hunterRank = getHunterRank(currentUser.level);
  const rankStyle = RANK_METADATA[hunterRank];

  const totalWorkouts = workoutHistory.length;
  const strengthCount = workoutHistory.filter(w => w.category === "Strength").length;
  const cardioCount = workoutHistory.filter(w => w.category === "Cardio").length;
  const flexCount = workoutHistory.filter(w => w.category === "Flexibility").length;

  const currentShadows = currentUser.shadows || [];

  const handleSummonShadowSpeech = (shadow: ShadowSoldier) => {
    setSpeakerText(`"${shadow.name}": ${shadow.quote}`);
    
    // Web Speech synthesis deep voice effect
    try {
      const cleanQuote = shadow.quote.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanQuote);
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("deep") || v.lang.startsWith("en"));
      if (deepVoice) utterance.voice = deepVoice;
      utterance.pitch = 0.45; // ultra deep shadow pitch
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log("SpeechSynthesis disabled or blocked in iframe context", e);
    }
  };

  // Safe manual simulator trigger for players
  const handleExtractArise = async (shadowId: string) => {
    if (currentShadows.includes(shadowId)) return;
    setAriseSimulating(true);
    setExtractedShadow(shadowId);

    // Speak absolute command
    try {
      const utterance = new SpeechSynthesisUtterance("Arise.");
      utterance.pitch = 0.35;
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    } catch(e){}

    setTimeout(async () => {
      try {
        const updatedShadows = [...currentShadows, shadowId];
        if (currentUser.uid.startsWith("guest_")) {
          const updatedProfile = { ...currentUser, shadows: updatedShadows };
          localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
          if (onRefreshProfile) {
            await onRefreshProfile();
          }
        } else {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            shadows: updatedShadows
          });
          if (onRefreshProfile) {
            await onRefreshProfile();
          }
        }
      } catch (e) {
        console.error("Failed to commit shadow extraction", e);
      } finally {
        setAriseSimulating(false);
        setExtractedShadow(null);
      }
    }, 2800);
  };

  const handleRemoveDebuffTest = async () => {
    try {
      if (currentUser.uid.startsWith("guest_")) {
        const updatedProfile = { 
          ...currentUser, 
          debuffActive: false, 
          debuffReason: "", 
          punishmentQuestActive: false 
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        if (onRefreshProfile) {
          await onRefreshProfile();
        }
        return;
      }
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        debuffActive: false,
        debuffReason: "",
        punishmentQuestActive: false
      });
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
    } catch(e){}
  };

  // Badge Definitions
  const badgeDefinitions = [
    {
      id: "novice_badge",
      title: "Awakened E-Hunter",
      desc: "Woke up to the system notifications and claimed a designated class.",
      icon: Gem,
      color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
      unlocked: true
    },
    {
      id: "iron_badge",
      title: "Titan of Iron",
      desc: "Logged 3 intense heavy strength workouts to raise core skeletal integrity.",
      icon: Sword,
      color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
      unlocked: strengthCount >= 3
    },
    {
      id: "runner_badge",
      title: "Shadow Swiftness",
      desc: "Completed 3 heart-rate elevated cardio exercises.",
      icon: Flame,
      color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
      unlocked: cardioCount >= 3
    },
    {
      id: "streak_badge",
      title: "C-Rank Firekeeper",
      desc: "Logged a 3-day hot training streak to avoid systems penalty zone.",
      icon: Trophy,
      color: "text-[#C9B8F0] frost border-[#C9B8F0]/40",
      unlocked: currentUser.streak >= 3
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Central Portrait card & Holographic Window */}
      <div className="p-6 frost rounded-2xl flex flex-col items-center text-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative transition-all duration-300 overflow-hidden">
        <div className="absolute right-3 top-3 px-2 py-0.5 font-monument tracking-[0.3em] text-[9px] text-[#C9B8F0]/60 uppercase">
          AWAKEN
        </div>

        {/* Large warrior silhouette SVG */}
        <div className="relative w-full h-56 bg-[#15101F] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-4">
          {/* Soft purple aura */}
          <div className="absolute w-44 h-44 bg-[#7C5FC0] rounded-full blur-[40px] opacity-20" />

          {/* Subtle ring */}
          <div className="absolute w-40 h-40 border border-[#C9B8F0]/20 rounded-full" />

          {/* Geometric shadow warrior silhouette */}
          <svg viewBox="0 0 100 120" className="h-full w-auto z-10">
            <defs>
              <linearGradient id="shadowWarriorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1C0E2B" />
                <stop offset="50%" stopColor="#0B0314" />
                <stop offset="100%" stopColor="#020005" />
              </linearGradient>
            </defs>

            {/* Geometric sharp-edged body silhouette */}
            {/* Cape/swirling cloak details */}
            <path d="M50 20 L22 100 L32 115 L50 110 L68 115 L78 100 Z" fill="url(#shadowWarriorGrad)" />
            <path d="M12 110 Q25 78 40 45 L50 60 L60 45 Q75 78 88 110 Z" fill="#05010C" opacity="0.65" />

            {/* Sharp armor plates, shoulders */}
            <polygon points="35,46 22,54 28,68 38,58" fill="#150625" stroke="#7C5FC0" strokeWidth="0.8" />
            <polygon points="65,46 78,54 72,68 62,58" fill="#150625" stroke="#7C5FC0" strokeWidth="0.8" />

            {/* Sharp chest plate segments */}
            <polygon points="50,48 42,66 50,78 58,66" fill="#0A0214" stroke="#7C5FC0" strokeWidth="1" />
            
            {/* Helm of the Shadow Monarch */}
            <path d="M42,42 Q30,30 40,16 L50,10 L60,16 Q70,30 58,42 Z" fill="#0F031C" stroke="#7C5FC0" strokeWidth="1.2" />
            <polygon points="50,15 45,28 50,34 55,28" fill="#05010A" />

            {/* Dual Monarch eyes */}
            <circle cx="45" cy="27" r="1.5" fill="#C9B8F0" />
            <circle cx="55" cy="27" r="1.5" fill="#C9B8F0" />

            {/* Energy whiskers venting from the crown sides */}
            <path d="M45 27 Q33 22 25 32" fill="none" stroke="#C9B8F0" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
            <path d="M55 27 Q67 22 75 32" fill="none" stroke="#C9B8F0" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
          </svg>

          <div className="absolute bottom-2 left-4 font-monument tracking-[0.3em] text-[8px] text-[#9A8FB8] uppercase">
            Chosen Warrior
          </div>
          <div className="absolute top-2 right-4 font-monument tracking-[0.3em] text-[8px] text-[#C9B8F0]/60 uppercase">
            Shadow Monarch
          </div>
        </div>

        <AnimatedAvatar characterClass={currentUser.characterClass} level={currentUser.level} />

        <h3 className="text-2xl font-display font-semibold text-[#EDE6FA] mt-4 tracking-wide">
          {currentUser.displayName}
        </h3>

        {currentUser.equippedTitle && (
          <div className="mt-1 flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-monument tracking-[0.2em] text-[#C9B8F0] frost border border-[#C9B8F0]/40 uppercase flex items-center gap-1">
              🏆 {
                currentUser.equippedTitle === "first_log_badge" ? "Awakened Initiate" :
                currentUser.equippedTitle === "strength_badge" ? "C-Rank Ironfist" :
                currentUser.equippedTitle === "duration_badge" ? "Undead Survivor" :
                currentUser.equippedTitle === "cardio_badge" ? "Sprint Monarch" :
                currentUser.equippedTitle === "limit_badge" ? "Shadow Berserker" :
                currentUser.equippedTitle === "level_badge" ? "Shadow Sovereign" :
                currentUser.equippedTitle
              }
            </span>
          </div>
        )}
        
        {/* Rank indicator */}
        <div className="mt-1 flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-monument tracking-[0.2em] frost border border-[#C9B8F0]/40 text-[#C9B8F0] uppercase rounded-full">
            {rankStyle.rankName}
          </span>
        </div>

        {/* ACTIVE WARNING EXHAUSTED DEBUFF */}
        {currentUser.debuffActive && (
          <div className="w-full mt-4 p-3 frost border border-[#C9B8F0]/30 rounded-2xl text-left space-y-1.5">
            <div className="flex items-center gap-2 text-[#C9B8F0] font-monument tracking-[0.2em] text-xs uppercase">
              <ShieldAlert className="w-4 h-4 text-[#C9B8F0]" />
              <span>[WARNING: ACTIVE DEBUFF]</span>
            </div>
            <p className="text-[10px] text-[#C7BBE2] leading-snug">
              {currentUser.debuffReason || "Penalized for skipped workout cycle list. XP generation gains heavily restricted."}
            </p>
            <div className="flex justify-between items-center text-[9px] text-[#9A8FB8]">
              <span>PENALTY: -150 EXP Applied</span>
              <button
                onClick={handleRemoveDebuffTest}
                className="px-2 py-0.5 frost border border-white/10 rounded-full text-[#C7BBE2] hover:text-[#EDE6FA] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <p className="text-[#9A8FB8] text-xs italic max-w-sm mt-3">
          {currentUser.characterClass === "Warrior" 
            ? "A heavy fighter utilizing iron weights. Standard defense thresholds boosted."
            : currentUser.characterClass === "Mage"
            ? "Converting heavy aerobic endurance runs into high-mana defensive spells."
            : "An executioner of speed. Mastering explosive movements to slash workout timelines."}
        </p>
      </div>

      {/* Selector: Stats vs Shadow Army */}
      <div className="grid grid-cols-2 p-1 frost rounded-2xl">
        <button
          onClick={() => setSubTab("attributes")}
          className={`py-2.5 text-xs font-monument tracking-[0.2em] uppercase rounded-full transition-all cursor-pointer ${
            subTab === "attributes"
              ? "frost border border-[#C9B8F0]/40 text-[#C9B8F0]"
              : "text-[#9A8FB8] hover:text-[#C7BBE2]"
          }`}
          style={{ minHeight: "44px" }}
        >
          Hunter Stats
        </button>
        <button
          onClick={() => setSubTab("shadows")}
          className={`py-2.5 text-xs font-monument tracking-[0.2em] uppercase rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "shadows"
              ? "frost border border-[#C9B8F0]/40 text-[#C9B8F0]"
              : "text-[#9A8FB8] hover:text-[#C7BBE2]"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Skull className="w-4 h-4 text-[#C9B8F0]" />
          Shadow Army ({currentShadows.length})
        </button>
      </div>

      {/* Render subTabs */}
      {subTab === "attributes" ? (
        <>
          {/* Stats Meter list card */}
          <div className="p-6 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-5 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-display font-semibold text-[#C9B8F0] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#C9B8F0]" /> Holographic Attributes Panel
              </h4>
              {currentUser.statPoints && currentUser.statPoints > 0 ? (
                <span className="text-[10px] font-monument tracking-[0.2em] text-[#C9B8F0] frost px-2 py-0.5 border border-[#C9B8F0]/40 rounded-full uppercase">
                  {currentUser.statPoints} STAT POINTS AVAILABLE
                </span>
              ) : null}
            </div>

            {currentUser.statPoints && currentUser.statPoints > 0 ? (
              <div className="p-3 frost border border-[#C9B8F0]/30 rounded-2xl text-left space-y-1">
                <div className="text-[10px] font-monument tracking-[0.2em] text-[#C9B8F0] uppercase flex items-center gap-1">
                  [SYSTEM AWAKENING: ATTR_RESTORE]
                </div>
                <p className="text-[10.5px] font-sans text-[#C7BBE2]">
                  You have <b>{currentUser.statPoints} unallocated points</b> from the Monarch's blessing. Distribute them below to permanently maximize your physical attributes.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STR */}
              <div className={`p-3 frost rounded-2xl border ${increasedStats.STR ? "border-[#C9B8F0]/40" : "border-white/10"} flex flex-col justify-between transition-all duration-500 hover:border-[#C9B8F0]/30`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#EDE6FA] text-xs font-monument tracking-[0.15em] flex items-center gap-1.5 uppercase">
                    <Sword className="w-4 h-4 text-[#C9B8F0]" /> STR (Strength)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("STR")}
                        className="px-2 py-0.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] active:scale-95 text-[#241B3A] font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Add 1 Strength point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.STR && (
                        <span className="text-[#C9B8F0] font-semibold text-[10px] flex items-center gap-0.5">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-[#C9B8F0] font-semibold text-sm">{currentUser.stats.STR}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#15101F] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300"
                    style={{ width: `${Math.min(currentUser.stats.STR * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* AGI */}
              <div className={`p-3 frost rounded-2xl border ${increasedStats.AGI ? "border-[#C9B8F0]/40" : "border-white/10"} flex flex-col justify-between transition-all duration-500 hover:border-[#C9B8F0]/30`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#EDE6FA] text-xs font-monument tracking-[0.15em] flex items-center gap-1.5 uppercase">
                    <Compass className="w-4 h-4 text-[#C9B8F0]" /> AGI (Agility)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("AGI")}
                        className="px-2 py-0.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] active:scale-95 text-[#241B3A] font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Add 1 Agility point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.AGI && (
                        <span className="text-[#C9B8F0] font-semibold text-[10px] flex items-center gap-0.5">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-[#C9B8F0] font-semibold text-sm">{currentUser.stats.AGI}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#15101F] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300"
                    style={{ width: `${Math.min(currentUser.stats.AGI * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* END */}
              <div className={`p-3 frost rounded-2xl border ${increasedStats.END ? "border-[#C9B8F0]/40" : "border-white/10"} flex flex-col justify-between transition-all duration-500 hover:border-[#C9B8F0]/30`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#EDE6FA] text-xs font-monument tracking-[0.15em] flex items-center gap-1.5 uppercase">
                    <Shield className="w-4 h-4 text-[#C9B8F0]" /> END (Endurance)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("END")}
                        className="px-2 py-0.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] active:scale-95 text-[#241B3A] font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Add 1 Endurance point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.END && (
                        <span className="text-[#C9B8F0] font-semibold text-[10px] flex items-center gap-0.5">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-[#C9B8F0] font-semibold text-sm">{currentUser.stats.END}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#15101F] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300"
                    style={{ width: `${Math.min(currentUser.stats.END * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* VIT */}
              <div className={`p-3 frost rounded-2xl border ${increasedStats.VIT ? "border-[#C9B8F0]/40" : "border-white/10"} flex flex-col justify-between transition-all duration-500 hover:border-[#C9B8F0]/30`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#EDE6FA] text-xs font-monument tracking-[0.15em] flex items-center gap-1.5 uppercase">
                    <Heart className="w-4 h-4 text-[#C9B8F0]" /> VIT (Vitality)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("VIT")}
                        className="px-2 py-0.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] active:scale-95 text-[#241B3A] font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Add 1 Vitality point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.VIT && (
                        <span className="text-[#C9B8F0] font-semibold text-[10px] flex items-center gap-0.5">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-[#C9B8F0] font-semibold text-sm">{currentUser.stats.VIT}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#15101F] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300"
                    style={{ width: `${Math.min(currentUser.stats.VIT * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#9A8FB8] font-sans text-center">
              *Holographic coordinates update on server with logged exercise loads.
            </p>
          </div>

          {/* Collectible Badges grid cards */}
          <div className="p-6 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-5">
            <h4 className="text-sm font-display font-semibold text-[#C9B8F0] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C9B8F0]" /> Hunter Guild Licences
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badgeDefinitions.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border flex items-center gap-4 transition-all ${
                      badge.unlocked
                        ? `${badge.color}`
                        : "border-white/10 bg-[#15101F] text-[#5A5270] opacity-40 select-none"
                    }`}
                    style={{ minHeight: "44px" }}
                  >
                    <div className={`p-2.5 rounded-full border ${badge.unlocked ? "border-[#C9B8F0]/40" : "border-white/10"}`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-monument tracking-[0.15em] uppercase ${badge.unlocked ? "text-[#C9B8F0]" : "text-[#5A5270]"}`}>
                        {badge.title}
                      </span>
                      <p className="text-[10px] text-[#9A8FB8] font-sans mt-0.5 max-w-[200px] leading-snug">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-5 animate-fadeIn">
          {/* Shadow Army Sanctuary HUD */}
          <div className="p-5 frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-display font-semibold text-[#C9B8F0] flex items-center gap-2">
                <Skull className="w-5 h-5 text-[#C9B8F0]" /> Shadow Sanctuary
              </h4>
              <span className="font-monument tracking-[0.15em] text-xs text-[#C9B8F0] frost px-2 py-0.5 border border-[#C9B8F0]/40 rounded-full">
                Active Count: {currentShadows.length}
              </span>
            </div>

            <p className="text-xs text-[#9A8FB8] font-sans leading-relaxed">
              Command your extracted soldier collectibles. Tap a card to evoke their swirling void energies and hear their loyal battle cry.
            </p>

            {/* Interactive Speaker Bubble */}
            {speakerText && (
              <div className="mt-4 p-3 frost border border-[#C9B8F0]/30 rounded-2xl text-xs text-[#C7BBE2] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#C9B8F0] shrink-0" />
                <span className="italic">{speakerText}</span>
              </div>
            )}
          </div>

          {/* extraction summon simulation laboratory */}
          <div className="p-5 frost rounded-2xl space-y-4">
            <h5 className="text-[11px] font-monument tracking-[0.2em] text-[#C9B8F0] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C9B8F0]" /> Monarch Command Laboratory
            </h5>

            {ariseSimulating ? (
              <div className="p-8 border border-[#C9B8F0]/30 bg-[#15101F] rounded-2xl text-center space-y-3">
                <Skull className="w-12 h-12 text-[#C9B8F0] mx-auto" />
                <h6 className="text-lg font-display font-semibold text-[#C9B8F0] tracking-wide">
                  ARISE...
                </h6>
                <p className="text-[10px] text-[#9A8FB8] font-sans">
                  Reanimating Shadow Matrix... Extracting soul from Boss Workout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {SHADOWS_DECK.map((shad) => {
                  const isOwned = currentShadows.includes(shad.id);
                  return (
                    <button
                      key={shad.id}
                      onClick={() => isOwned ? handleSummonShadowSpeech(shad) : handleExtractArise(shad.id)}
                      className={`p-3 rounded-2xl flex flex-col items-stretch text-left transition-all ${
                        isOwned
                          ? "frost border border-[#C9B8F0]/40 cursor-pointer hover:border-[#C9B8F0]/60"
                          : "bg-[#15101F] border border-white/10 text-[#9A8FB8] hover:border-[#C9B8F0]/20 cursor-pointer"
                      }`}
                      style={{ minHeight: "44px" }}
                    >
                      <div className="flex justify-between items-center text-[10px] font-monument tracking-[0.1em]">
                        <span className={isOwned ? "text-[#C9B8F0]" : "text-[#9A8FB8]"}>
                          {shad.rank}
                        </span>
                        {isOwned && <span className="text-[#C9B8F0] uppercase">Ready</span>}
                      </div>
                      <span className={`text-xs font-display font-semibold block mt-1 ${isOwned ? "text-[#EDE6FA]" : "text-[#5A5270]"}`}>
                        {shad.name}
                      </span>
                      <span className="text-[9px] text-[#9A8FB8] mt-0.5 truncate block">
                        {isOwned ? "Click to Command" : "Command Arise!"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

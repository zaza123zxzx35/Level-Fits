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
    color: "from-slate-900 to-slate-800 border-slate-600 shadow-slate-500/10",
  },
  {
    id: "tank",
    name: "Tank",
    title: "Shadow Ice Bear",
    rank: "B-Rank",
    desc: "A colossal beast reanimated from the cold. Tremendous physical charging power.",
    quote: "🐻 ROOOAARRRR! (Shakes the entire system screen with frosty, shadow claws!)",
    color: "from-blue-990 to-slate-900 border-cyan-800 shadow-cyan-500/20",
  },
  {
    id: "iron",
    name: "Iron",
    title: "Heavy Shield Knight",
    rank: "A-Rank",
    desc: "Enthusiastic heavy heavy-lifter. Taunts foes with shield beats. Reanimated from a fallen guild member.",
    quote: "💥 HAHAHA! (Beats his massive steel shield while roaring at the top of his lungs!)",
    color: "from-indigo-950 to-slate-900 border-indigo-700 shadow-indigo-505/25",
  },
  {
    id: "igris",
    name: "Igris blood-red",
    title: "Commander Knight",
    rank: "A-Rank",
    desc: "The legendary red-knighted warrior. Wields a colossal zweihander sword with master precision.",
    quote: "⚔️ (Silently kneels, resting his sword point on the iron floor in total obedience)",
    color: "from-rose-950 to-slate-900 border-rose-800/80 shadow-rose-500/35",
  },
  {
    id: "tusk",
    name: "Tusk",
    title: "High Orc Shaman",
    rank: "S-Rank",
    desc: "A spellcaster wielding gravity manipulation and colossal high-tier shadow fireballs.",
    quote: "🔥 Pyromancy Ritual! (Swings his dragon-head staff, lighting up the screen in dark purple fire!)",
    color: "from-violet-950 to-purple-900 border-purple-500 shadow-purple-500/40",
  },
  {
    id: "beru",
    name: "Beru",
    title: "Ant King General",
    rank: "S-Rank",
    desc: "The absolute pinnacle of speed and raw hunger. Unmatched absolute loyalty to the Monarch.",
    quote: "👑 MY KIINNGGG! WOULD YOU LIKE ME TO DEVOUR AND SLAUGHTER ALL WHO STAND BEFORE YOU?",
    color: "from-[#023E5A] to-[#0A0D1A] border-cyan-400 shadow-cyan-400/50",
  },
  {
    id: "bellion",
    name: "Bellion",
    title: "Grand Marshal",
    rank: "S-Rank",
    desc: "The ultimate commander of the shadow host. Wields a giant snake-like segmented iron blade.",
    quote: "🌀 (Stands tall as a tower, wings of deep purple shade folding with heavy armor resonance)",
    color: "from-slate-950 to-[#10012A] border-yellow-550 shadow-yellow-500/40",
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
      color: "text-blue-400 bg-blue-950/40 border-blue-900/40",
      unlocked: true
    },
    {
      id: "iron_badge",
      title: "Titan of Iron",
      desc: "Logged 3 intense heavy strength workouts to raise core skeletal integrity.",
      icon: Sword,
      color: "text-rose-400 bg-rose-950/40 border-rose-900/40",
      unlocked: strengthCount >= 3
    },
    {
      id: "runner_badge",
      title: "Shadow Swiftness",
      desc: "Completed 3 heart-rate elevated cardio exercises.",
      icon: Flame,
      color: "text-orange-400 bg-orange-950/40 border-orange-900/30",
      unlocked: cardioCount >= 3
    },
    {
      id: "streak_badge",
      title: "C-Rank Firekeeper",
      desc: "Logged a 3-day hot training streak to avoid systems penalty zone.",
      icon: Trophy,
      color: "text-yellow-400 bg-yellow-950/40 border-yellow-900/30",
      unlocked: currentUser.streak >= 3
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Central Portrait card & Holographic Window */}
      <div className={`p-6 bg-gradient-to-b ${rankStyle.skinClass} border-2 ${rankStyle.borderColor} rounded-2xl flex flex-col items-center text-center shadow-2xl relative transition-all duration-300 overflow-hidden`}>
        {/* Dynamic Holographic Scanner Overlay lines */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-400/20 shadow-[0_0_10px_#00C8FF] animate-bounce pointer-events-none" />
        <div className="absolute right-3 top-3 px-2 py-0.5 font-mono text-[9px] text-[#00C8FF] bg-cyan-950/40 border border-[#00C8FF]/30 rounded">
          SYSTEM_HUD_v4.20
        </div>

        {/* Large warrior silhouette SVG with animated purple aura pulsing behind */}
        <div className="relative w-full h-56 bg-slate-950/90 border border-purple-500/25 rounded-2xl overflow-hidden flex items-center justify-center my-4 shadow-inner">
          {/* Intense Purple Aura pulsing in waves */}
          <div className="absolute w-44 h-44 bg-[#7B2FBE] rounded-full blur-[40px] opacity-35 animate-[glowingPulse_3.5s_ease-in-out_infinite]" />
          
          {/* Swirling particle/ember rings for aura effect */}
          <div className="absolute w-40 h-40 border border-dashed border-purple-500/30 rounded-full animate-[spin_12s_linear_infinite]" />
          <div className="absolute w-32 h-32 border border-dotted border-cyan-400/25 rounded-full animate-[spin_8s_linear_infinite_reverse]" />

          {/* Geometric shadow warrior silhouette */}
          <svg viewBox="0 0 100 120" className="h-full w-auto z-10 filter drop-shadow-[0_0_12px_#7B2FBE]">
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
            <polygon points="35,46 22,54 28,68 38,58" fill="#150625" stroke="#7B2FBE" strokeWidth="0.8" />
            <polygon points="65,46 78,54 72,68 62,58" fill="#150625" stroke="#7B2FBE" strokeWidth="0.8" />

            {/* Sharp chest plate segments */}
            <polygon points="50,48 42,66 50,78 58,66" fill="#0A0214" stroke="#7B2FBE" strokeWidth="1" />
            
            {/* Helm of the Shadow Monarch */}
            <path d="M42,42 Q30,30 40,16 L50,10 L60,16 Q70,30 58,42 Z" fill="#0F031C" stroke="#7B2FBE" strokeWidth="1.2" />
            <polygon points="50,15 45,28 50,34 55,28" fill="#05010A" />

            {/* Dual glowing Monarch eyes */}
            <circle cx="45" cy="27" r="1.5" fill="#00D4FF" className="animate-pulse" />
            <circle cx="55" cy="27" r="1.5" fill="#00D4FF" className="animate-pulse" />
            
            {/* Energy whiskers venting from the crown sides */}
            <path d="M45 27 Q33 22 25 32" fill="none" stroke="#00D4FF" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
            <path d="M55 27 Q67 22 75 32" fill="none" stroke="#00D4FF" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
          </svg>

          {/* Cyber hud coordinates running in overlay */}
          <div className="absolute bottom-2 left-4 font-mono text-[8px] text-gray-500 tracking-wider">
            GRID_REF: 81-Z / CHOSEN_WARRIOR
          </div>
          <div className="absolute top-2 right-4 font-mono text-[8px] text-purple-400 font-extrabold tracking-widest animate-pulse">
            SHADOW_MONARCH_ACTIVE
          </div>
        </div>

        <AnimatedAvatar characterClass={currentUser.characterClass} level={currentUser.level} />

        <h3 className="text-2xl font-black text-white mt-4 font-sans tracking-wide">
          {currentUser.displayName}
        </h3>

        {currentUser.equippedTitle && (
          <div className="mt-1 flex justify-center">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black text-amber-400 bg-amber-950/50 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)] uppercase tracking-wider animate-pulse flex items-center gap-1">
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
          <span className={`px-3 py-1 text-xs font-mono font-black border uppercase rounded-full tracking-wide ${rankStyle.badgeBg} ${rankStyle.glowClass}`}>
            {rankStyle.rankName}
          </span>
        </div>

        {/* ACTIVE WARNING EXHAUSTED DEBUFF */}
        {currentUser.debuffActive && (
          <div className="w-full mt-4 p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-left space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-black uppercase">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>[WARNING: ACTIVE DEBUFF]</span>
            </div>
            <p className="text-[10px] font-sans text-red-200 leading-snug">
              {currentUser.debuffReason || "Penalized for skipped workout cycle list. XP generation gains heavily restricted."}
            </p>
            <div className="flex justify-between items-center text-[9px] font-mono text-red-400">
              <span>PENALTY: -150 EXP Applied</span>
              <button 
                onClick={handleRemoveDebuffTest}
                className="px-2 py-0.5 bg-red-900 border border-red-500 rounded text-white hover:bg-red-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <p className="text-gray-400 text-xs italic font-sans max-w-sm mt-3">
          {currentUser.characterClass === "Warrior" 
            ? "A heavy fighter utilizing iron weights. Standard defense thresholds boosted."
            : currentUser.characterClass === "Mage"
            ? "Converting heavy aerobic endurance runs into high-mana defensive spells."
            : "An executioner of speed. Mastering explosive movements to slash workout timelines."}
        </p>
      </div>

      {/* Selector: Stats vs Shadow Army */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
        <button
          onClick={() => setSubTab("attributes")}
          className={`py-2.5 text-xs font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            subTab === "attributes"
              ? "bg-[#003B5C]/35 border border-[#00C8FF]/35 text-[#00C8FF] shadow-[0_0_10px_rgba(0,200,255,0.2)]"
              : "text-gray-500 hover:text-gray-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          Hunter Stats
        </button>
        <button
          onClick={() => setSubTab("shadows")}
          className={`py-2.5 text-xs font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "shadows"
              ? "bg-[#1E0530]/40 border border-purple-500/35 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] animate-pulse"
              : "text-gray-500 hover:text-gray-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Skull className="w-4 h-4 text-purple-400" />
          Shadow Army ({currentShadows.length})
        </button>
      </div>

      {/* Render subTabs */}
      {subTab === "attributes" ? (
        <>
          {/* Stats Meter list card */}
          <div className="p-6 bg-[#0B0F1A]/95 border border-[#00C8FF]/15 rounded-2xl shadow-xl space-y-5 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black text-[#00C8FF] uppercase font-mono tracking-widest flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#00C8FF]" /> Holographic Attributes Panel
              </h4>
              {currentUser.statPoints && currentUser.statPoints > 0 ? (
                <span className="text-[10px] font-mono text-green-400 bg-green-950/60 px-2 py-0.5 border border-green-500/30 rounded-full font-black uppercase tracking-widest animate-pulse">
                  {currentUser.statPoints} STAT POINTS AVAILABLE
                </span>
              ) : null}
            </div>

            {currentUser.statPoints && currentUser.statPoints > 0 ? (
              <div className="p-3 bg-gradient-to-r from-green-950/40 to-[#0A1E14] border border-green-500/30 rounded-xl text-left space-y-1 animate-[flicker_1.5s_infinite]">
                <div className="text-[10px] font-black font-mono text-green-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping mr-1" />
                  [SYSTEM AWAKENING: ATTR_RESTORE]
                </div>
                <p className="text-[10.5px] font-sans text-green-100">
                  You have <b>{currentUser.statPoints} unallocated points</b> from the Monarch's blessing. Distribute them below to permanently maximize your physical attributes.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STR */}
              <div className={`p-3 bg-slate-950/60 rounded-xl border ${increasedStats.STR ? "border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)] animate-pulse" : "border-rose-500/20"} flex flex-col justify-between transition-all duration-500 hover:border-rose-500/45`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-xs font-black font-mono flex items-center gap-1.5 uppercase">
                    <Sword className="w-4 h-4 text-rose-500" /> STR (Strength)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("STR")}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-mono font-black text-xs rounded border border-green-400/40 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold"
                        title="Add 1 Strength point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.STR && (
                        <span className="text-green-400 font-extrabold text-[10px] animate-bounce flex items-center gap-0.5 font-mono">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-rose-400 font-mono font-black text-sm">{currentUser.stats.STR}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full ${increasedStats.STR ? 'bg-green-500' : 'bg-rose-500'} transition-all duration-300`}
                    style={{ width: `${Math.min(currentUser.stats.STR * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* AGI */}
              <div className={`p-3 bg-slate-950/60 rounded-xl border ${increasedStats.AGI ? "border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)] animate-pulse" : "border-cyan-500/20"} flex flex-col justify-between transition-all duration-500 hover:border-cyan-500/45`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-xs font-black font-mono flex items-center gap-1.5 uppercase">
                    <Compass className="w-4 h-4 text-blue-400" /> AGI (Agility)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("AGI")}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-mono font-black text-xs rounded border border-green-400/40 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold"
                        title="Add 1 Agility point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.AGI && (
                        <span className="text-green-400 font-extrabold text-[10px] animate-bounce flex items-center gap-0.5 font-mono">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-[#00C8FF] font-mono font-black text-sm">{currentUser.stats.AGI}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full ${increasedStats.AGI ? 'bg-green-500' : 'bg-[#00C8FF]'} transition-all duration-300`}
                    style={{ width: `${Math.min(currentUser.stats.AGI * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* END */}
              <div className={`p-3 bg-slate-950/60 rounded-xl border ${increasedStats.END ? "border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)] animate-pulse" : "border-amber-500/20"} flex flex-col justify-between transition-all duration-500 hover:border-amber-500/45`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-xs font-black font-mono flex items-center gap-1.5 uppercase">
                    <Shield className="w-4 h-4 text-amber-500" /> END (Endurance)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("END")}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-mono font-black text-xs rounded border border-green-400/40 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold"
                        title="Add 1 Endurance point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.END && (
                        <span className="text-green-400 font-extrabold text-[10px] animate-bounce flex items-center gap-0.5 font-mono">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-amber-500 font-mono font-black text-sm">{currentUser.stats.END}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full ${increasedStats.END ? 'bg-green-500' : 'bg-amber-500'} transition-all duration-300`}
                    style={{ width: `${Math.min(currentUser.stats.END * 2.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* VIT */}
              <div className={`p-3 bg-slate-950/60 rounded-xl border ${increasedStats.VIT ? "border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)] animate-pulse" : "border-purple-500/20"} flex flex-col justify-between transition-all duration-500 hover:border-purple-500/45`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-xs font-black font-mono flex items-center gap-1.5 uppercase">
                    <Heart className="w-4 h-4 text-purple-400" /> VIT (Vitality)
                  </span>
                  <div className="flex items-center gap-2">
                    {onAllocateStat && currentUser.statPoints && currentUser.statPoints > 0 ? (
                      <button
                        onClick={() => onAllocateStat("VIT")}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-mono font-black text-xs rounded border border-green-400/40 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold"
                        title="Add 1 Vitality point"
                        style={{ minWidth: "24px", minHeight: "24px" }}
                      >
                        +
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {increasedStats.VIT && (
                        <span className="text-green-400 font-extrabold text-[10px] animate-bounce flex items-center gap-0.5 font-mono">
                          ▲ UP
                        </span>
                      )}
                      <span className="text-purple-400 font-mono font-black text-sm">{currentUser.stats.VIT}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full ${increasedStats.VIT ? 'bg-green-500' : 'bg-purple-500'} transition-all duration-300`}
                    style={{ width: `${Math.min(currentUser.stats.VIT * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 font-mono text-center">
              *Holographic coordinates update on server with logged exercise loads.
            </p>
          </div>

          {/* Collectible Badges grid cards */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-5">
            <h4 className="text-sm font-black text-yellow-500 uppercase font-mono tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Hunter Guild Licences
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badgeDefinitions.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border flex items-center gap-4 transition-all ${
                      badge.unlocked
                        ? `${badge.color} bg-slate-950/80`
                        : "border-slate-800/40 bg-slate-950/20 opacity-30 select-none grayscale"
                    }`}
                    style={{ minHeight: "44px" }}
                  >
                    <div className={`p-2.5 rounded-full border ${badge.unlocked ? "border-yellow-500/30" : "border-slate-800"}`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="font-mono text-left">
                      <span className={`text-xs font-black uppercase ${badge.unlocked ? "text-white" : "text-gray-600"}`}>
                        {badge.title}
                      </span>
                      <p className="text-[10px] text-gray-400 font-sans mt-0.5 max-w-[200px] leading-snug">
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
          <div className="p-5 bg-gradient-to-br from-[#120021] to-[#0D0D1A] border-2 border-purple-500/20 rounded-2xl relative shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-purple-400 font-mono uppercase tracking-widest flex items-center gap-2">
                <Skull className="w-5 h-5 animate-pulse" /> Shadow Sanctuary
              </h4>
              <span className="font-mono text-xs text-purple-300 bg-purple-950/80 px-2 py-0.5 border border-purple-500/30 rounded">
                Active Count: {currentShadows.length}
              </span>
            </div>

            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Command your extracted soldier collectibles. Tap a card to evoke their swirling void energies and hear their loyal battle cry.
            </p>

            {/* Interactive Speaker Bubble */}
            {speakerText && (
              <div className="mt-4 p-3 bg-purple-950/70 border border-purple-500/30 rounded-xl text-xs font-mono text-purple-200 animate-slideUp flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#00C8FF] shrink-0" />
                <span className="italic">{speakerText}</span>
              </div>
            )}
          </div>

          {/* extraction summon simulation laboratory */}
          <div className="p-5 bg-slate-950 border border-purple-800/40 rounded-2xl space-y-4">
            <h5 className="text-[11px] font-black font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Monarch Command Laboratory
            </h5>

            {ariseSimulating ? (
              <div className="p-8 border border-dashed border-purple-500 bg-purple-950/20 rounded-xl text-center space-y-3">
                <Skull className="w-12 h-12 text-[#00C8FF] mx-auto animate-spin" />
                <h6 className="text-lg font-black text-purple-300 uppercase tracking-widest font-mono animate-pulse">
                  ARISE...
                </h6>
                <p className="text-[10px] text-gray-400 font-mono">
                  Reanimating Shadow Matrix... Extracting soul from Boss Workout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 font-mono">
                {SHADOWS_DECK.map((shad) => {
                  const isOwned = currentShadows.includes(shad.id);
                  return (
                    <button
                      key={shad.id}
                      onClick={() => isOwned ? handleSummonShadowSpeech(shad) : handleExtractArise(shad.id)}
                      className={`p-3 border rounded-xl flex flex-col items-stretch text-left transition-all ${
                        isOwned 
                          ? "bg-gradient-to-br from-purple-950/80 to-slate-900 border-purple-500/45 cursor-pointer hover:border-purple-400" 
                          : "bg-slate-950 border-slate-800 text-gray-500 hover:border-purple-800/30 cursor-pointer"
                      }`}
                      style={{ minHeight: "44px" }}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className={isOwned ? "text-purple-300" : "text-gray-500"}>
                          {shad.rank}
                        </span>
                        {isOwned && <span className="text-[#00C8FF] uppercase">Ready</span>}
                      </div>
                      <span className={`text-xs font-black block mt-1 ${isOwned ? "text-white" : "text-gray-600 font-normal"}`}>
                        {shad.name}
                      </span>
                      <span className="text-[9px] text-gray-500 mt-0.5 truncate block">
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

      {/* Cyber animated styles */}
      <style>{`
        @keyframes glowingPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}

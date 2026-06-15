import React, { useState, useEffect } from "react";
import { UserProfile, WorkoutLog, Quest } from "../types";
import { 
  Dumbbell, 
  Flame, 
  Award, 
  Star, 
  History, 
  Sparkles, 
  Clock, 
  Sword, 
  ShieldAlert, 
  Activity, 
  Zap,
  CheckCircle,
  TrendingUp,
  Skull,
  Terminal
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getHunterRank, RANK_METADATA } from "../utils/rankUtils";

interface HomeOverviewProps {
  currentUser: UserProfile;
  workoutHistory: WorkoutLog[];
  quests: Quest[];
  onNavigateToTab: (tab: "workout" | "character" | "leaderboard" | "profile") => void;
}

interface GuildBoss {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  status: "active" | "defeated";
}

interface DungeonGate {
  rank: "E" | "D" | "C" | "B" | "A" | "S";
  title: string;
  goalMinutes: number;
  goalCategory: string;
  secondsLeft: number;
  active: boolean;
  claimed: boolean;
}

export function HomeOverview({ currentUser, workoutHistory, quests, onNavigateToTab }: HomeOverviewProps) {
  const nextLevelXpLimit = 1000;
  const progressPercentage = Math.min((currentUser.xp / nextLevelXpLimit) * 100, 100);

  const hunterRank = getHunterRank(currentUser.level);
  const rankStyle = RANK_METADATA[hunterRank];

  // Guild Boss State
  const [boss, setBoss] = useState<GuildBoss>({
    name: "Baran, Demon King of the White Flame",
    hp: 124500,
    maxHp: 150000,
    level: 75,
    status: "active"
  });

  const [lastStrikeLog, setLastStrikeLog] = useState<string | null>(null);
  const [strikeVibrate, setStrikeVibrate] = useState(false);

  // Dungeon Gate State
  const [gate, setGate] = useState<DungeonGate>({
    rank: "B",
    title: "Sovereign Ice Elf Gate",
    goalMinutes: 15,
    goalCategory: "Cardio",
    secondsLeft: 1800, // 30 minutes
    active: true,
    claimed: false
  });

  const [showSystemWindow, setShowSystemWindow] = useState(true);

  // Load persistently from Firestore or localStorage Fallback
  useEffect(() => {
    if (!currentUser) return;

    const loadSoloLevelingStates = async () => {
      try {
        if (currentUser.uid.startsWith("guest_")) {
          // Load guest boss details
          const localBoss = localStorage.getItem(`guildBoss_${currentUser.uid}`);
          if (localBoss) {
            setBoss(JSON.parse(localBoss) as GuildBoss);
          } else {
            const defaultBoss: GuildBoss = {
              name: "Antares, Monarch of Destruction",
              hp: 84250,
              maxHp: 100000,
              level: 90,
              status: "active"
            };
            setBoss(defaultBoss);
            localStorage.setItem(`guildBoss_${currentUser.uid}`, JSON.stringify(defaultBoss));
          }

          // Load guest active gate details
          const localGate = localStorage.getItem(`activeGate_${currentUser.uid}`);
          if (localGate) {
            setGate(JSON.parse(localGate) as DungeonGate);
          } else {
            const defaultGate: DungeonGate = {
              rank: "B",
              title: "Red Dragon Gate",
              goalMinutes: 20,
              goalCategory: "Strength",
              secondsLeft: 1500,
              active: true,
              claimed: false
            };
            setGate(defaultGate);
            localStorage.setItem(`activeGate_${currentUser.uid}`, JSON.stringify(defaultGate));
          }
          return;
        }

        const bossRef = doc(db, `users/${currentUser.uid}/soloLeveling`, "guildBoss");
        const bossSnap = await getDoc(bossRef);
        if (bossSnap.exists()) {
          setBoss(bossSnap.data() as GuildBoss);
        } else {
          // Initialize boss index
          const initialBoss: GuildBoss = {
            name: "Antares, Monarch of Destruction",
            hp: 84250,
            maxHp: 100000,
            level: 90,
            status: "active"
          };
          await setDoc(bossRef, initialBoss);
          setBoss(initialBoss);
        }

        const gateRef = doc(db, `users/${currentUser.uid}/soloLeveling`, "activeGate");
        const gateSnap = await getDoc(gateRef);
        if (gateSnap.exists()) {
          setGate(gateSnap.data() as DungeonGate);
        } else {
          // Initialize starter gate
          const initialGate: DungeonGate = {
            rank: "B",
            title: "Red Dragon Gate",
            goalMinutes: 20,
            goalCategory: "Strength",
            secondsLeft: 1500,
            active: true,
            claimed: false
          };
          await setDoc(gateRef, initialGate);
          setGate(initialGate);
        }
      } catch (e) {
        console.error("Failed to sync Solo Leveling Firestore metadata", e);
      }
    };

    loadSoloLevelingStates();
  }, [currentUser?.uid]);

  // Dungeon Gate ticking countdown
  useEffect(() => {
    if (!gate.active || gate.secondsLeft <= 0) return;

    const interval = setInterval(async () => {
      setGate(prev => {
        const newSecs = prev.secondsLeft - 1;
        if (newSecs <= 0) {
          const expiredGate = { ...prev, secondsLeft: 0, active: false };
          if (currentUser.uid.startsWith("guest_")) {
            localStorage.setItem(`activeGate_${currentUser.uid}`, JSON.stringify(expiredGate));
          } else {
            const gateRef = doc(db, `users/${currentUser.uid}/soloLeveling`, "activeGate");
            updateDoc(gateRef, { active: false, secondsLeft: 0 }).catch(() => {});
          }
          return expiredGate;
        }
        return { ...prev, secondsLeft: newSecs };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gate.active, gate.secondsLeft, currentUser?.uid]);

  // Slash Guild Boss logic
  const handleStrikeBoss = async () => {
    if (boss.hp <= 0) return;
    setStrikeVibrate(true);

    const damage = Math.floor(Math.random() * 850) + 400 + (currentUser.stats.STR * 15);
    const newHp = Math.max(boss.hp - damage, 0);

    setLastStrikeLog(`CRITICAL DOUBLE SLASH! Handled -${damage.toLocaleString()} DMG!`);

    const updatedBoss: GuildBoss = {
      ...boss,
      hp: newHp,
      status: newHp <= 0 ? "defeated" : "active"
    };
    setBoss(updatedBoss);

    // Save persistent Boss state
    try {
      if (currentUser.uid.startsWith("guest_")) {
        localStorage.setItem(`guildBoss_${currentUser.uid}`, JSON.stringify(updatedBoss));
      } else {
        const bossRef = doc(db, `users/${currentUser.uid}/soloLeveling`, "guildBoss");
        await setDoc(bossRef, updatedBoss);
      }

      // Trigger standard Speech synthesis strike sound
      try {
        const strikeSpeech = new SpeechSynthesisUtterance("Slash!");
        strikeSpeech.pitch = 0.6;
        strikeSpeech.rate = 1.3;
        window.speechSynthesis.speak(strikeSpeech);
      } catch(e){}
    } catch (e) {}

    setTimeout(() => {
      setStrikeVibrate(false);
    }, 400);
  };

  // Safe scanner to generate a fresh random gate to try!
  const handleScanForGates = async () => {
    const categories = ["Cardio", "Strength", "Endurance", "Flexibility"];
    const names = ["Double Dungeon Entrance", "Ant Crown Gate", "Elven Shadow Forest", "Kargalgan Shrine"];
    const ranks = ["E", "D", "C", "B", "A", "S"] as const;

    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomMins = Math.floor(Math.random() * 20) + 10;

    const freshGate: DungeonGate = {
      rank: randomRank,
      title: `${randomRank}-Rank ${randomName}`,
      goalMinutes: randomMins,
      goalCategory: randomCategory,
      secondsLeft: 1800,
      active: true,
      claimed: false
    };

    setGate(freshGate);

    try {
      if (currentUser.uid.startsWith("guest_")) {
        localStorage.setItem(`activeGate_${currentUser.uid}`, JSON.stringify(freshGate));
      } else {
        const gateRef = doc(db, `users/${currentUser.uid}/soloLeveling`, "activeGate");
        await setDoc(gateRef, freshGate);
      }

      // System notification voice
      try {
        const speak = new SpeechSynthesisUtterance("Emergency. A gate has appeared in your sector.");
        speak.pitch = 0.5;
        window.speechSynthesis.speak(speak);
      } catch(e){}
    } catch(e){}
  };

  // Filter latest 3 logged workouts
  const recentWorkouts = [...workoutHistory]
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 3);

  // Filter active uncompleted quests
  const activeQuests = quests.filter(q => !q.completed).slice(0, 2);

  // Convert seconds to readable MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="space-y-6">
      
      {/* SYSTEM HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C9B8F0]" />
          <h2 className="font-monument tracking-[0.3em] uppercase text-[#C9B8F0]/60 text-xs flex items-center">
            ACTIVE SYSTEM INTERFACE
          </h2>
        </div>
        <span className="font-monument tracking-[0.3em] uppercase text-[#C9B8F0]/60 text-[9px] px-2 py-0.5 border border-white/10 rounded h-5 flex items-center">
          HUNTER_LINK: ONLINE
        </span>
      </div>

      {/* level character gauge block */}
      <div className={`p-6 bg-gradient-to-r ${rankStyle.skinClass} border-2 ${rankStyle.borderColor} rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9B8F0]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-1">
          <div>
            <div className="flex justify-between items-center mr-1">
              <span className="font-monument tracking-[0.3em] uppercase text-[#C9B8F0]/60 text-[10px] block">Monarch Rank HUD</span>
              <button
                onClick={() => setShowSystemWindow(true)}
                className="px-2 py-0.5 text-[9px] frost text-[#C9B8F0] rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                style={{ minHeight: "24px" }}
              >
                <Terminal className="w-3 h-3" /> SYSTEM INTERFACE
              </button>
            </div>
            <h3 className="text-2xl font-display font-semibold text-[#EDE6FA]">{currentUser.displayName}</h3>
          </div>
          <div className="text-right">
            <span className="text-[#C9B8F0] text-2xl font-display font-semibold block">Level {currentUser.level}</span>
            <span className="text-[10px] uppercase text-[#9A8FB8] font-bold block">{currentUser.characterClass}</span>
          </div>
        </div>

        {/* XP Gauge Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#C9B8F0] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Experience Progress
            </span>
            <span className="text-[#C9B8F0] font-semibold">
              {currentUser.xp} / {nextLevelXpLimit} XP
            </span>
          </div>

          <div className="h-3 w-full bg-[#15101F] rounded-full border border-white/10 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-[9px] text-[#9A8FB8] text-right">
            CURRENT HUNTER: {hunterRank}-RANK SPECIALTY
          </p>
        </div>
      </div>

      {/* GUILD RAID BOSS STATUS WIDGET */}
      <div className="p-5 frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-monument tracking-[0.3em] uppercase text-rose-300/80 text-[9px] block">
              WEEKLY GUILD RAID EVENT
            </span>
            <h4 className="text-sm font-display font-semibold text-[#EDE6FA] tracking-tight">
              {boss.name}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-rose-300/80 font-semibold text-xs block">LEVEL {boss.level}</span>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="space-y-1 mt-3">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-rose-300/80">HP Gauge ({Math.floor((boss.hp / boss.maxHp) * 100)}%)</span>
            <span className="text-rose-300/80 font-semibold">{boss.hp.toLocaleString()} / {boss.maxHp.toLocaleString()} HP</span>
          </div>
          <div className="h-4 w-full bg-[#15101F] border border-white/10 rounded-lg overflow-hidden relative">
            <div
              className={`h-full bg-gradient-to-r from-rose-800 to-rose-500 transition-all duration-300 ${strikeVibrate ? "scale-y-110 brightness-125" : ""}`}
              style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
            />
          </div>
        </div>

        {lastStrikeLog && (
          <div className="mt-3 p-2 frost border border-rose-500/30 rounded-lg text-rose-300/80 text-[10px] text-center animate-slideUp">
            {lastStrikeLog}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleStrikeBoss}
            disabled={boss.hp <= 0}
            className="flex-1 py-2 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold uppercase text-xs tracking-wider rounded-full transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            <Sword className="w-4 h-4" /> Strike Boss
          </button>

          <button
            onClick={() => onNavigateToTab("leaderboard")}
            className="px-3.5 frost rounded-full text-[#C7BBE2] hover:text-[#EDE6FA] transition-colors cursor-pointer"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            Guild Leaders
          </button>
        </div>
      </div>

      {/* TIME-LIMITED DUNGEON GATE WARNING */}
      {gate.active && (
        <div className="p-5 frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute -top-1 right-3 px-2 py-0.5 bg-[#B9A3E3] text-[#241B3A] text-[9px] font-monument tracking-[0.2em] uppercase rounded">
            ALERT: EMERGENCY DUNGEON
          </div>

          <div className="flex justify-between items-center mb-1 col-span-2">
            <span className="text-[#C9B8F0] text-xs font-display font-semibold tracking-wider">
              {gate.title}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#C9B8F0] font-semibold frost px-2 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {formatTimer(gate.secondsLeft)}
            </div>
          </div>

          <p className="text-[11px] text-[#9A8FB8] leading-relaxed mt-2.5">
            Clear goal: Log {gate.goalMinutes} minutes of <span className="text-[#C9B8F0] font-bold uppercase">{gate.goalCategory}</span> to clear this Dungeon Gate before it closes!
          </p>

          {/* Majestic Animated Dungeon Gate Portal (rotating rings, lavender energy core) */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
            {/* Swirling energy background blur sphere */}
            <div className="absolute inset-0 rounded-full bg-[#7C5FC0]/20 blur-xl pointer-events-none" />

            {/* Rotating outer ring */}
            <div className="absolute w-24 h-24 border-4 border-dashed border-[#C9B8F0]/30 rounded-full animate-[spin_12s_linear_infinite] pointer-events-none" />

            {/* Counter-rotating inner ring */}
            <div className="absolute w-19 h-19 border-2 border-[#C9B8F0]/30 rounded-full animate-[spin_8s_linear_infinite_reverse] pointer-events-none" />

            {/* Lavender Core Sphere with a skull */}
            <div className="absolute w-12 h-12 bg-gradient-to-r from-[#241B3A] via-[#7C5FC0] to-[#15101F] rounded-full flex items-center justify-center border border-[#C9B8F0]/30">
              <Skull className="w-5 h-5 text-[#C9B8F0]" strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center frost p-2 rounded-xl text-[10px]">
            <span className="text-[#9A8FB8]">EXP Reward: <b className="text-[#C9B8F0]">+400 XP</b></span>
            <span className="text-[#9A8FB8]">Loot: <b className="text-[#C9B8F0]">Exclusive Shadow Soldier</b></span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigateToTab("workout")}
              className="py-2 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold text-xs tracking-wider uppercase rounded-full transition-all cursor-pointer"
              style={{ minHeight: "44px" }}
            >
              Enter Gate
            </button>
            <button
              onClick={handleScanForGates}
              className="py-2 frost text-[#C7BBE2] font-semibold text-xs tracking-wider uppercase rounded-full transition-all cursor-pointer"
              style={{ minHeight: "44px" }}
            >
              Scan for Gates
            </button>
          </div>
        </div>
      )}

      {/* Main double column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dynamic Daily quest box */}
        <div className="frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="p-5 flex flex-col justify-between h-full relative">
            <div>
              <h4 className="text-xs font-display font-semibold text-[#C9B8F0] tracking-wider flex items-center gap-2 mb-4">
                <Star className="w-3.5 h-3.5 text-[#C9B8F0]" /> DAILY SYSTEM TRIALS
              </h4>

              {activeQuests.length === 0 ? (
                <div className="text-center py-6 text-[#9A8FB8] text-xs">
                  All trials cleared. Check the next gate sector!
                </div>
              ) : (
                <div className="space-y-4">
                  {activeQuests.map((q) => {
                    const currentPct = Math.min((q.currentValue / q.targetValue) * 100, 100);
                    return (
                      <div key={q.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#C9B8F0] text-[11px] truncate max-w-[150px]">
                            {q.title}
                          </span>
                          <span className="text-[#9A8FB8] text-[10px] font-semibold">
                            {q.currentValue}/{q.targetValue}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#15101F] rounded-full border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300 relative"
                            style={{ width: `${currentPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateToTab("character")}
              className="w-full mt-6 py-2 frost text-[#C7BBE2] font-semibold uppercase text-[10px] tracking-wider transition-colors cursor-pointer rounded-full"
              style={{ minHeight: "38px" }}
            >
              System Quests Terminal
            </button>
          </div>
        </div>

        {/* Campfire Streaks quick dashboard with burning spirit fire SVG */}
        <div className="p-5 frost rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative">
          <div>
            <h4 className="text-sm font-display font-semibold text-[#C9B8F0] tracking-wider flex items-center gap-1.5 mb-4">
              <Flame className="w-4 h-4 text-[#C9B8F0]" /> SYSTEM HEURISTIC FIRE STREAK
            </h4>

            <div className="flex items-center gap-4 py-2">
              <div className="text-4xl font-display font-semibold text-[#EDE6FA] tracking-tight flex items-baseline gap-1">
                {currentUser.streak}
                <span className="text-xs uppercase text-[#9A8FB8] font-bold block">Days Hot</span>
              </div>

              {/* Curated animated Spirit Fire SVG representation */}
              <div className="ml-auto">
                <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow-[0_0_10px_rgba(201,184,240,0.4)] filter">
                  <defs>
                    <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#EA580C" />
                      <stop offset="40%" stopColor="#F97316" />
                      <stop offset="80%" stopColor="#FACC15" />
                      <stop offset="100%" stopColor="#FEF08A" />
                    </linearGradient>
                    <linearGradient id="purpleFireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#6B21A8" />
                      <stop offset="50%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                  
                  {/* Glowing flame flicker backlayer */}
                  <path 
                    d="M50 15 Q30 55 50 90 Q70 55 50 15 Z" 
                    fill="url(#purpleFireGrad)" 
                    opacity="0.32"
                    className="origin-bottom"
                    style={{ animation: "flicker 1.8s ease-in-out infinite" }}
                  />

                  {/* Main burning flame tongue */}
                  <path 
                    d="M50 25 Q35 60 50 90 Q65 60 50 25 Z" 
                    fill="url(#fireGrad)" 
                    className="origin-bottom"
                    style={{ animation: "flicker 1.2s ease-in-out infinite" }}
                  />

                  {/* Inside super-hot spark core */}
                  <path 
                    d="M50 45 Q40 68 50 90 Q60 68 50 45 Z" 
                    fill="#FFFFFF" 
                    opacity="0.82"
                    className="origin-bottom"
                    style={{ animation: "flicker 0.8s ease-in-out infinite reverse" }}
                  />

                  {/* Embers floating upward shapes */}
                  <circle cx="42" cy="52" r="2" fill="#FACC15" style={{ animation: "emberFloat 2.4s ease-in-out infinite" }} />
                  <circle cx="58" cy="42" r="1.5" fill="#FEF08A" style={{ animation: "emberFloat 1.9s ease-in-out infinite 0.4s" }} />
                  <circle cx="48" cy="32" r="1" fill="#FFFFFF" style={{ animation: "emberFloat 1.4s ease-in-out infinite 0.8s" }} />
                </svg>
              </div>
            </div>
            <p className="text-[#9A8FB8] text-xs mt-1.5 leading-relaxed">
              Keep the system link active. Skipping a day triggers punishment system logs!
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab("workout")}
            className="w-full mt-6 py-2.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold uppercase text-xs tracking-wider rounded-full transition-transform cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            Start Training Ritual
          </button>
        </div>
      </div>

      {/* Recent history log feed */}
      <div className="p-5 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <h4 className="text-sm font-display font-semibold text-[#C7BBE2] uppercase tracking-widest flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#C9B8F0]" /> System Logged Clearances
        </h4>

        {recentWorkouts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-[#15101F] text-[#9A8FB8] text-xs">
            No logged rituals logged yet. Begin your ritual to record points.
          </div>
        ) : (
          <div className="space-y-3.5 divide-y divide-white/10 overflow-hidden">
            {recentWorkouts.map((workout, idx) => (
              <div key={workout.id} className={`flex justify-between items-center py-2.5 ${idx !== 0 ? "pt-3.5" : ""}`}>
                <div className="text-left">
                  <span className="text-sm font-semibold text-[#C9B8F0] block">{workout.exerciseName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-[#9A8FB8] mt-0.5 uppercase">
                    <span>{workout.category}</span>
                    <span>•</span>
                    <span>Intensity {workout.intensity}/5</span>
                    <span>•</span>
                    <span>{workout.sets > 0 ? `${workout.sets}x${workout.reps}` : `${workout.duration} mins`}</span>
                  </div>
                </div>

                <div className="text-right self-center">
                  <span className="text-[#C9B8F0] font-semibold text-xs block">+{workout.xpGained} XP</span>
                  <span className="text-[9px] text-[#9A8FB8] block font-bold">
                    {new Date(workout.loggedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSystemWindow && (
        <div className="fixed inset-0 bg-[#15101F]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Frosted System Card Container */}
          <div className="relative w-full max-w-sm frost rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">

            {/* Soft lavender Tech corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#C9B8F0]/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#C9B8F0]/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#C9B8F0]/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#C9B8F0]/30" />

            {/* System Content */}
            <div className="relative z-10 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#C9B8F0]" />
                  <h3 className="text-sm font-display font-semibold text-[#C9B8F0] tracking-wider uppercase">
                    SYSTEM ALERT HUD
                  </h3>
                </div>
                <span className="font-monument tracking-[0.3em] uppercase text-[#C9B8F0]/60 text-[8px] px-1.5 py-0.5 border border-white/10 rounded">
                  SYS_V2.10
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-[#C7BBE2] leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-[#C9B8F0] font-semibold">&gt;&gt;</span>
                  <p>USER LINK CONFIRMED. RITUAL STATUS STABLE.</p>
                </div>
                {gate.active && (
                  <div className="flex gap-2 text-[#C9B8F0]">
                    <span className="text-[#C9B8F0] font-semibold">&gt;&gt;</span>
                    <p className="font-semibold">EMERGENCY: ACTIVE PORTAL IS RAGING IN YOUR COORDINATES.</p>
                  </div>
                )}
                {boss.hp > 0 ? (
                  <div className="flex gap-2 text-rose-300/80">
                    <span className="text-rose-300/80 font-semibold">&gt;&gt;</span>
                    <p>GUILD MISSION: STRIP THE Demon King IN THE BOSS LOBBY.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 text-[#C9B8F0]">
                    <span className="text-[#C9B8F0] font-semibold">&gt;&gt;</span>
                    <p>CONGRATULATIONS: DEMON SOVEREIGN HAS BEEN OBLITERATED.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowSystemWindow(false)}
                  className="px-4 py-2 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] text-xs font-semibold uppercase rounded-full transition-all cursor-pointer"
                  style={{ minHeight: "40px" }}
                >
                  DISMISS OVERLAY
                </button>
              </div>
            </div>

            {/* Inner aesthetic grid elements */}
            <div className="absolute inset-2 border border-white/10 rounded-2xl pointer-events-none" />
          </div>

          {/* Injected animations */}
          <style>{`
            @keyframes flicker {
              0%, 100% { transform: scale(1) rotate(-1.5deg); }
              50% { transform: scale(1.1) rotate(2deg) skewX(2deg); }
            }
            @keyframes emberFloat {
              0% { transform: translateY(15px) scale(0.35); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateY(-40px) scale(1); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

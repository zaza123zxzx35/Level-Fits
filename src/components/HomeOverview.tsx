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
      
      {/* SYSTEM HEADER with blinking cursor */}
      <div className="flex items-center justify-between border-b border-[#00D4FF]/30 pb-3 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping" />
          <h2 className="text-xs font-black text-[#00D4FF] tracking-widest uppercase flex items-center">
            ACTIVE SYSTEM INTERFACE<span className="animate-[blink_1.1s_steps(2,start)_infinite] ml-1 bg-[#00D4FF] text-transparent select-none inline-block w-1.5 h-3.5 align-middle">|</span>
          </h2>
        </div>
        <span className="text-[9px] text-[#7B2FBE] font-bold tracking-widest uppercase bg-purple-950/40 px-2 py-0.5 border border-[#7B2FBE]/20 rounded h-5 flex items-center">
          HUNTER_LINK: ONLINE
        </span>
      </div>

      {/* level character gauge block */}
      <div className={`p-6 bg-gradient-to-r ${rankStyle.skinClass} border-2 ${rankStyle.borderColor} rounded-2xl relative shadow-2xl overflow-hidden transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-1 font-sans">
          <div>
            <div className="flex justify-between items-center mr-1">
              <span className="text-gray-400 text-[10px] font-mono uppercase tracking-widest block">Monarch Rank HUD</span>
              <button 
                onClick={() => setShowSystemWindow(true)}
                className="px-2 py-0.5 text-[9px] bg-[#002B42]/75 hover:bg-[#003B5C] text-[#00D4FF] border border-[#00D4FF]/35 rounded font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                style={{ minHeight: "24px" }}
              >
                <Terminal className="w-3 h-3" /> SYSTEM INTERFACE
              </button>
            </div>
            <h3 className="text-2xl font-black text-white">{currentUser.displayName}</h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-[#00C8FF] text-2xl font-black block">Level {currentUser.level}</span>
            <span className="text-[10px] uppercase text-purple-400 font-bold block">{currentUser.characterClass}</span>
          </div>
        </div>

        {/* XP Gauge Bar */}
        <div className="mt-5 space-y-1.5 font-mono">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#00C8FF] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Experience Progress
            </span>
            <span className="text-yellow-400 font-black">
              {currentUser.xp} / {nextLevelXpLimit} XP
            </span>
          </div>

          <div className="h-3 w-full bg-slate-950 rounded-full border border-purple-500/20 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-800 via-[#00C8FF] to-yellow-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/15 animate-pulse" />
            </div>
          </div>
          <p className="text-[9px] text-gray-500 text-right">
            CURRENT HUNTER: {hunterRank}-RANK SPECIALTY
          </p>
        </div>
      </div>

      {/* GUILD RAID BOSS STATUS WIDGET */}
      <div className="p-5 bg-gradient-to-br from-[#12040D] to-[#0A0D1A] border-2 border-red-500/30 rounded-2xl relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-red-500 text-[9px] font-mono uppercase tracking-widest block font-black">
              WEEKLY GUILD RAID EVENT
            </span>
            <h4 className="text-sm font-black text-white uppercase tracking-tight font-sans">
              {boss.name}
            </h4>
          </div>
          <div className="text-right font-mono">
            <span className="text-red-400 font-extrabold text-xs block">LEVEL {boss.level}</span>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="space-y-1 mt-3">
          <div className="flex justify-between text-[11px] font-mono font-bold">
            <span className="text-red-300">HP Gauge ({Math.floor((boss.hp / boss.maxHp) * 100)}%)</span>
            <span className="text-red-400 font-black">{boss.hp.toLocaleString()} / {boss.maxHp.toLocaleString()} HP</span>
          </div>
          <div className="h-4 w-full bg-slate-950 border border-red-950 rounded-lg overflow-hidden relative">
            <div 
              className={`h-full bg-gradient-to-r from-red-800 to-rose-500 transition-all duration-300 ${strikeVibrate ? "scale-y-110 brightness-125" : ""}`}
              style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
            />
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
          </div>
        </div>

        {lastStrikeLog && (
          <div className="mt-3 p-2 bg-red-950/45 border border-red-900/40 rounded-lg text-red-300 text-[10px] font-mono text-center animate-slideUp">
            {lastStrikeLog}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleStrikeBoss}
            disabled={boss.hp <= 0}
            className={`flex-1 py-2 bg-gradient-to-r from-red-900 to-rose-600 hover:from-red-800 hover:to-rose-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${strikeVibrate ? "scale-[1.03] shadow-[0_0_15px_#f43f5e]" : ""}`}
            style={{ minHeight: "44px" }}
          >
            <Sword className="w-4 h-4" /> Strike Boss
          </button>
          
          <button
            onClick={() => onNavigateToTab("leaderboard")}
            className="px-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-red-500/30 text-gray-400 hover:text-white transition-colors cursor-pointer"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            Guild Leaders
          </button>
        </div>
      </div>

      {/* TIME-LIMITED DUNGEON GATE WARNING */}
      {gate.active && (
        <div className="p-5 bg-gradient-to-br from-[#0F0C02] via-[#041E26] to-[#0A0D1A] border-2 border-cyan-400/30 rounded-2xl relative shadow-2xl">
          <div className="absolute -top-1 right-3 px-2 py-0.5 bg-cyan-500 text-slate-950 text-[9px] font-mono font-extrabold uppercase rounded shadow-lg animate-pulse">
            ALERT: EMERGENCY DUNGEON
          </div>

          <div className="flex justify-between items-center mb-1 col-span-2">
            <span className="text-[#00D4FF] text-xs font-mono font-black uppercase tracking-wider">
              {gate.title}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-yellow-500 font-extrabold bg-[#2B2302] border border-yellow-500/20 px-2 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5 animate-spin" /> {formatTimer(gate.secondsLeft)}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 font-sans leading-relaxed mt-2.5">
            Clear goal: Log {gate.goalMinutes} minutes of <span className="text-[#00D4FF] font-bold uppercase">{gate.goalCategory}</span> to clear this Dungeon Gate before it closes!
          </p>

          {/* Majestic Animated Dungeon Gate Portal (rotating rings, purple energy core) */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
            {/* Swirling energy background blur sphere */}
            <div className="absolute inset-0 rounded-full bg-purple-600/25 blur-xl animate-pulse pointer-events-none" />
            
            {/* Rotating Purple Dungeon Portal outer ring */}
            <div className="absolute w-24 h-24 border-4 border-dashed border-purple-500/60 rounded-full animate-[spin_12s_linear_infinite] pointer-events-none" />
            
            {/* Counter-rotating Cyan Portal inner ring */}
            <div className="absolute w-19 h-19 border-2 border-cyan-400/50 border-t-purple-650 border-b-cyan-500 rounded-full animate-[spin_8s_linear_infinite_reverse] pointer-events-none" />
            
            {/* Glowing Purple Core Sphere with a skull and pulses */}
            <div className="absolute w-12 h-12 bg-gradient-to-r from-[#120526] via-[#7B2FBE] to-[#0A0D18] rounded-full flex items-center justify-center border border-purple-400/40 shadow-[0_0_20px_#7B2FBE] animate-pulse">
              <Skull className="w-5 h-5 text-cyan-300 animate-pulse" strokeWidth={1.5} />
            </div>
            
            {/* Cyber runic overlay details */}
            <div className="absolute inset-3 border border-cyan-400/10 rounded-full pointer-events-none animate-ping opacity-10" />
          </div>

          <div className="mt-4 flex justify-between items-center bg-[#07131D] border border-[#00D4FF]/15 p-2 rounded-xl text-[10px] font-mono">
            <span className="text-gray-400">EXP Reward: <b className="text-[#00C8FF]">+400 XP</b></span>
            <span className="text-gray-400">Loot: <b className="text-yellow-400">Exclusive Shadow Soldier</b></span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigateToTab("workout")}
              className="py-2 bg-[#003B5C]/50 hover:bg-[#003B5C]/80 text-[#00C8FF] font-black border border-[#00C8FF]/30 text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              style={{ minHeight: "44px" }}
            >
              Enter Gate
            </button>
            <button
              onClick={handleScanForGates}
              className="py-2 bg-slate-950 hover:bg-slate-900 text-gray-400 font-black border border-slate-800 text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              style={{ minHeight: "44px" }}
            >
              Scan for Gates
            </button>
          </div>
        </div>
      )}

      {/* Main double column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dynamic Daily quest box styled exactly like Solo Leveling's blue hologram window */}
        <div className="relative p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-slate-950"
             style={{
               clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
               background: "linear-gradient(135deg, rgba(0, 212, 255, 0.45) 0%, rgba(123, 47, 190, 0.25) 100%)"
             }}>
          {/* Cyber Scanline animation bar for hologram */}
          <div 
            className="absolute inset-x-0 h-0.5 bg-[#00D4FF] opacity-35 pointer-events-none shadow-[0_0_10px_#00D4FF]"
            style={{
              animation: "scanLine 4s linear infinite",
            }}
          />

          <div className="p-5 bg-[#070e1b] flex flex-col justify-between h-full relative"
               style={{
                 clipPath: "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)"
               }}>
            <div>
              {/* Tech Corner Details */}
              <div className="absolute top-1 left-4 w-2 h-2 border-t border-l border-[#00D4FF]/40" />
              <div className="absolute top-1 right-2 w-2 h-2 border-t border-r border-[#00D4FF]/40" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#00D4FF]/40" />
              <div className="absolute bottom-2 right-4 w-2 h-2 border-b border-r border-[#00D4FF]/40" />

              <h4 className="text-xs font-black text-[#00D4FF] font-mono uppercase tracking-widest flex items-center gap-2 mb-4">
                <Star className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" /> DAILY SYSTEM TRIALS
              </h4>

              {activeQuests.length === 0 ? (
                <div className="text-center py-6 text-gray-400 font-mono text-xs">
                  All trials cleared. Check the next gate sector!
                </div>
              ) : (
                <div className="space-y-4">
                  {activeQuests.map((q) => {
                    const currentPct = Math.min((q.currentValue / q.targetValue) * 100, 100);
                    return (
                      <div key={q.id} className="space-y-1.5 font-mono">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-[#00C8FF] text-[11px] font-sans truncate max-w-[150px]">
                            {q.title}
                          </span>
                          <span className="font-mono text-cyan-400/80 text-[10px] font-black">
                            {q.currentValue}/{q.targetValue}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-none border border-cyan-500/25 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#005B82] to-[#00D4FF] transition-all duration-300 relative"
                            style={{ width: `${currentPct}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateToTab("character")}
              className="w-full mt-6 py-2 bg-[#022136] hover:bg-[#003B5C] text-[#00D4FF] font-black uppercase text-[10px] tracking-wider border border-[#00D4FF]/30 hover:border-[#00D4FF] transition-colors cursor-pointer rounded-none"
              style={{ minHeight: "38px" }}
            >
              System Quests Terminal
            </button>
          </div>
        </div>

        {/* Campfire Streaks quick dashboard with burning spirit fire SVG */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg relative">
          <div>
            <h4 className="text-sm font-black text-amber-500 font-mono uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Flame className="w-4 h-4 text-amber-500 animate-bounce" /> SYSTEM HEURISTIC FIRE STREAK
            </h4>

            <div className="flex items-center gap-4 py-2">
              <div className="text-4xl font-black font-mono text-white tracking-tight flex items-baseline gap-1">
                {currentUser.streak}
                <span className="text-xs uppercase text-gray-500 font-bold block">Days Hot</span>
              </div>

              {/* Curated animated Spirit Fire SVG representation */}
              <div className="ml-auto">
                <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow-[0_0_15px_rgba(249,115,22,0.65)] filter">
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
            <p className="text-gray-400 text-xs mt-1.5 font-mono leading-relaxed">
              Keep the system link active. Skipping a day triggers punishment system logs!
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab("workout")}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-purple-950 to-slate-900 text-yellow-400 font-black uppercase border border-purple-500/20 text-xs tracking-wider rounded-xl hover:scale-[1.01] transition-transform cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            Start Training Ritual
          </button>
        </div>
      </div>

      {/* Recent history log feed */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <h4 className="text-sm font-black text-gray-300 font-mono uppercase tracking-widest flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#00C8FF]" /> System Logged Clearances
        </h4>

        {recentWorkouts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-gray-500 font-mono text-xs">
            No logged rituals logged yet. Begin your ritual to record points.
          </div>
        ) : (
          <div className="space-y-3.5 divide-y divide-slate-800 overflow-hidden">
            {recentWorkouts.map((workout, idx) => (
              <div key={workout.id} className={`flex justify-between items-center py-2.5 ${idx !== 0 ? "pt-3.5" : ""}`}>
                <div className="text-left font-sans">
                  <span className="text-sm font-extrabold text-[#00C8FF] block">{workout.exerciseName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5 uppercase">
                    <span>{workout.category}</span>
                    <span>•</span>
                    <span>Intensity {workout.intensity}/5</span>
                    <span>•</span>
                    <span>{workout.sets > 0 ? `${workout.sets}x${workout.reps}` : `${workout.duration} mins`}</span>
                  </div>
                </div>

                <div className="text-right font-mono self-center">
                  <span className="text-[#00C8FF] font-black text-xs block">+{workout.xpGained} XP</span>
                  <span className="text-[9px] text-gray-500 block font-bold">
                    {new Date(workout.loggedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSystemWindow && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Holographic Glowing Card Container with Cyber Hex bordering pattern */}
          <div className="relative w-full max-w-sm bg-[#091124] border-2 border-[#00D4FF]/45 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,212,255,0.30)] overflow-hidden">
            
            {/* Cyber Scanline Laser animation bar */}
            <div 
              className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent shadow-[0_0_15px_#00D4FF] opacity-90 pointer-events-none"
              style={{
                animation: "scanLine 3s linear infinite",
              }}
            />

            {/* Glowing Custom Tech corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00D4FF]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00D4FF]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00D4FF]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00D4FF]" />

            {/* Monospaced System Content */}
            <div className="relative z-10 space-y-4 font-mono text-left">
              <div className="flex items-center justify-between border-b border-[#00D4FF]/25 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#00D4FF] animate-pulse" />
                  <h3 className="text-sm font-black text-[#00D4FF] tracking-wider uppercase">
                    SYSTEM ALERT HUD
                  </h3>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25 rounded">
                  SYS_V2.10
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-[#00D4FF] font-black">&gt;&gt;</span>
                  <p>USER LINK CONFIRMED. RITUAL STATUS STABLE.</p>
                </div>
                {gate.active && (
                  <div className="flex gap-2 text-cyan-400">
                    <span className="text-[#00D4FF] font-black">&gt;&gt;</span>
                    <p className="font-extrabold">EMERGENCY: ACTIVE PORTAL IS RAGING IN YOUR COORDINATES.</p>
                  </div>
                )}
                {boss.hp > 0 ? (
                  <div className="flex gap-2 text-rose-400">
                    <span className="text-rose-400 font-black">&gt;&gt;</span>
                    <p>GUILD MISSION: STRIP THE Demon King IN THE BOSS LOBBY.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 text-emerald-400">
                    <span className="text-emerald-400 font-black">&gt;&gt;</span>
                    <p>CONGRATULATIONS: DEMON SOVEREIGN HAS BEEN OBLITERATED.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowSystemWindow(false)}
                  className="px-4 py-2 bg-[#001D33] hover:bg-[#002F4F] text-[#00D4FF] text-xs font-black uppercase border border-[#00D4FF]/30 hover:border-[#00D4FF] rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(0,212,255,0.15)]"
                  style={{ minHeight: "40px" }}
                >
                  DISMISS OVERLAY
                </button>
              </div>
            </div>
            
            {/* Inner aesthetic grid elements */}
            <div className="absolute inset-2 border border-cyan-500/5 rounded-2xl pointer-events-none" />
          </div>

          {/* Injected animations */}
          <style>{`
            @keyframes scanLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
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

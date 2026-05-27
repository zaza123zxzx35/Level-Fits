import React, { useState } from "react";
import { Plus, Dumbbell, Zap, Flame, Heart, Sparkles, Smile } from "lucide-react";
import { WorkoutCategory, WorkoutLog } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface WorkoutLoggerProps {
  onLogWorkout: (workout: {
    exerciseName: string;
    category: WorkoutCategory;
    sets: number;
    reps: number;
    duration: number;
    intensity: number;
    xpGained: number;
  }) => Promise<void>;
  isLogging: boolean;
  workoutHistory?: WorkoutLog[];
}

const CATEGORIES: { name: WorkoutCategory; icon: any; color: string; desc: string; stat: string }[] = [
  { name: "Strength", icon: Dumbbell, color: "from-rose-600 to-red-700", desc: "Forges STR (Strength) + VIT (Vitality)", stat: "STR" },
  { name: "Cardio", icon: Flame, color: "from-amber-500 to-orange-600", desc: "Builds END (Endurance) + AGI (Agility)", stat: "END" },
  { name: "Flexibility", icon: Heart, color: "from-emerald-500 to-teal-600", desc: "Improves AGI (Agility) + VIT (Vitality)", stat: "AGI" },
  { name: "Endurance", icon: Zap, color: "from-indigo-600 to-purple-600", desc: "Boosts VIT (Vitality) + END (Endurance)", stat: "VIT" },
];

export function WorkoutLogger({ onLogWorkout, isLogging, workoutHistory = [] }: WorkoutLoggerProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [category, setCategory] = useState<WorkoutCategory>("Strength");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [duration, setDuration] = useState(30); // minutes
  const [intensity, setIntensity] = useState(3); // 1-5
  const [successXp, setSuccessXp] = useState<number | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  const calculateXp = (): number => {
    if (category === "Strength") {
      // 50 + (sets x reps x 2) * intensity
      return (50 + (sets * reps * 2)) * intensity;
    } else {
      // 50 + (minutes x 3) * intensity
      return (50 + (duration * 3)) * intensity;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const xpGained = calculateXp();

    const workoutPayload = {
      exerciseName: exerciseName.trim(),
      category,
      sets: category === "Strength" ? sets : 0,
      reps: category === "Strength" ? reps : 0,
      duration: category !== "Strength" ? duration : 0,
      intensity,
      xpGained,
    };

    // Trigger floating damage text effect
    const floaterIndex = Date.now();
    const newFloater = {
      id: floaterIndex,
      text: `+${xpGained} XP`,
      x: Math.floor(Math.random() * 80) - 40,
      y: Math.floor(Math.random() * 45) - 10,
    };
    setFloatingTexts(prev => [...prev, newFloater]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== floaterIndex));
    }, 2000);

    await onLogWorkout(workoutPayload);

    // Show temporary XP gains feedback
    setSuccessXp(xpGained);
    setTimeout(() => {
      setSuccessXp(null);
    }, 4500);

    // Reset fields
    setExerciseName("");
  };

  const weeklyMinuteGoal = 150;
  
  // Calculate total minutes this week
  const getWeeklyMinutes = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return (workoutHistory || [])
      .filter(w => new Date(w.loggedAt).getTime() >= oneWeekAgo.getTime())
      .reduce((sum, w) => {
        // If duration is logged, use it, else default to 15 mins
        const minutes = w.duration > 0 ? w.duration : (w.sets * w.reps * 0.1 || 15);
        return sum + minutes;
      }, 0);
  };

  const minutesLogged = getWeeklyMinutes();
  const rawBossHpPercent = Math.max(0, 100 - (minutesLogged / weeklyMinuteGoal) * 100);
  const bossHpPercent = Math.round(rawBossHpPercent);

  return (
    <div className="space-y-4">
      {/* Boss HP Bar representing weekly progress */}
      <div className="p-4 bg-[#090b11]/85 border border-red-500/35 rounded-2xl space-y-2 relative overflow-hidden shadow-xl">
        {/* Subtle background red pulse */}
        <div className="absolute inset-0 bg-red-600/5 animate-[pulseRed_2.5s_ease-in-out_infinite] pointer-events-none" />

        <div className="flex justify-between items-center text-[10px] font-mono font-black relative z-10">
          <div className="flex items-center gap-1.5 text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span className="uppercase tracking-wider">WEEKLY ENCOUNTER: REYNOLD, THE BEAST MONARCH</span>
          </div>
          <span className="text-gray-500 uppercase text-[8px] bg-red-950/40 px-1 border border-red-900/30">MAX_RAID</span>
        </div>

        <div className="flex justify-between items-baseline font-mono text-[9px] font-black text-red-400/90 relative z-10">
          <span>Boss Hp Level: {bossHpPercent}%</span>
          <span className="text-red-400 font-extrabold">{Math.max(0, weeklyMinuteGoal - Math.round(minutesLogged))} / {weeklyMinuteGoal} HP Mins</span>
        </div>

        {/* HP Red Bar Slider */}
        <div className="h-2.5 w-full bg-slate-950 border border-red-950 rounded relative overflow-hidden shadow-inner z-10">
          <div 
            className="h-full bg-gradient-to-r from-red-850 via-rose-600 to-red-500 transition-all duration-700 ease-in-out"
            style={{ width: `${bossHpPercent}%` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,10,10,0.1)_50%,_rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none" />
        </div>

        <p className="text-[8.5px] text-gray-500 font-mono italic text-right mt-1 relative z-10">
          {bossHpPercent <= 0 
            ? "👑 THRESHOLD CLEAR: Beast Monarch defeated. S-RANK loot is yours." 
            : "⚔️ Burn physical calories to apply massive impact points to the monarch."}
        </p>
      </div>

      <div className="p-6 bg-slate-900/90 border border-purple-550/30 rounded-2xl shadow-xl shadow-black relative overflow-hidden pb-10">
        {/* Background radial highlight */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <h2 className="text-2xl font-bold font-sans text-yellow-400 flex items-center gap-2 mb-1.5 uppercase tracking-wide">
          <Dumbbell className="w-6 h-6 animate-bounce" /> Log Exercise Ritual
        </h2>
        <p className="text-gray-400 text-xs mb-6 font-mono uppercase tracking-wider">
          Transform physical fatigue into infinite power points.
        </p>

        {/* Floating Gain Alert popups inside layout */}
        <AnimatePresence>
          {successXp !== null && (
            <motion.div
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -40, opacity: 0 }}
              className="absolute top-4 right-4 z-40 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 border border-yellow-300 shadow-lg shadow-yellow-500/20"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
              XP Gained: +{successXp} XP!
            </motion.div>
          )}
        </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Icons Selector */}
        <div>
          <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block mb-2.5 font-mono">
            Exercise Category (Determines Stat Growth)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all duration-150 text-center select-none cursor-pointer h-24 ${
                    isSelected
                      ? "border-yellow-400 bg-purple-950/40 text-yellow-300"
                      : "border-slate-800 bg-slate-950/80 hover:bg-slate-900/50 text-gray-400"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  <Icon className={`w-6 h-6 mb-1 ${isSelected ? "text-yellow-400 scale-110" : "text-gray-400"}`} />
                  <span className="text-xs font-black uppercase font-mono">{cat.name}</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter sm:block hidden">{cat.stat} stat up</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block mb-1.5 font-mono">
            Exercise Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Deep Pit Squats, Abyssal Treadmill, Fireball Yoga"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-800 bg-slate-950/80 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-sans text-sm"
          />
        </div>

        {/* Dynamic fields (Sets & Reps vs Duration) */}
        {category === "Strength" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block mb-1.5 font-mono">
                Sets Count
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sets <= 1}
                  onClick={() => setSets(sets - 1)}
                  className="w-10 h-10 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono disabled:opacity-30 disabled:pointer-events-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-bold text-lg bg-slate-950/80 border border-slate-800 rounded-lg py-2">
                  {sets} <span className="text-[10px] text-gray-500 font-bold block">SETS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSets(sets + 1)}
                  className="w-10 h-10 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block mb-1.5 font-mono">
                Reps count
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reps <= 1}
                  onClick={() => setReps(reps - 1)}
                  className="w-10 h-10 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono disabled:opacity-30 disabled:pointer-events-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-bold text-lg bg-slate-950/80 border border-slate-800 rounded-lg py-2">
                  {reps} <span className="text-[10px] text-gray-500 font-bold block">REPS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReps(reps + 1)}
                  className="w-10 h-10 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block mb-1.5 font-mono">
              Ritual Duration (Minutes)
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={duration <= 5}
                onClick={() => setDuration(Math.max(5, duration - 5))}
                className="w-11 h-11 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                -
              </button>
              <div className="flex-1 text-center font-mono font-bold text-lg bg-slate-950/80 border border-slate-800 rounded-lg py-2">
                {duration} <span className="text-gray-500 text-xs uppercase ml-1">mins</span>
              </div>
              <button
                type="button"
                onClick={() => setDuration(duration + 5)}
                className="w-11 h-11 bg-slate-950 text-white font-black rounded-lg border border-slate-800 hover:border-purple-500 flex items-center justify-center cursor-pointer text-lg font-mono"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Intensity rating 1-5 */}
        <div>
          <div className="flex justify-between items-center mb-1.5 font-mono text-xs">
            <span className="text-gray-300 font-bold uppercase tracking-widest">Ritual Intensity</span>
            <span className="text-yellow-400 font-bold uppercase tracking-wider">Level {intensity}</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setIntensity(level)}
                className={`flex-1 h-11 rounded-lg border-2 font-mono font-bold text-sm transition-all cursor-pointer ${
                  intensity >= level
                    ? "bg-gradient-to-r from-purple-800 to-purple-600 border-purple-500 text-yellow-300 shadow shadow-purple-900"
                    : "bg-slate-950/80 border-slate-800 text-gray-500 hover:bg-slate-900"
                }`}
                style={{ minHeight: "44px" }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated XP Preview */}
        <div className="p-3 bg-purple-950/40 border-2 border-dashed border-purple-500/20 rounded-xl flex justify-between items-center font-mono">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estimated XP Yield:</span>
          <span className="text-yellow-400 font-black text-lg animate-pulse flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> {calculateXp()} XP
          </span>
        </div>

        {/* Submit Log Button */}
        <button
          type="submit"
          disabled={isLogging || !exerciseName.trim()}
          className="relative w-full h-13 bg-gradient-to-r from-purple-800 via-purple-700 to-purple-900 border-2 border-purple-500 text-white font-black uppercase text-sm tracking-widest rounded-xl shadow-xl shadow-purple-950 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-45 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {isLogging ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Log Ritual Result <Plus className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Floating XP Damage numbers popup overlays */}
      {floatingTexts.map(floater => (
        <span
          key={floater.id}
          className="absolute z-50 text-[#00D4FF] font-black text-2xl tracking-widest pointer-events-none select-none drop-shadow-[0_0_12px_rgba(0,212,255,0.95)] filter animate-[floatDmg_1.4s_cubic-bezier(0.18,0.89,0.32,1.28)_forwards]"
          style={{
            top: `55%`,
            left: `calc(50% + ${floater.x}px)`,
            marginTop: `${floater.y}px`,
          }}
        >
          {floater.text}
        </span>
      ))}
    </div>

    {/* CSS Keyframes styles */}
    <style>{`
      @keyframes floatDmg {
        0% { transform: translateY(0px) scale(0.6); opacity: 0; }
        15% { transform: translateY(-20px) scale(1.3); opacity: 1; }
        100% { transform: translateY(-130px) scale(1.65); opacity: 0; }
      }
      @keyframes pulseRed {
        0%, 100% { opacity: 0.25; }
        50% { opacity: 0.65; }
      }
    `}</style>
  </div>
  );
}

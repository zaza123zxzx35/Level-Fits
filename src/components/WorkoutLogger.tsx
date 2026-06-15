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
  { name: "Strength", icon: Dumbbell, color: "from-[#8A5CF0] to-[#5B3FA0]", desc: "Forges STR (Strength) + VIT (Vitality)", stat: "STR" },
  { name: "Cardio", icon: Flame, color: "from-[#7C5FC0] to-[#C9B8F0]", desc: "Builds END (Endurance) + AGI (Agility)", stat: "END" },
  { name: "Flexibility", icon: Heart, color: "from-[#B9A3E3] to-[#8A5CF0]", desc: "Improves AGI (Agility) + VIT (Vitality)", stat: "AGI" },
  { name: "Endurance", icon: Zap, color: "from-[#6E4FB0] to-[#9F7CE0]", desc: "Boosts VIT (Vitality) + END (Endurance)", stat: "VIT" },
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
      <div className="p-4 frost rounded-2xl space-y-2 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]">

        <div className="flex justify-between items-center text-[10px] font-monument font-semibold tracking-[0.3em] relative z-10">
          <div className="flex items-center gap-1.5 text-[#C9B8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9B8F0]" />
            <span className="uppercase tracking-wider">WEEKLY ENCOUNTER: REYNOLD, THE BEAST MONARCH</span>
          </div>
          <span className="text-[#9A8FB8] uppercase text-[8px] bg-[#15101F] px-1 border border-white/10">MAX_RAID</span>
        </div>

        <div className="flex justify-between items-baseline font-monument text-[9px] font-semibold text-[#C7BBE2] relative z-10">
          <span>Boss Hp Level: {bossHpPercent}%</span>
          <span className="text-[#C9B8F0] font-semibold">{Math.max(0, weeklyMinuteGoal - Math.round(minutesLogged))} / {weeklyMinuteGoal} HP Mins</span>
        </div>

        {/* HP Bar Slider */}
        <div className="h-2.5 w-full bg-[#15101F] border border-white/10 rounded relative overflow-hidden z-10">
          <div
            className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-700 ease-in-out"
            style={{ width: `${bossHpPercent}%` }}
          />
        </div>

        <p className="text-[8.5px] text-[#9A8FB8] font-display italic text-right mt-1 relative z-10">
          {bossHpPercent <= 0 
            ? "👑 THRESHOLD CLEAR: Beast Monarch defeated. S-RANK loot is yours." 
            : "⚔️ Burn physical calories to apply massive impact points to the monarch."}
        </p>
      </div>

      <div className="p-6 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden pb-10">

        <h2 className="text-2xl font-display font-semibold text-[#EDE6FA] flex items-center gap-2 mb-1.5 tracking-wide">
          <Dumbbell className="w-6 h-6 text-[#C9B8F0]" /> Log Exercise Ritual
        </h2>
        <p className="text-[#9A8FB8] text-xs mb-6 font-monument tracking-[0.3em] uppercase">
          Transform physical fatigue into infinite power points.
        </p>

        {/* Floating Gain Alert popups inside layout */}
        <AnimatePresence>
          {successXp !== null && (
            <motion.div
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -40, opacity: 0 }}
              className="absolute top-4 right-4 z-40 bg-[#B9A3E3] text-[#241B3A] font-semibold text-xs uppercase px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#C9B8F0]/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            >
              <Sparkles className="w-4 h-4 text-[#241B3A]" />
              XP Gained: +{successXp} XP!
            </motion.div>
          )}
        </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Icons Selector */}
        <div>
          <label className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em] block mb-2.5">
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
                  className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all duration-150 text-center select-none cursor-pointer h-24 ${
                    isSelected
                      ? "border-[#C9B8F0]/40 bg-[#3A2F58] text-[#C9B8F0]"
                      : "border-white/10 bg-[#15101F] hover:bg-[#1d1729] text-[#9A8FB8]"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  <Icon className={`w-6 h-6 mb-1 ${isSelected ? "text-[#C9B8F0] scale-110" : "text-[#9A8FB8]"}`} />
                  <span className="text-xs font-display font-semibold">{cat.name}</span>
                  <span className="text-[9px] text-[#9A8FB8] font-monument mt-0.5 uppercase tracking-tighter sm:block hidden">{cat.stat} stat up</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em] block mb-1.5">
            Exercise Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Deep Pit Squats, Abyssal Treadmill, Fireball Yoga"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#15101F] text-[#EDE6FA] placeholder-[#9A8FB8] focus:outline-none focus:border-[#C9B8F0]/50 transition-colors text-sm"
          />
        </div>

        {/* Dynamic fields (Sets & Reps vs Duration) */}
        {category === "Strength" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em] block mb-1.5">
                Sets Count
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sets <= 1}
                  onClick={() => setSets(sets - 1)}
                  className="w-10 h-10 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg disabled:opacity-30 disabled:pointer-events-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  -
                </button>
                <div className="flex-1 text-center font-display font-semibold text-lg bg-[#15101F] border border-white/10 rounded-xl py-2 text-[#EDE6FA]">
                  {sets} <span className="text-[10px] text-[#9A8FB8] font-monument tracking-[0.3em] block">SETS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSets(sets + 1)}
                  className="w-10 h-10 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em] block mb-1.5">
                Reps count
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reps <= 1}
                  onClick={() => setReps(reps - 1)}
                  className="w-10 h-10 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg disabled:opacity-30 disabled:pointer-events-none"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  -
                </button>
                <div className="flex-1 text-center font-display font-semibold text-lg bg-[#15101F] border border-white/10 rounded-xl py-2 text-[#EDE6FA]">
                  {reps} <span className="text-[10px] text-[#9A8FB8] font-monument tracking-[0.3em] block">REPS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReps(reps + 1)}
                  className="w-10 h-10 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em] block mb-1.5">
              Ritual Duration (Minutes)
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={duration <= 5}
                onClick={() => setDuration(Math.max(5, duration - 5))}
                className="w-11 h-11 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                -
              </button>
              <div className="flex-1 text-center font-display font-semibold text-lg bg-[#15101F] border border-white/10 rounded-xl py-2 text-[#EDE6FA]">
                {duration} <span className="text-[#9A8FB8] text-xs uppercase ml-1">mins</span>
              </div>
              <button
                type="button"
                onClick={() => setDuration(duration + 5)}
                className="w-11 h-11 bg-[#15101F] text-[#EDE6FA] font-semibold rounded-xl border border-white/10 hover:border-[#C9B8F0]/50 flex items-center justify-center cursor-pointer text-lg"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Intensity rating 1-5 */}
        <div>
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="text-[#C9B8F0]/60 font-monument uppercase tracking-[0.3em]">Ritual Intensity</span>
            <span className="text-[#C9B8F0] font-monument uppercase tracking-[0.3em]">Level {intensity}</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setIntensity(level)}
                className={`flex-1 h-11 rounded-xl border font-display font-semibold text-sm transition-all cursor-pointer ${
                  intensity >= level
                    ? "bg-[#3A2F58] border-[#C9B8F0]/40 text-[#C9B8F0]"
                    : "bg-[#15101F] border-white/10 text-[#9A8FB8] hover:bg-[#1d1729]"
                }`}
                style={{ minHeight: "44px" }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated XP Preview */}
        <div className="p-3 frost rounded-xl flex justify-between items-center">
          <span className="text-[#C9B8F0]/60 text-xs font-monument uppercase tracking-[0.3em]">Estimated XP Yield:</span>
          <span className="text-[#C9B8F0] font-display font-semibold text-lg flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> {calculateXp()} XP
          </span>
        </div>

        {/* Submit Log Button */}
        <button
          type="submit"
          disabled={isLogging || !exerciseName.trim()}
          className="relative w-full h-13 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-display font-semibold text-sm tracking-wide rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-45 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {isLogging ? (
            <div className="w-5 h-5 border-2 border-[#241B3A] border-t-transparent rounded-full animate-spin" />
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
          className="absolute z-50 text-[#C9B8F0] font-display font-semibold text-2xl tracking-widest pointer-events-none select-none animate-[floatDmg_1.4s_cubic-bezier(0.18,0.89,0.32,1.28)_forwards]"
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

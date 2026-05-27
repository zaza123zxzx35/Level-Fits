import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, Sword, Shield, Zap, Skull, ShieldAlert } from "lucide-react";
import { CharacterClass } from "../types";

interface LevelUpSplashProps {
  isVisible: boolean;
  newLevel: number;
  characterClass: CharacterClass;
  onClose: () => void;
}

export function LevelUpSplash({ isVisible, newLevel, characterClass, onClose }: LevelUpSplashProps) {
  // Stat gains depending on class
  const getGains = () => {
    switch (characterClass) {
      case "Warrior":
        return { STR: "+4", VIT: "+3", END: "+2", AGI: "+1" };
      case "Mage":
        return { END: "+4", AGI: "+3", VIT: "+2", STR: "+1" };
      case "Assassin":
        return { AGI: "+5", VIT: "+3", STR: "+1", END: "+1" };
    }
  };

  const gains = getGains();

  // Arise deep voice narration trigger
  useEffect(() => {
    if (!isVisible) return;
    try {
      // Speak deep narration
      const utterance = new SpeechSynthesisUtterance("You have leveled up. The system acknowledges you.");
      const voices = window.speechSynthesis.getVoices();
      // Look for a deep english voice
      const deepVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("deep") || v.lang.startsWith("en"));
      if (deepVoice) utterance.voice = deepVoice;
      utterance.pitch = 0.45; // lower pitch
      utterance.rate = 0.85; // slower speed for heavy dramatic style
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log("Audio speech synthesis not playing due to user interaction or container limitations", e);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#000000]/95 backdrop-blur-md overflow-hidden"
        >
          {/* Glowing Dark Purple and Blue Holographic Halos */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-900/35 blur-[140px] pointer-events-none animate-pulse" />
          <div className="absolute w-[450px] h-[450px] rounded-full bg-[#00C8FF]/15 blur-[130px] pointer-events-none" />

          {/* Animated Purple particles rising in background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "110vh", x: `${Math.random() * 100}vw`, opacity: 0 }}
                animate={{ 
                  y: "-10vh", 
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{ 
                  duration: Math.random() * 5 + 4, 
                  repeat: Infinity, 
                  delay: Math.random() * 3 
                }}
                className="absolute w-3 h-3 bg-purple-500 rounded-full blur-[2px]"
              />
            ))}
          </div>

          {/* Holographic S-Rank Crest container */}
          <motion.div
            initial={{ scale: 0.3, y: -100, rotate: -30 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", damping: 11, stiffness: 70, delay: 0.2 }}
            className="relative flex items-center justify-center w-44 h-44 bg-gradient-to-b from-purple-950 via-slate-950 to-purple-950 border-4 border-purple-500 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.6)]"
          >
            <Skull className="w-24 h-24 text-[#00C8FF] filter drop-shadow-[0_0_15px_#00C8FF] animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-[#00C8FF]/40 opacity-50 m-1"
            />
          </motion.div>

          {/* Holographic Title banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-center space-y-2 relative"
          >
            <div className="px-5 py-1 bg-purple-950/80 border border-purple-500/30 text-xs font-mono font-black text-[#00C8FF] uppercase tracking-widest rounded-full shadow-lg">
              SYSTEM LEVEL SYNCHRONIZED
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#00C8FF] to-blue-400 font-sans text-center filter drop-shadow-[0_0_20px_rgba(0,200,255,0.4)]">
              ARISE!
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-3 text-lg text-yellow-300 font-extrabold uppercase tracking-widest font-mono text-center"
          >
            Level {newLevel} Reached
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-purple-300 font-bold bg-purple-950/40 px-3 py-1 border border-purple-500/20 rounded-full font-mono mt-1"
          >
            THE SYSTEM ACKNOWLEDGES YOU
          </motion.p>

          {/* Stat Upgrades Display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 90 }}
            className="w-full max-w-sm mt-8 p-6 bg-slate-950 border-2 border-[#00C8FF]/30 rounded-2xl shadow-2xl relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-purple-900 border border-purple-500 text-yellow-300 text-[10px] font-black uppercase rounded-full tracking-widest font-mono shadow-md">
              Monarch Stats Enhanced
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 font-mono">
              <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-rose-500/20">
                <Sword className="w-5 h-5 text-rose-500" />
                <div className="text-left">
                  <span className="text-gray-405 text-[9px] block">STRENGTH</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-xs font-bold">STR</span>
                    <span className="text-emerald-400 text-xs font-black">{gains.STR}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-[#00C8FF]/20">
                <Zap className="w-5 h-5 text-[#00C8FF]" />
                <div className="text-left">
                  <span className="text-gray-405 text-[9px] block">AGILITY</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-xs font-bold">AGI</span>
                    <span className="text-emerald-400 text-xs font-black">{gains.AGI}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-amber-500/20">
                <Shield className="w-5 h-5 text-amber-500" />
                <div className="text-left">
                  <span className="text-gray-405 text-[9px] block">ENDURANCE</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-xs font-bold">END</span>
                    <span className="text-emerald-400 text-xs font-black">{gains.END}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-905/60 rounded-xl border border-purple-500/20">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div className="text-left">
                  <span className="text-gray-405 text-[9px] block">VITALITY</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-xs font-bold">VIT</span>
                    <span className="text-emerald-400 text-xs font-black">{gains.VIT}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
            onClick={onClose}
            className="relative overflow-hidden group mt-10 px-8 py-3.5 bg-[#0D0D1A] border-2 border-[#00C8FF] text-[#00C8FF] text-sm font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Acknowledge System <Sparkles className="w-4 h-4 animate-spin" />
            </span>
            <div className="absolute inset-0 bg-cyan-500/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

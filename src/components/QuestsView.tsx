import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, Quest, WorkoutLog } from "../types";
import { Sparkles, Star, Flame, Wand2, CheckCircle, Clock, AlertCircle, Play, ShieldEllipsis, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuestsViewProps {
  currentUser: UserProfile;
  workoutHistory: WorkoutLog[];
  onClaimQuest: (quest: Quest) => Promise<void>;
  onRefreshProfile: () => Promise<void>;
}

export function QuestsView({ currentUser, workoutHistory, onClaimQuest, onRefreshProfile }: QuestsViewProps) {
  const [questsList, setQuestsList] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [summoning, setSummoning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Push Notifications Setup State
  const [notifTime, setNotifTime] = useState("20:00");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPopup, setNotifPopup] = useState(false);

  // Fetch user active quests
  const fetchQuests = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const questsRef = collection(db, `users/${currentUser.uid}/quests`);
      const snapshot = await getDocs(questsRef);
      const activeQuests: Quest[] = [];
      snapshot.forEach((docSnap) => {
        activeQuests.push(docSnap.data() as Quest);
      });
      setQuestsList(activeQuests);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to read trials list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [currentUser]);

  // Handle Summon (Generate new weekly trials using Gemini Server Route)
  const handleSummonQuests = async () => {
    setSummoning(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      // Fetch dynamic medieval quests from Express backend
      const response = await fetch("/api/generate-quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workoutHistory }),
      });

      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Quest generator rejected request.");
      }

      const generatedQuests = body.quests;

      // Clean old quests in batch
      const questsRef = collection(db, `users/${currentUser.uid}/quests`);
      const oldQuestsSnapshot = await getDocs(questsRef);
      const batch = writeBatch(db);

      oldQuestsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // Write new quests to Firestore
      generatedQuests.forEach((q: any) => {
        const newQuestId = Math.random().toString(36).substring(2, 11);
        const questData: Quest = {
          id: newQuestId,
          userId: currentUser.uid,
          title: q.title,
          description: q.description,
          type: q.type,
          targetValue: q.targetValue,
          currentValue: 0,
          completed: false,
          xpReward: q.xpReward,
          badgeReward: q.badgeReward || undefined,
          createdAt: new Date().toISOString(),
        };
        const docRef = doc(db, `users/${currentUser.uid}/quests`, newQuestId);
        batch.set(docRef, questData);
      });

      await batch.commit();
      setSuccessMessage("Weekly dynamic quests summoned from the void!");
      fetchQuests();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to dial RPG Quest Master.");
    } finally {
      setSummoning(false);
    }
  };

  // Turn on push reminders simulation
  const handleTogglePushNotifications = () => {
    if (!notifEnabled) {
      setNotifEnabled(true);
      setNotifPopup(true);
      // Actual browser Notification API access attempt if granted
      if ("Notification" in window) {
        Notification.requestPermission();
      }
      setTimeout(() => setNotifPopup(false), 3000);
    } else {
      setNotifEnabled(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campfire Bonfire Daily Streak panel */}
      <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

        {/* Campfire graphics indicator */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-slate-950 border-2 border-dashed border-amber-500/40 rounded-full shadow-lg shadow-amber-500/10">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center justify-center"
          >
            <Flame className="w-12 h-12 text-amber-500 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]" />
          </motion.div>
          <div className="absolute -bottom-1 px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] font-mono tracking-wider rounded border border-amber-400">
            STREAK
          </div>
        </div>

        <div className="text-center md:text-left flex-1 font-mono">
          <h3 className="text-xl font-black text-white flex items-center justify-center md:justify-start gap-1">
            {currentUser.streak} Day Heat Streak
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Feed the gym bonfire daily. A lapse of 24 hours of training will break the heat streak.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {/* Simulated Push notices button */}
            <button
              onClick={handleTogglePushNotifications}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                notifEnabled
                  ? "bg-emerald-950/40 border-emerald-400 text-emerald-300"
                  : "bg-slate-900 border-slate-700 hover:border-amber-500 text-gray-400 hover:text-white"
              }`}
              style={{ minHeight: "44px" }}
            >
              <BellRing className="w-3.5 h-3.5" />
              {notifEnabled ? `Active (Reminding at ${notifTime})` : "Streak Reminders"}
            </button>

            {notifEnabled && (
              <input
                type="time"
                value={notifTime}
                onChange={(e) => setNotifTime(e.target.value)}
                className="bg-slate-900/80 text-yellow-300 border border-slate-700 text-xs font-mono h-10 px-2.5 rounded-lg"
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Push Reminder Notice Banner */}
      <AnimatePresence>
        {notifPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="p-4 bg-emerald-900/90 border-2 border-emerald-400 text-white font-mono text-xs rounded-xl shadow-2xl flex items-center gap-2"
          >
            <BellRing className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-emerald-300">Push Notifications Enabled!</span>
              We will transmit telepathic workout alerts daily to protect your streak.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Quests summon head */}
      <div className="p-6 bg-slate-900/90 border border-purple-550/20 rounded-2xl relative shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-[#FFD700] uppercase tracking-wide flex items-center gap-2">
              <Star className="w-5 h-5" /> Weekly Trials from the Void
            </h2>
            <p className="text-gray-400 text-xs font-mono mt-0.5">
              Personalized guilds mandates synthesized dynamically based on your workout history.
            </p>
          </div>

          <button
            onClick={handleSummonQuests}
            disabled={summoning}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-800 to-purple-600 border border-purple-400 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            style={{ minHeight: "44px" }}
          >
            <Wand2 className={`w-4 h-4 ${summoning ? "animate-spin" : ""}`} />
            {summoning ? "Summoning Trials..." : "Recast Trials"}
          </button>
        </div>

        {errorMessage && <p className="text-red-400 text-xs font-mono mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-emerald-400 text-xs font-mono mb-4">{successMessage}</p>}

        {/* Quests Lists */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-6 text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Deciphering trial scripts...
            </div>
          )}

          {!loading && questsList.length === 0 && (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 px-6">
              <Wand2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-xs font-mono">The prompt scroll is empty.</p>
              <p className="text-gray-500 text-[10px] mt-1">Tap the Summon button above to invite your first trials.</p>
            </div>
          )}

          {!loading &&
            questsList.map((quest) => {
              const currentProgress = Math.min(quest.currentValue, quest.targetValue);
              const progressPct = (currentProgress / quest.targetValue) * 100;
              const isClaimable = currentProgress >= quest.targetValue && !quest.completed;

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border transition-all ${
                    quest.completed
                      ? "bg-slate-950/40 border-slate-900 opacity-60"
                      : "bg-slate-950/80 border-slate-800/80 hover:border-slate-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${quest.completed ? "text-gray-500 line-through" : "text-purple-300"}`}>
                          {quest.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-gray-400 uppercase font-mono tracking-tight">
                          {quest.type}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs font-sans max-w-xl">{quest.description}</p>
                    </div>

                    <div className="text-right whitespace-nowrap self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end font-mono">
                      <span className="text-xs text-yellow-400 font-bold block">+{quest.xpReward} XP</span>
                      {quest.badgeReward && (
                        <span className="text-[10px] text-purple-400 font-semibold block uppercase">🏷️ {quest.badgeReward}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress panel */}
                  <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-gray-500">
                        <span>Trial Objective Progress</span>
                        <span>
                          {currentProgress} / {quest.targetValue} {quest.type === "Strength" ? "Sets" : quest.type === "Streak" ? "Days" : "Mins"}
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-yellow-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    {quest.completed ? (
                      <div className="px-4 py-2 bg-slate-900 rounded-lg text-[11px] font-black uppercase text-emerald-500 font-mono tracking-wider flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Finished
                      </div>
                    ) : isClaimable ? (
                      <button
                        onClick={() => onClaimQuest(quest)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase rounded-lg border border-yellow-300 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer text-center"
                        style={{ minHeight: "44px" }}
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-slate-900 text-gray-500 text-[10px] font-mono uppercase rounded-lg tracking-wider flex items-center justify-center gap-1.5 border border-slate-950">
                        <Clock className="w-3.5 h-3.5" /> Working
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
